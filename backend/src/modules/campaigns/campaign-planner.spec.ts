import { buildCampaignPlan, CampaignIntent, FTL_WEIGHT_KG } from './campaign-planner';
import { parseCampaignPrompt } from './campaign-intent-parser';

const kigali = { id: 'kigali-rw', name: 'Kigali', country: 'Rwanda', countryCode: 'RW', lat: -1.9441, lng: 30.0619 };
const nairobi = { id: 'nairobi-ke', name: 'Nairobi', country: 'Kenya', countryCode: 'KE', lat: -1.2921, lng: 36.8219 };
const kampala = { id: 'kampala-ug', name: 'Kampala', country: 'Uganda', countryCode: 'UG', lat: 0.3476, lng: 32.5825 };
const huye = { id: 'huye-rw', name: 'Huye', country: 'Rwanda', countryCode: 'RW', lat: -2.5967, lng: 29.7394 };

const baseIntent = (): CampaignIntent => ({
  prompt: 'I need 100,000 units of bottled water delivered from Kigali to Nairobi, Kampala and Huye next month',
  productName: 'Bottled water',
  totalUnits: 100_000,
  kgPerUnit: 2,
  m3PerUnit: 0.004,
  valuePerUnit: 8,
  origin: kigali,
  destinations: [nairobi, kampala, huye],
  windowStart: '2026-09-01T00:00:00.000Z',
  windowEnd: '2026-09-30T00:00:00.000Z',
  budgetCap: 0,
  slaPercent: 95,
  preferSharedTrucks: true,
  requireInsurance: true,
  fundOnEscrow: true,
  goodsReady: true,
  currencyCode: 'USD',
});

describe('parseCampaignPrompt', () => {
  it('reads units, origin, city count, countries, and next month', () => {
    const parsed = parseCampaignPrompt(
      'I need 100,000 units of bottled water delivered from Kigali to 20 cities in Kenya and Uganda next month',
    );
    expect(parsed.totalUnits).toBe(100000);
    expect(parsed.originText).toMatch(/kigali/i);
    expect(parsed.cityCount).toBe(20);
    expect(parsed.countryHints.join(' ')).toMatch(/kenya/i);
    expect(parsed.productName).toMatch(/bottled water/i);
    expect(parsed.windowStart).toBeDefined();
  });

  it('reads named destination cities', () => {
    const parsed = parseCampaignPrompt('Move 5000 units from Nairobi to Mombasa, Kisumu and Kampala');
    expect(parsed.namedCities).toEqual(expect.arrayContaining(['Mombasa', 'Kisumu', 'Kampala']));
  });
});

describe('buildCampaignPlan', () => {
  it('allocates every unit across destinations', () => {
    const plan = buildCampaignPlan(baseIntent());
    const units = plan.destinations.reduce((sum, dest) => sum + dest.units, 0);
    expect(units).toBe(100_000);
    expect(plan.destinations).toHaveLength(3);
  });

  it('uses LTL when a city slice is below 70% of a truck', () => {
    const plan = buildCampaignPlan({
      ...baseIntent(),
      totalUnits: 6_000,
      kgPerUnit: 2,
    });
    const dest = plan.destinations.find((d) => d.cityId === 'huye-rw');
    expect(dest).toBeDefined();
    expect(dest!.weightKg).toBeLessThan(FTL_WEIGHT_KG * 0.7);
    expect(dest!.loadType).toBe('LTL');
    expect(plan.ltlCount).toBeGreaterThan(0);
  });

  it('flags cross-border destinations and quotes cargo cover', () => {
    const plan = buildCampaignPlan(baseIntent());
    expect(plan.destinations.find((d) => d.cityId === 'nairobi-ke')?.crossBorder).toBe(true);
    expect(plan.destinations.find((d) => d.cityId === 'huye-rw')?.crossBorder).toBe(false);
    expect(plan.insurancePremium).toBe(Math.round(100_000 * 8 * 0.0045));
    expect(plan.estimatedAdvance).toBe(Math.round(plan.estimatedFreight * 0.7));
  });

  it('blocks over-budget plans', () => {
    const plan = buildCampaignPlan({ ...baseIntent(), budgetCap: 1 });
    expect(plan.overBudget).toBe(true);
  });
});
