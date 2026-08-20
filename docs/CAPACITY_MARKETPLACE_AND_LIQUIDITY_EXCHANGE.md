# Capacity Marketplace and Logistics Liquidity Exchange

**Document type:** Systems analysis and product integration blueprint  
**Audience:** Product, engineering, operations, lending partners  
**Scope:** How UrutiX should add unused-capacity selling, three-sided logistics liquidity, and the combined African freight stack — without rebuilding what already works  
**Related:** [The Autonomous Supply-Chain Company](./AUTONOMOUS_SUPPLY_CHAIN_OPERATOR.md) (intent layer above this trip spine)  
**Principle:** Extend the existing trip spine. Do not launch a second marketplace.

---

## 1. Executive recommendation

UrutiX is already a **demand-led freight marketplace plus fleet operating system**. Cargo owners publish loads. Truck owners bid or accept AI matches. The platform then runs trip, tracking, ePOD, escrow, and trip-linked lending.

The three requested capabilities are **not three new products**. They are one operating model:

| Request | What it really is on UrutiX | Build vs reuse |
|---------|-----------------------------|----------------|
| 1. Airbnb for cargo capacity | Invert supply: a truck with leftover space becomes a **sellable listing**, not only a bidder on full loads | **New inventory object** on top of existing matching, LTL flag, availability engine, and commission pattern |
| 2. Logistics Liquidity Exchange | Connect **cargo demand ↔ capacity ↔ capital** on the same trip | **New exchange UX and matching rules**. Lending, escrow, mobile money, and lender policies already exist |
| 3. Combined African stack | One corridor trip that also finances the truck, fuels the driver, insures the cargo, clears the border, dispatches the unit, and settles automatically | **Compose existing modules** into one lifecycle. Fill specific product gaps (bindable insurance, residual capacity, auto-payout, wired fuel wallet) |
| 4. Autonomous supply-chain company | A company states “100,000 units to 20 cities next month”; AI plans and executes | **Not a fourth marketplace.** First product is a **Distribution Campaign** that explodes intent into loads/trips. Full buy→stock→reorder is a later layer. See companion document. |

**Do this:** treat a Kigali → Nairobi trip as the unit of value. Every new feature must attach to that trip. Campaigns sit *above* trips; they do not replace them.  
**Do not do this:** build a separate “capacity app”, a separate “lending marketplace”, or confuse the existing **SaaS credit marketplace** (AI matching credits) with freight or capital liquidity.

**Efficiency rule:** Phase 0 is to **wire features that already exist but are orphaned** (fuel wallet UI, scheduling/utilization, backhaul page, dispatch route). Phase 1 is residual capacity. Phase 2 is three-sided capital matching. Phase 3 is insurance + border pack + auto settlement. That order produces revenue earliest and avoids parallel architecture.

---

## 2. What the platform already is (current state)

This section is based on live cargo-owner and truck-owner journeys, layouts, and backend modules — not on older journey docs that still describe mock matching.

### 2.1 Cargo owner today

**Layout and entry:** `CargoOwnerLayout` under `/dashboard` (canonical) and `/cargo-owner` (incomplete alias). Navigation lives in `DashboardHeader` as **Supply Chain Hub** and **Intelligence & Capital**.

**Working journey**

1. Create cargo (`EnhancedCargoForm`, templates, drafts, bulk upload). Loads already have weight, volume, dimensions, hazmat, temperature, insurance *value*, `loadType` including **FTL / LTL**, and `autoMatchEnabled`.
2. Choose **Smart Matching** or **Publish for Bid** (`EnhancedJourneyFlow`, `SmartMatchingHub`, `UnifiedBiddingManagement`).
3. Accept a match or bid → trip is created.
4. Track (`LiveTracking`, trip detail).
5. Pay via unified financial hub: pending payments, invoices, expenses, loan requests. Backend supports **70% advance / 30% final**, escrow hold/release, and mobile money.
6. Confirm ePOD (`CargoOwnerEpodDashboard`).
7. Request trip financing (`RequestFinancingModal`, `/dashboard/loan-requests`).
8. Customs inspections and document vault exist as shipper-facing views.

