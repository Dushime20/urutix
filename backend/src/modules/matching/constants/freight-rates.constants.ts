/**
 * FREIGHT COST CONSTANTS
 * ======================
 * Industry-standard cost breakdown for international road freight.
 *
 * Sources:
 *  - ATRI "Operational Cost of Trucking" 2024 (USA baseline)
 *  - IRU European Road Freight Rate Benchmark 2024/2025
 *  - World Bank transport cost studies (developing regions)
 *
 * All base rates are in USD per km for a standard FTL diesel truck.
 * Regional multipliers adjust for local cost-of-living, fuel prices,
 * labour rates, and infrastructure quality.
 *
 * ─────────────────────────────────────────────────────────────────
 * HOW estimatedCost IS CALCULATED
 * ─────────────────────────────────────────────────────────────────
 *
 *  1. BASE OPERATING COST (USD/km) — from ATRI 2024 USA data, converted
 *     from per-mile to per-km (÷ 1.60934):
 *
 *     fuel          = $0.553/mile  → $0.344/km
 *     driver wages  = $0.779/mile  → $0.484/km
 *     driver benefi = $0.188/mile  → $0.117/km
 *     maintenance   = $0.202/mile  → $0.126/km
 *     insurance     = $0.099/mile  → $0.062/km
 *     truck payment = $0.360/mile  → $0.224/km
 *     ─────────────────────────────────────────
 *     TOTAL                         $1.357/km  (≈ $1.40 rounded)
 *
 *  2. REGIONAL MULTIPLIER — adjusts for local market conditions.
 *     Derived from World Bank & IRU comparative studies.
 *
 *  3. LOAD FACTOR — (weightKg / truckCapacityKg).
 *     A truck running at 40% capacity costs MORE per tonne-km than
 *     one running at 90%.  We scale cost by actual utilisation.
 *
 *  4. TRUCK SURCHARGES — applied on top of the adjusted base.
 *
 *  Final formula:
 *    baseCost      = routeDistanceKm × COST_PER_KM × regionalMultiplier
 *    loadFactor    = weightKg / truckCapacityKg   (capped 0.1–1.0)
 *    adjustedCost  = baseCost × (0.4 + 0.6 × loadFactor)
 *    estimatedCost = adjustedCost × surchageMultiplier
 *
 *  The 0.4 + 0.6 × loadFactor formula means:
 *    - Fixed costs (depreciation, insurance, driver) = 40% of total
 *      → always incurred regardless of load
 *    - Variable costs (fuel, maintenance) = 60% of total
 *      → scale with how full the truck is
 */

// ─── Base cost components (USD per km, FTL diesel, ATRI 2024) ─────────────────

export const COST_COMPONENTS_USD_PER_KM = {
  fuel:           0.344,   // $0.553/mile ATRI 2024
  driverWages:    0.484,   // $0.779/mile ATRI 2024
  driverBenefits: 0.117,   // $0.188/mile ATRI 2024
  maintenance:    0.126,   // $0.202/mile ATRI 2024
  insurance:      0.062,   // $0.099/mile ATRI 2024
  truckPayment:   0.224,   // $0.360/mile ATRI 2024
} as const;

/** Total base operating cost in USD per km (FTL diesel, USA baseline) */
export const BASE_COST_USD_PER_KM: number =
  Object.values(COST_COMPONENTS_USD_PER_KM).reduce((a, b) => a + b, 0); // ~1.357

// ─── Regional multipliers ────────────────────────────────────────────────────
//
// Source: World Bank "Why transport costs are stifling growth" (2024),
//         IRU European Road Freight Rate Benchmarks 2024/2025,
//         FIATA / World Bank developing-region studies.
//
// Multiplier 1.00 = USA baseline cost level.
// >1.00 = more expensive than USA  |  <1.00 = cheaper than USA