**What cargo owners cannot do today**

- Browse leftover truck space as inventory (“40% empty on a truck already going Kigali → Nairobi”).
- Book a share of an in-motion or already-booked truck (true LTL consolidation).
- Buy a bindable cargo policy at checkout (they can only declare `insuranceValue` / `requiresInsurance`).
- See a single settlement confirmation that is the real payment path. Several `/transaction-flow` and `/settlement-processing` routes are placeholder UIs; production money moves through payments + ePOD + financial hub.

### 2.2 Truck owner today

**Layout and entry:** `FleetOwnerLayout` + `FleetDashboard` under `/dashboard/fleet`. Navigation: **Fleet & Personnel** and **Operations Hub**.

**Working journey**

1. Register trucks and drivers (`FleetFormStepper`: identity, specs, cargo capabilities, equipment, GPS, costing, driver assignment). Truck already stores `capacityWeight`, `capacityVolume`, status, and availability status.
2. Discover **demand**: Smart Matches (`TruckMatches`) and Freight Bidding (`BiddingDashboard`). Availability is checked before a bid via `BidAvailabilityChecker` and `ShipmentReservation`.
3. Run trips, live tracking, ePOD reports, financial pending payments.
4. Log fuel (`FuelPage` — consumption logs and charts).
5. Buy **platform credits** (AI matching / feature credits), not freight liquidity.
6. Search backhaul loads (`BackhaulMatchingPage` at `/dashboard/fleet/backhaul`) — city keyword search on published loads. Useful prototype, not a capacity product.

**What truck owners cannot do today**

- **Publish unused space** as a priced listing with remaining kg / m³, corridor, window, and floor price.
- Get **working-capital or fleet financing** as a first-class product. Lending is tied to `cargo_id` + `trip_id`. Driver fuel advances exist; asset/fleet CAPEX does not. The loans tab is present in FleetDashboard but the product is still trip-invoice finance.
- Use the **fuel wallet** in the live fuel tab. Wallet, advances, and budgets exist in the backend (`FuelWallet`, `DriverFuelAdvance`, `FuelBudget`) and as unused tabs (`FuelWalletTab`, `FuelAdvancesTab`, `FuelBudgetsTab`) that are not routed.
- Run **AI dispatch** as an operations loop. `DispatchPage` is built but not mounted in `App.tsx`. Matching is strong; auto-assign-to-truck is not a closed loop.
- Get **automatic payout** when cargo confirms ePOD. Completion currently creates a **pending** cargo→carrier payment. Escrow and mobile-money rails exist; continuous clearing does not.

### 2.3 Shared rails that must be reused

| Rail | Where it lives | Maturity | Role in the new model |
|------|----------------|----------|------------------------|
| AI / hybrid matching | `backend/src/modules/matching` (weighted, Hungarian, genetic, TOPSIS, hybrid) | Strong | Score residual space, not only empty trucks vs full loads |
| Availability engine | `availability` + `ShipmentReservation` | Strong backend, weak owner UI | Calendar of sellable windows |
| Bidding / auctions | `bidding` | Strong | Optional price discovery on leftover space |
| Payments + 70/30 + mobile money | `payments` | Production-shaped | Settlement and lender disbursement |
| Broker commission | `broker_commissions` (% of load, PENDING→PAID) | Production-shaped | Template for **platform match commission** |
| Trip lending | `lending` (auto-loan, policies, risk, disbursement, repayment, Uruti Lending) | Production core | Capital leg of the exchange |
| Fuel ledger | `fuel` | Partial (ledger yes, stations no) | Fuel wallet on the trip |
| Insurance registry | `insurance` (includes `PolicyType.CARGO`) | Internal CRUD, not bind-at-booking | Cargo cover product |
| Customs + documents + OCR | `customs`, `documents`, `ocr` | Partial; OCR not wired into customs | Cross-border pack |
| Carrier marketplace / backhaul | `carrier-marketplace` | Thin | Seed for corridor inventory |
| Credits marketplace | `credit-marketplace` | SaaS credits | **Keep separate** from freight/capital |

**Architectural fact:** matching today treats a truck as compatible if **capacity ≥ load**. Under-utilization is a *score penalty*, not a *second listing*. That is why a 40% empty truck on Kigali → Nairobi cannot yet sell the leftover 60% as a product.

---

## 3. Target operating model (one corridor, three sides)

Use **Kigali → Nairobi** as the design corridor. Northern Corridor economics (empty return legs, cash-before-fuel, border delay, mobile money) are the product constraints.

```
CARGO DEMAND          TRANSPORT CAPACITY           CAPITAL
(shipper load)   ↔️   (truck + leftover space)  ↔️  (lender)
        \                    |                      /
         \                   |                     /
          \                  ▼                    /
           \         URUTIX TRIP SPINE           /
            \    match → book → fund → move     /
             \   insure → clear → settle        /
              \________________________________/
```

**Worked example**

1. Truck T is booked 60% on a Kigali → Nairobi run (or is deadheading back). Owner lists **remaining 8 tonnes / 28 m³**, pickup window, floor price, compatible cargo classes, and whether LTL mixing is allowed.
2. Shipper S in Kigali has 4 tonnes general cargo to Nairobi. Instead of creating an FTL load and waiting for a full truck, they **book residual capacity** (Airbnb-style instant book or request-to-book).
3. Platform takes **commission on the matched remainder** (and on the original load if it was also platform-matched).
4. Owner needs diesel and cash before departure. Lender L funds a **trip facility** against escrowed freight (existing 70/30 + auto-loan pattern), optionally topping the **fuel wallet**.
5. Cargo cover is offered at booking against declared value. Border pack (commercial invoice, packing list, transit docs) is assembled from the document vault and customs inspection workflow.
6. AI dispatch confirms truck + driver availability, assigns, and tracks. On ePOD confirm, escrow releases: carrier payout, fuel-advance recovery, loan repayment, insurance premium, platform/broker commission — in one settlement waterfall.

That is Uber (dispatch + matching) + Stripe (escrow, wallets, settlement) + marketplace lending (trip finance), **on the trip object you already have**.

---

## 4. Feature 1 — Airbnb for cargo capacity

### 4.1 Product definition

A **Capacity Offer** is inventory:

- Truck, owner, tenant
- Corridor (origin → destination, with optional intermediate drop points)
- Window (departure / arrival)
- **Remaining** weight and volume (not nameplate capacity)
- Compatible cargo types, mix rules (no food with chemicals, stackable vs not)
- Price: floor, per-tonne, per-m³, or per-trip share
- Booking mode: instant book vs request
- Status: OPEN → PARTIALLY_BOOKED → FULL → IN_TRANSIT → COMPLETED / EXPIRED

A shipper **Capacity Booking** consumes a slice of that offer and becomes (or attaches to) a **Load** and then a **Trip stop**. One trip may carry **multiple loads / multiple cargo owners**. That is the only structural change that makes LTL real. Today `LoadType.LTL` is an enum on a still-single-shipper load.

### 4.2 Where it attaches (do not fork the marketplace)

| Layer | Reuse | Change |
|-------|--------|--------|
| Truck master data | `capacityWeight`, `capacityVolume`, equipment flags | Remaining capacity = nameplate minus allocated loads on the same trip |
| Availability | `ShipmentReservation`, utilization summary APIs, `FleetSchedulingView` (built, not routed) | A reservation can be **partial**. Publishing a window creates a Capacity Offer |
| Matching | Capacity score already prefers 70–90% utilization | Add **offer-to-load** matching: leftover space vs LTL loads on the same corridor and window; keep FTL path unchanged |
| Backhaul | `/dashboard/fleet/backhaul` | Upgrade from city ILIKE search to “list my empty/partial leg” |
| Loads | Create cargo form, `MatchingSection`, journey choice | Third path: **Book available space** beside Smart Matching and Publish for Bid |
| Commission | `BrokerCommission` (rate × amount, status machine) | Add **platform capacity-match commission** (same pattern, different source type). Brokers can still earn on the load |
| Carrier marketplace | Directory + invite network | Show live leftover space, not only carrier profiles |
| Trips / ePOD | One trip, one truck, one driver | Multiple cargo owners on one trip; ePOD and payment per booking, not only per truck |