export const REGIONAL_MULTIPLIERS: Record<string, number> = {
  // ── North America ──────────────────────────────────────────────────────────
  US: 1.00,   // ATRI baseline
  CA: 1.05,   // Canada — slightly higher labour & regulatory costs
  MX: 0.75,   // Mexico — lower labour, higher fuel inefficiency

  // ── Europe ────────────────────────────────────────────────────────────────
  // IRU 2024: EUR 0.50–2.00/km full truck; midpoint ~€1.10 ≈ $1.20
  // vs USA $1.36 → multiplier ~0.88
  DE: 0.92,   // Germany — high wages, excellent roads
  FR: 0.90,   // France — similar to Germany
  GB: 0.95,   // UK — high labour + island premium
  PL: 0.72,   // Poland — lower labour, major EU freight hub
  NL: 0.93,   // Netherlands — gateway/port premium
  ES: 0.82,   // Spain
  IT: 0.85,   // Italy
  TR: 0.68,   // Turkey — lower labour, strategic crossroads

  // ── Middle East ───────────────────────────────────────────────────────────
  SA: 0.60,   // Saudi Arabia — very low fuel cost
  AE: 0.65,   // UAE
  IL: 0.90,   // Israel

  // ── Asia ──────────────────────────────────────────────────────────────────
  CN: 0.55,   // China — lower labour, high volume, good highways
  IN: 0.45,   // India — very low labour, older fleet, poor roads
  JP: 1.10,   // Japan — high labour, excellent infrastructure
  KR: 0.95,   // South Korea
  SG: 1.05,   // Singapore — tiny geography but high overheads
  TH: 0.50,   // Thailand
  ID: 0.48,   // Indonesia
  VN: 0.42,   // Vietnam — low labour, growing logistics market
  PH: 0.52,   // Philippines

  // ── Latin America ─────────────────────────────────────────────────────────
  BR: 0.65,   // Brazil — large distances, variable infrastructure
  AR: 0.60,   // Argentina
  CL: 0.70,   // Chile
  CO: 0.68,   // Colombia
  PE: 0.65,   // Peru

  // ── Africa ────────────────────────────────────────────────────────────────
  // World Bank 2024: African logistics costs 50–80% higher per km than USA
  // due to poor roads, multiple border stops, and informal barriers.
  ZA: 0.90,   // South Africa — best infrastructure on continent
  NG: 1.45,   // Nigeria — poor roads, high fuel, informal costs
  ET: 1.50,   // Ethiopia — landlocked, limited roads
  KE: 1.35,   // Kenya — Mombasa corridor
  TZ: 1.40,   // Tanzania
  RW: 1.45,   // Rwanda — landlocked premium
  GH: 1.30,   // Ghana
  EG: 0.80,   // Egypt — decent infrastructure, lower labour

  // ── Oceania ───────────────────────────────────────────────────────────────
  AU: 1.15,   // Australia — remote distances, high labour
  NZ: 1.10,   // New Zealand
} as const;

/** Fallback multiplier for any country not listed above */
export const DEFAULT_REGIONAL_MULTIPLIER = 0.90;

// ─── Truck surcharges (multiplicative on top of base cost) ───────────────────

export const TRUCK_SURCHARGES = {
  /** Refrigerated / reefer trailer — extra energy + maintenance */
  REFRIGERATION: 0.25,   // +25%

  /** Hazardous-materials permit — extra compliance + insurance */
  HAZMAT: 0.15,          // +15%

  /** Electric vehicle — no diesel fuel cost, lower maintenance */
  ELECTRIC_DISCOUNT: 0.12, // −12% (bigger saving than old 5% since fuel is biggest component)
} as const;

// ─── Revenue / market rates ───────────────────────────────────────────────────

/**
 * Carrier markup over cost — the profit margin a carrier typically
 * adds when there is no offeredPrice from the cargo owner.
 * Industry standard spot-market markup: 15–25% over cost.
 */
export const CARRIER_MARKUP_OVER_COST = 0.20;   // 20%

/**
 * Market benchmark markup used for recommendedPrice.
 * Slightly above carrier cost, below full spot rate.
 */
export const MARKET_BENCHMARK_MARKUP = 0.10;    // 10% above cost

/** Minimum cost floor — prevents near-zero results for tiny loads */
export const MINIMUM_COST_USD = 25;