### 4.3 UI insertion (use existing shells)

**Truck owner**

- New item under **Operations Hub**: **Sell capacity** (sibling of Smart Matching and Backhaul).
- From **Fleet Overview** and **Active Trips**: if utilization &lt; 100% and status is AVAILABLE or IN_TRANSIT (pre-departure), CTA **List remaining space**.
- Reuse `FleetSchedulingView` + `UtilizationSummary` as the calendar of offers (route them; they are currently orphaned).
- Offer cards should look like the existing match/bid cards (slate cards, `#345E85` accent, uppercase micro-labels) — not a new visual language.

**Cargo owner**

- In **Supply Chain Hub**, add **Available space** (map + list), next to Smart Matching.
- In `JourneySelectionModal`, add a third option when LTL-sized cargo is detected: **Share a truck already on this route**.
- Keep FTL create → match → bid as the default for full loads. Do not force Airbnb UX onto 28-tonne exclusive moves.

**Admin / tenant**

- Commission rules next to existing broker commission and credit pricing. Capacity match is a **take-rate product**, not a SaaS credit spend.

### 4.4 Matching and pricing rules (professional, corridor-first)

1. **Hard filters:** corridor overlap, time window, remaining kg/m³ ≥ load, equipment, hazmat/food segregation, stackability, tenant/network visibility.
2. **Score:** reuse current factors (distance to pickup, rating, price vs market, security). Add **detour cost** if the leftover booking adds a stop, and **mix risk**.
3. **Price:** owner floor + platform suggested rate from existing market-intelligence / freight-rate constants. Commission is a visible % at booking (same honesty as broker rate).
4. **Allocation:** first-come instant book, or request-to-book for mixed/hazmat. When remaining space hits zero, offer closes and matching ignores it.
5. **One trip, many shippers:** pickup sequence from existing multi-stop / route-optimization services. Do not invent a second trip model.

### 4.5 Revenue

- **Primary:** commission per capacity booking (and per original FTL match if applicable).
- **Secondary:** later, promoted listings and suggested-price unlocks — only after liquidity exists. Do not gate leftover-space listing behind SaaS credits; that would starve supply.

### 4.6 What not to build in v1

- Dynamic order-book / continuous auction for space (bidding already exists for full loads; add it for space only if instant book fails).
- Cross-tenant public board without KYC (multi-tenant isolation is already a platform rule).
- Perfect 3D bin-packing. Start with weight + volume + mix rules; add dimensional packing later.

---

## 5. Feature 2 — Logistics Liquidity Exchange

### 5.1 Product definition

A **Liquidity Exchange** is not a new bank. It is a **matching layer** that, at booking time, solves three shortages at once:

| Side | Shortage | UrutiX object already |
|------|----------|------------------------|
| Shipper | Needs capacity now | Load / Capacity Booking |
| Carrier | Needs cash and diesel now | Trip + Fuel Wallet + pending payment |
| Lender | Needs short, secured, observable risk | `LoanRequest` on `cargo_id` + `trip_id`, `LenderPolicy`, risk service |

Today these happen in **sequence and in different screens**: match, then maybe loan, then maybe fuel log. The exchange makes them **one decision**: *this trip is fundable, this truck is assignable, this cargo is bookable*.

### 5.2 Where it attaches

| Capability | Reuse as-is | Productize |
|------------|-------------|------------|
| Auto-loan on assigned / in-transit trip | `AutoLoanGeneratorService` | Trigger at **capacity booking accept**, not only FTL assign. Expose lender competition (multiple policies) instead of one hardcoded tenant config |
| Advance % | Lender policy default 0.7; payment policy 70/30 | Same numbers; show them on the booking ticket as “freight escrow + carrier advance” |
| Risk | `RiskAssessmentService`, KYC, IFRS-ish fields on loan | Add **capacity utilization and mix** as risk inputs (partial loads, extra stops, border) |
| Disbursement | Split beneficiaries, mobile money two-leg | Default split: truck owner cash + **fuel wallet credit** (so diesel cannot leak as cash) |
| Repayment | `RepaymentProcessorService` | Waterfall: ePOD confirm → cargo pays escrow → loan + interest + fuel recovery + commission |
| Lender UX | Existing lender dashboard, policies, loan detail | New queue: **Fundable trips** (corridor, amount, LTV, ETA, GPS, ePOD SLA) |
| Cargo owner UX | `RequestFinancingModal` (today easy to confuse cargo id / trip id) | Shipper rarely borrows in the African model; they **pay into escrow**. Keep cargo-owner loan as optional; default borrower is the **carrier** |
| Truck owner UX | Financial hub, pending payments, credits (SaaS) | **Trip finance** tile: “This Nairobi run can be funded in X hours at Y%”. Keep SaaS credits labelled as platform credits so owners are not confused |

### 5.3 Exchange rules (so it is a marketplace, not a hidden auto-loan)

1. **Eligibility:** KYC complete, truck compliance gate passed (existing `compliance-gate`), cargo value and freight known, pickup window inside policy.
2. **Offer:** lenders (or Uruti Lending) quote advance %, rate, fees, fuel-wallet portion, max tenor (trip days + grace).
3. **Accept:** carrier accepts one offer; funds move to escrow/wallet; trip is allowed to dispatch.
4. **Monitor:** GPS + customs holds + ePOD disputes already exist — they become covenant breaches, not only ops events.
5. **Clear:** one settlement engine (see §6.7). No second ledger.

### 5.4 What “Uber + Stripe + marketplace lending” means in this codebase

- **Uber:** matching + availability + (wired) dispatch + tracking.
- **Stripe:** payment state machine, escrow status, mobile money webhooks, pending-payee views, commission payout status.
- **Marketplace lending:** lender role, policies, offers, disbursement, repayment, external Uruti Lending API.

The gap is **orchestration and UX**, not a missing core ledger. Building a new “exchange” microservice that duplicates `payments` and `lending` would be the expensive mistake.

---

## 6. Feature 3 — Combined African stack (one trip product)

Attack several pain points on the **same Kigali → Nairobi booking**, and charge several take-rates on the **same settlement**. Each bullet is an existing module plus a defined gap.

### 6.1 Digital freight matching

**Reuse:** hybrid/AI matching, cargo journey, truck matches, bidding, carrier marketplace.  
**Add:** residual Capacity Offers (§4) and LTL multi-load trips.  
**UI:** third journey option + Available space board.  
**Do not:** replace Hungarian/TOPSIS; extend scoring inputs.

### 6.2 Driver / fleet financing

**Reuse:** trip loans, auto-loan, driver fuel advances.  
**Add two products only when trip finance is liquid:**

1. **Trip working capital** (already the DNA) — productize for truck owners in Financial hub (currently easy to miss / mislabelled vs Line of Credit / SaaS credits).
2. **Fleet facility** later (tyre, insurance premium, truck purchase) — **out of v1**. It needs collateral and servicing UrutiX does not yet run. Do not stretch `LoanRequest` (requires cargo + trip) into asset finance without a new product entity.

### 6.3 Fuel wallet

**Reuse:** `FuelWallet` ledger, transactions, advances, budgets.  
**Do immediately (Phase 0):** mount `FuelWalletTab` / advances / budgets inside the existing Fuel tab (today `FuelPage` logs only). Header already says **Fuel & Maintenance**.  
**Then:** on funded trips, disburse a **restricted fuel credit** to the assigned driver’s wallet. Reconciliation against `FuelLog` and trip budget variance.  
**Later:** station / mobile-money merchant network. Do not block v1 on cards or POS.

### 6.4 Cargo insurance

**Reuse:** load `insuranceValue`, `PolicyType.CARGO`, claims types `cargo_damage` / `cargo_theft`, document type cargo insurance.  
**Add:** **quote → bind at booking** (even if the first “insurer” is a manual partner and the policy is recorded in the existing registry). Premium is a line on the settlement waterfall.  
**UI:** optional step in booking confirmation (cargo owner) and a read-only cover status on the trip (truck owner / driver).  
**Do not:** pretend the current truck-centric policy CRUD is a cargo checkout.

### 6.5 Cross-border documentation

**Reuse:** document management (`CARGO_CUSTOMS`, POD, etc.), cargo-owner customs inspections, customs officer app (channels, holds, checkpoints), generic OCR.  
**Add:** a **Border Pack** on the trip for Northern Corridor: required docs checklist by origin/destination country, OCR extract attached to the customs inspection, hold status blocking settlement (not only ops).  
**UI:** cargo owner already has **Cargo Inspections**; elevate it from a side page to a step on cross-border loads (detect when origin and destination countries differ). Truck owner sees pack completeness before dispatch.  
**Do not:** wait for ASYCUDA/single-window integration to ship the checklist + OCR attach. Integrate filing later.

### 6.6 AI dispatch

**Reuse:** matching engine, route optimization, real-time availability services, GPS tracking, `DispatchPage` map + assign pattern, broker multi-stop.  
**Add:** mount `/dashboard/fleet/dispatch`, feed **live GPS** (stop using random fallback coordinates in production), and let accepted matches / capacity bookings **create the assignment** instead of a dispatcher clicking blindly.  
**Closed loop:** offer/load match → availability check → assign truck/driver → fuel wallet + docs gate → in transit. That is AI dispatch; it is not a new algorithm family.

### 6.7 Automated settlement

**Reuse:** ePOD confirm/dispute, invoice, pending payments, escrow release, mobile money, broker commission status, loan repayment processor.  
**Add a single waterfall** on `Trip` + related bookings:

1. Cargo owner (or lender on their behalf) has funded escrow (advance already held).
2. Driver submits ePOD; cargo owner confirms (existing dispute path remains).
3. Release order: platform/broker commission → insurance premium (if any) → fuel advance recovery → loan principal/interest → **carrier residual payout**.
4. Truck owner sees this as **Completed payment**, not another pending row they must chase.

Unify conceptually the two escrow models (payment status ESCROW vs broker `EscrowAccount`). Operations should see one “money in the deal” number.

Placeholder pages (`SettlementProcessing`, parts of `TransactionFlow`) should either **bind to this waterfall** or be removed from navigation so they stop looking like the product.

---

## 7. How the two owner UIs should change (and what to leave alone)

### 7.1 Cargo owner — keep the 4-step journey, extend it

Current: Cargo details → Smart Match **or** Bid → Booking → Track/Pay/ePOD.

**Extended journey for LTL / cross-border**

1. Cargo details (existing form). If weight/volume ≪ typical FTL, default recommendation = **Available space**.
2. Path: Smart Match | Bid | **Book space**.
3. Booking confirmation: freight + **optional insurance** + **escrow / payment method** + **border pack** if countries differ.
4. Live tracking + inspections (existing).
5. ePOD confirm → settlement receipt (real, not stub).

**Nav (minimal):** one new Supply Chain item (**Available space**). Financing and insurance appear **inside booking**, not as extra top-level products that compete with Create Payload.

### 7.2 Truck owner — keep FleetDashboard tabs, add supply-side inventory

Current tabs that matter: overview, trucks, drivers, matches, bids, fuel, financial, routes, assignments.

**Extended ops**

- Overview KPI: **empty / residual capacity this week** (utilization APIs already exist).
- New / wired: **Capacity listings**, **Dispatch**, **Fuel wallet** (inside Fuel), **Trip finance** (inside Financial, clearly not SaaS credits).
- Backhaul page becomes **list this empty leg** rather than only search inbound loads.
- Leave truck/driver registration stepper as-is. Do not add a second asset form.

### 7.3 Lender

Existing loan queues stay. Add **Fundable trips** with corridor, GPS, ePOD SLA, mix (FTL vs shared), and suggested advance. This is the third side of the exchange without a new role.

### 7.4 Shared design rules

- Same layout shells (`CargoOwnerLayout`, `FleetOwnerLayout`, `DashboardHeader`).
- Same hubs/tabs/steppers/modals patterns already used (`SmartMatchingHub`, `UnifiedFinancialManagement`, journey stepper).
- Permissions: extend `route-permission.rules` and `useNavigationPermissions`; do not hard-code a parallel menu.
- Tenant isolation unchanged. Cross-border does not mean cross-tenant data leak.

---

## 8. Delivery plan (effective and efficient)

Work is ordered by **reuse density** and **time-to-revenue**. Do not start with insurance APIs or station networks.

### Phase 0 — Surface what you already built (1 sprint class)

**Goal:** stop paying for unused code; give owners the tools the backend already supports.

- Route `FuelWalletTab` / advances / budgets into `/dashboard/fleet/fuel`.
- Route `FleetSchedulingView` + utilization into fleet ops.
- Route `DispatchPage` to `/dashboard/fleet/dispatch` and point it at real GPS.
- Promote `/dashboard/fleet/backhaul` in Operations Hub (it exists, it is easy to miss).
- Relabel truck-owner **Line of Credit / Marketplace / Credits** so SaaS credits are not mistaken for trip cash.
- Hide or rewire stub settlement/transaction-flow pages.

**Outcome:** fuel + schedule + dispatch + backhaul are usable. No new domain yet.

### Phase 1 — Capacity marketplace MVP (corridor: Kigali ↔ Nairobi)

**Goal:** a truck 40% empty can sell the rest; platform earns match commission.

- Capacity Offer + Booking domain; remaining kg/m³; mix rules.
- Matching: offer ↔ LTL load; trip can hold multiple loads.
- Truck owner: list remaining space from trip/overview/backhaul.
- Cargo owner: Available space + third journey option.
- Commission record cloned from broker commission pattern (platform as payee).
- Start with **general cargo only** on this corridor. No hazmat mixing in MVP.

**Outcome:** Airbnb-for-capacity is real. Liquidity exchange can sit on top of booked trips.

### Phase 2 — Liquidity exchange on the same trip

**Goal:** capital clears in hours, not days, using existing lending.

- At booking accept, show fundable advance (policies + auto-loan).
- Lender **Fundable trips** queue; optional multi-lender quote.
- Disbursement split: owner mobile money + fuel wallet credit.
- Cargo owner pays/holds escrow as today; they are not forced to become borrowers.
- Risk inputs: utilization, extra LTL stops, border flag.

**Outcome:** demand, capacity, and capital meet on one ticket.

### Phase 3 — Insurance, border pack, automated waterfall

**Goal:** African stack on the corridor without seven vendors in seven screens.

- Bindable cargo cover at booking (partner-operated is acceptable).
- Cross-border checklist + OCR attached to customs inspection; hold blocks settlement.
- Settlement waterfall on ePOD confirm (commission, premium, fuel recovery, loan, carrier).
- Single “money in this trip” view for cargo owner, truck owner, lender.

### Phase 4 — Harden dispatch and fuel ecosystem

- Closed-loop AI assign from matches/offers.
- Fuel merchant / station partnerships.
- Dimensional packing, more corridors, hazmat-capable LTL.
- External customs filing when a real API exists.

---

## 9. Operating and risk controls

These are product rules, not engineering trivia.

| Risk | Control using what you have |
|------|-----------------------------|
| Unsafe cargo mix on shared trucks | Mix matrix at booking; reuse hazmat/food/temp flags on Load |
| Over-selling space | Remaining capacity reserved via `ShipmentReservation` (same conflict engine as bids) |
| Carrier takes cash and does not fuel | Restricted fuel-wallet portion of the loan |
| Shipper does not pay | Escrow before dispatch (existing hold); no dispatch gate open until funded |
| Border delay blows the loan tenor | Customs hold → loan covenant / tenor extension policy |
| ePOD fraud | Existing confirm/dispute; delay waterfall until confirm |
| Confusing two “credits” | Never use the word credit for both SaaS packs and loan advances in the same nav group |
| Tenant data leak on a “public board” | Visibility already on loads (`public` / `private`); offers follow the same |

Compliance gate before assignment already exists. Capacity bookings must pass it the same way as FTL assignments.

---

## 10. Revenue model (several streams, one trip)

| Stream | When it fires | Basis in current platform |
|--------|----------------|---------------------------|
| Capacity match commission | LTL / leftover booking | New, cloned from broker commission |
| FTL match / bid take-rate | Existing matches | Keep |
| Broker commission | Broker-assigned loads | Keep |
| Lending origination / spread | Trip facility | Existing lending |
| Fuel wallet float / merchant fee | Phase 4; Phase 2 is internal ledger only | Fuel module |
| Insurance brokerage | Phase 3 bind | Insurance module |
| Border facilitation (optional fee) | Cross-border pack | Documents + customs |
| Settlement / escrow fee | Waterfall | Payments |
| SaaS AI credits | Unchanged | Credit marketplace — **orthogonal** |

Price the corridor as a **bundle** internally (one trip P&amp;L) even if the customer sees line items. That is how you know whether leftover-space commission plus lending plus fuel is actually profitable on Kigali → Nairobi.

---

## 11. Success metrics (use after Phase 1)

**Capacity marketplace**

- % of Kigali ↔ Nairobi trips with a Capacity Offer when utilization &lt; 85%
- Residual space booked vs listed
- Empty-km reduction on the corridor
- Commission per matched leftover tonne

**Liquidity exchange**

- Median hours from booking accept → disbursement
- % of dispatched trips with escrow funded before departure
- Fuel-wallet share of disbursement vs cash leakage
- Default / ePOD dispute rate vs unfunded trips

**Stack**

- % cross-border trips with complete border pack before arrival at first checkpoint
- % trips with cargo cover bound
- % settlements auto-completed on ePOD confirm (no manual pending chase)

If Phase 0 is skipped, these metrics will lie: owners will still be unable to list space, see wallet, or dispatch because the UI was never wired.

---

## 12. Decision summary

1. **UrutiX should not be rebuilt** as Airbnb, Uber, Stripe, or a bank. It should **publish capacity as inventory**, **match capital to the same trip it already finances**, and **compose fuel, insurance, documents, dispatch, and settlement onto that trip**.
2. The expensive new domain is **residual capacity + multi-load trips**. Almost everything else is productization of matching, availability, lending, payments, fuel, insurance, customs, and ePOD.
3. The cheap, high-leverage first move is **Phase 0: wire orphan UIs**. The first customer-visible bet is **Phase 1 on Kigali ↔ Nairobi leftover space**. The first financial-network bet is **Phase 2 lender queue on those trips**.
4. Keep the **SaaS credit marketplace** for AI matching. Never use it as the liquidity exchange.
5. One trip spine, two existing layouts, three sides. That is the professional integration path.

---

## 13. Source map (for implementation planning)

**Cargo owner UI:** `frontend/src/components/Layout/CargoOwnerLayout.tsx`, `DashboardHeader.tsx` (CARGO_OWNER nav), `CargoOwnerJourney/*`, `CargoDashboard/*`, `pages/dashboard/cargos/create`, `SmartMatchingHub`, `CarrierMarketplacePage`, `CargoOwnerEpodDashboard`, `UnifiedFinancialManagement`, `RequestFinancingModal`.

**Truck owner UI:** `FleetOwnerLayout.tsx`, `FleetDashboard.tsx`, `FleetFormStepper.tsx`, `TruckMatches.tsx`, `BiddingDashboard`, `FuelPage` + unused `FleetDashboard/Fuel/*`, `availability/*`, `DispatchPage.tsx`, `BackhaulMatchingPage.tsx`, `pages/truck-owner/*`.

**Backend spine:** `modules/loads`, `matching`, `availability`, `bidding`, `fleet`, `trips` (ePOD + completion), `payments`, `lending`, `fuel`, `insurance`, `customs`, `documents`, `ocr`, `brokers` (commission + escrow), `carrier-marketplace`, `compliance`.

**Entities to extend, not replace:** `Load` (already LTL), `Truck` (already capacities), `Trip`, `ShipmentReservation`, `Payment`, `LoanRequest`, `FuelWallet`, `InsurancePolicy`, `BrokerCommission`, `Epod`.

**Entity to add:** Capacity Offer + Capacity Booking (or equivalent names), with remaining weight/volume and a link to one Trip and many Loads.
