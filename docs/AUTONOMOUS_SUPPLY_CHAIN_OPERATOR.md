# The Autonomous Supply-Chain Company

**Document type:** Systems analysis and product integration blueprint  
**Audience:** Product, engineering, operations, lending, enterprise shippers  
**Related:** [Capacity Marketplace and Logistics Liquidity Exchange](./CAPACITY_MARKETPLACE_AND_LIQUIDITY_EXCHANGE.md)  
**Principle:** UrutiX can become an **AI freight orchestrator** on what it already is. Becoming an **AI supply-chain operator** (buy → stock → distribute units) is a second product layer. Do not collapse the two.

---

## 1. Executive recommendation

The statement *“I need 100,000 units of product delivered to 20 cities next month”* is not a logistics ticket. It is a **business intent**. A traditional TMS answers *how do I move this load*. An autonomous supply-chain company answers *what should be bought, where it should sit, when it should move, who pays, and when to do it again*.

UrutiX today is the first half of that sentence. Cargo owners are **shippers of freight**, not operators of inventory. The nav label “Cargo Inventory” is a **shipment list**. There is no SKU master, no purchase order, no warehouse management, and no supplier network. Predictive analytics forecast **lanes and trips**, not **units in cities**.

**Professional path**

| Horizon | What UrutiX becomes | What the customer types |
|---------|---------------------|-------------------------|
| Now (after capacity + liquidity) | Autonomous **freight** operator | “Move these 40 loads Kigali → 20 East African cities this month” |
| Next | Autonomous **distribution** planner | “Deliver 100,000 units to 20 cities next month” — system **explodes** that into loads, trucks, finance, insurance, customs, settlement |
| Later | Autonomous **supply-chain** operator | Same intent, plus **source, buy, warehouse, and reorder** — only with partners or a new domain, not by stretching `Load` |

**Do this:** introduce one new object — a **Distribution Campaign** (intent) — that sits *above* loads and trips and *uses* matching, capacity offers, lending, fuel, insurance, customs, and settlement from the previous blueprint.  
**Do not do this:** build SAP, a WMS, or an Amazon-style marketplace inside the fleet dashboard. Do not let an LLM “negotiate and order inventory” without a human approval gate, a supplier contract, and a goods-receipt. That is procurement and trade finance, not a matching-algorithm upgrade.

**Efficiency rule:** Features 1–3 (leftover space, trip capital, African trip stack) are **required infrastructure**. This concept is **demand generation at scale** on top of that infrastructure. Building it first would automate the creation of loads the marketplace cannot yet fill, fund, or settle well.

---

## 2. How this relates to the previous three features

Think in layers, not in competing ideas.

```
LAYER D  Autonomous supply-chain   ← this document (intent → buy → stock → reorder)
LAYER C  Autonomous distribution   ← first honest product of this document
LAYER B  African trip stack        ← fuel, insurance, border, dispatch, settlement
LAYER A  Capacity + liquidity      ← leftover space + trip finance
LAYER 0  Current UrutiX            ← load → match/bid → trip → ePOD → pay
```

- **Airbnb for capacity** is how 20 city deliveries share trucks instead of 20 empty FTL runs.
- **Liquidity exchange** is how the campaign is **funded in real time** (transport and, later, inventory).
- **African stack** is how each generated trip actually moves (fuel wallet, cover, documents, dispatch, waterfall).
- **This concept** is the **brain that creates many trips from one sentence**.

Without A–C, an autonomous planner only produces a backlog of unpublished loads. With A–C, one intent can clear the network.

---

## 3. Current state: what the two owner products actually do

### 3.1 Cargo owner (would be the “company” giving the intent)

**Today’s unit of work is one load (or a CSV of loads), not a campaign.**

| Capability the vision needs | What exists | Honest maturity |
|-----------------------------|-------------|-----------------|
| State a multi-city intent | Bulk CSV upload (`/dashboard/cargos/bulk-upload`); load `locations` JSON with many STOP/DELIVERY points; receivers per destination; `unitsRequired` on a load | Production for **many freight tickets**. No “100,000 units / 20 cities / next month” object |
| Repeat the work | Load templates + schedule/cron (`LoadTemplateService`) | Auto-creates **loads**, not inventory reorders |
| Forecast | Predictive logistics page; demand heatmap; broker market forecast; AI insights | **Lane / trip / price** heuristics. Demand forecast fields are often null or stubbed. No SKU×city forecast |
| Find suppliers | — | **Missing**. “Vendor” in the codebase is fleet maintenance |
| Negotiate | Broker load contracts; bidding; `ContractNegotiation` page | Bidding is real **for trucks**. Cargo-owner contracts UI and negotiation page are largely mock. No supplier RFQ |
| Order inventory | — | **Missing** (no PO, no goods receipt) |
| Arrange financing | Trip lending, escrow, mobile money | Finances **transport**, not stock purchase |
| Book transportation | Smart matching, auctions, auto-match flag | **Core strength** |
| Select warehouses | `LocationType.WAREHOUSE` / `DISTRIBUTION_CENTER`; parking reservations | Labels and **truck parking**, not storage capacity or 3PL booking |
| Optimize routes | Broker multi-stop; matching route optimization; multi-modal module | Multi-stop is usable; multi-modal AI is **simulated** |
| Customs / insure / track / pay | Customs inspections, insurance value, tracking, payments | Strong **per trip**, not **per campaign** |

Cargo owner UX to extend later: **Supply Chain Hub** (already named for this), Create Payload, Cargo Inventory (rename or add a true campaign view), bulk upload, templates, receivers, predictive analytics, financial hub.

### 3.2 Truck owner (becomes capacity for the campaign)

The autonomous company does **not** replace the truck owner. It **consumes** fleet supply: leftover space, bids, matches, fuel wallets, dispatch. Truck-owner UX stays operational (FleetDashboard). The campaign engine is a **cargo-owner / tenant** product that books their trucks.

### 3.3 What “AI” already means in this repo

Matching already runs weighted / Hungarian / genetic / TOPSIS / hybrid scoring. Analytics expose demand heatmaps and predictive endpoints. Broker intelligence has a market forecast API. ML inference includes demand factors that are still partly heuristic.

That is **decision support for freight**. It is not an agent that can legally bind a purchase order or pick a bonded warehouse.

---

## 4. Target operating model (the 100,000-unit example)

A beverage or FMCG shipper (or a 3PL acting for them) tells UrutiX:

> Deliver 100,000 units to 20 cities in Rwanda, Uganda, and Kenya next month. Budget cap X. Service level: 95% on-time. Prefer shared trucks. Fund transport on escrow.

### 4.1 What the system should do in the **first** shippable product (Layer C)

This is **autonomous distribution**, still inside logistics.

1. **Parse intent** into SKU (or pack description), quantity, destination list, window, constraints.
2. **Explode** quantity into **loads**: weight/volume from a pack profile; split by city; split again by truck capacity and LTL leftover space.
3. **Assign receivers** (existing receiver directory) to each city.
4. **Plan calendar** across “next month” using template scheduling.
5. **Book transport** via matching + capacity offers + bidding (human confirm or auto-match with a cap).
6. **Fund** trips via liquidity exchange (existing loan + escrow).
7. **Attach** insurance quote, border pack, fuel wallet credit, dispatch.
8. **Track** all child trips on one campaign board.
9. **Settle** each trip on ePOD; roll up campaign P&amp;L.
10. **Recur** next month from the same template if the shipper confirms — still freight recurrence, not stock replenishment.

Worked numbers (illustrative): 100,000 units × 2 kg = 200 tonnes. If typical FTL on the corridor is ~28 tonnes, that is ~8 full trucks **if one destination**. Spread across 20 cities it becomes **many smaller LTL slices** — which is exactly why leftover-capacity (Feature 1) must exist first, or the AI will book 20 expensive exclusive trucks.

### 4.2 What the system must **not** pretend to do in v1

| Vision step | Why it is not v1 on UrutiX |
|-------------|----------------------------|
| Find suppliers | No supplier graph; would be a new marketplace (trade, not freight) |
| Negotiate prices (goods) | Bidding is for **freight rates**. Goods prices need contracts, Incoterms, quality specs |
| Order inventory | No PO / GRN; tax and title transfer |
| Select warehouses as storage | Location type ≠ slotting, bond, temperature, throughput |
| Auto-reorder inventory | Template cron reorders **loads**. Reordering goods needs stock-on-hand and sales-out |

Those belong in Layer D, with partners (suppliers, 3PLs, insurers, lenders) and a human **approval rail**.

---

## 5. The object to add: Distribution Campaign (intent)

Do not overload `Load`. A load is one movement. A campaign is a **parent plan**.

```
DistributionCampaign
  intent: units, SKU/pack, window, budget, SLA, corridors
  destinations[]: city, receiver, quantity, window
  constraints: LTL ok, modes, insurance required, max price
  status: DRAFT → PLANNED → APPROVED → EXECUTING → COMPLETE / EXCEPTION
     │
     ├── Load (many)           existing
     ├── Capacity booking      from Feature 1
     ├── Trip                  existing
     ├── LoanRequest           existing (per trip or campaign facility)
     ├── Border pack           from Feature 3
     └── Settlement rollup     existing payments, summed
```

**Approval rail (non-negotiable):** the company confirms the plan (loads, cost, lenders, mix) before money or trucks are committed. Autonomy is **propose → approve → execute**, not silent purchasing. That is how you stay an operator, not an unlicensed trader.

**Cargo owner UI:** new Supply Chain Hub item **Campaigns** (or **Distribution planner**), stepper:

1. Intent (units, cities, month)  
2. Plan preview (map of 20 cities, tonne split, shared vs FTL, cost, finance)  
3. Approve  
4. Execution board (child loads, matches, exceptions)  
5. Campaign settlement and SLA

Reuse: bulk CSV as **import destinations**; templates as **save this campaign**; receivers; predictive page as **read-only demand hint**, not the planner itself.

**Truck owner UI:** no campaign builder. They see a surge of matches/bids/capacity bookings. Optionally a “campaign inbound” filter on the load board so a fleet can commit lanes for a month.

---

## 6. Step-by-step: vision vs UrutiX (how to include each piece)

### 6.1 Forecast demand — **assist, do not own**

**Reuse:** `PredictiveAnalyticsService`, demand heatmap, broker `market/forecast`, matching seasonal multipliers.  
**Use as:** “These 20 cities historically move X tonnes on these weeks; suggested split.”  
**Do not:** claim SKU-level retail forecast without the customer’s sales data. In v1 the **customer states the 100,000 units**; AI allocates them. In v2, optional upload of sales-out or inventory files to refine the split.  
**African reality:** forecast error is high; SLA buffers and human edit of city quantities matter more than a prettier chart.

### 6.2 Find suppliers — **Layer D / partner**

Out of freight core. Options later: supplier directory as a **tenant-private** list (the company’s own vendors), or integration with a trade platform. UrutiX should pass a **pickup location + ready date** into the campaign once goods exist. Until then, pickup is “shipper warehouse” as today’s origin.

### 6.3 Negotiate prices — **split the meaning**

- **Freight:** already real (auctions, smart match, later capacity floor prices). Campaign planner should run a **batch bid / batch match** across child loads, with a campaign budget cap.
- **Goods:** not UrutiX v1. If Layer D exists, negotiation is contract + human sign-off (`contract.service` is for **load** contracts; extend later, do not fake it in `ContractNegotiation.tsx`).

### 6.4 Order inventory — **Layer D**

New domain (SKU, PO, GRN). Not a column on `Load`. Campaign stays blocked in `PLANNED` until the shipper marks **goods ready** (manual in v1).

### 6.5 Arrange financing — **reuse Feature 2 at campaign scale**

Today `LoanRequest` is per `cargo_id` + `trip_id`. For 20 cities that is many facilities **or** one **campaign facility** drawn down per dispatched trip. Prefer draw-down per trip (risk stays observable via GPS/ePOD) rather than one unsecured lump for 100,000 units.

Inventory finance (paying the factory) is a different product and a different lender appetite. Do not mix it with diesel-and-freight working capital in v1.

### 6.6 Book transportation — **core, batch the existing journey**

Reuse matching, bidding, auto-match, and (after Feature 1) capacity offers. The campaign service **creates loads** the way bulk CSV and `create-load-from-template` already do, then calls matching in batch. Cargo-owner journey stays; the user reviews a **table of 20 cities** instead of one stepper per load.

### 6.7 Select warehouses — **hubs, not WMS**

v1: treat warehouses as **locations** (already `WAREHOUSE` / `DISTRIBUTION_CENTER`) that are origins, cross-docks, or last-mile depots. Parking reservations are for **trucks waiting**, not pallets.  
v2: 3PL partners list **storage slots** (another Airbnb-like inventory — storage, not truck space). Only then is “select warehouses” a marketplace. Until a partner exists, the planner only **chooses among the shipper’s own locations**.

### 6.8 Optimize routes — **reuse, then harden**

Reuse multi-stop sequencing and matching route optimization so several cities on one corridor become **one truck, many drops** (especially with leftover capacity). Multi-modal (road/sea/air/rail) stays optional; its optimizer is simulated — do not market it as the campaign brain. East African default is **road + border**, which UrutiX already models better than sea/air.

### 6.9 Handle customs — **per crossing, rolled up on the campaign**

Reuse inspections, document types, OCR (wire OCR into the pack). Campaign view: “12 of 20 destinations are cross-border; 8 packs complete; 2 holds.” Holds already should block settlement (Feature 3); they should also **pause remaining dispatches** on that corridor.

### 6.10 Insure cargo — **bind per load or per campaign**

Reuse insurance value + future bind-at-booking. Campaign can buy a **master cargo cover** with certificates per trip. Still a partner process in early phases.

### 6.11 Track everything — **one board, existing GPS**

Do not build a second tracker. Campaign execution UI is a filter over existing live tracking and ePOD: all child `tripId`s. Exception list: late, hold, dispute, underfill.

### 6.12 Manage payments — **waterfall per trip, P&amp;L per campaign**

Reuse escrow, mobile money, commission, loan repayment. Add **campaign rollup** in the cargo-owner financial hub (sum of child settlements vs budget). Truck owners still get paid per trip — they should not wait for the 20th city.

### 6.13 Reorder automatically — **two different buttons**

| Button | Meaning | When |
|--------|---------|------|
| Repeat campaign | Clone last month’s **freight plan** (templates + cron already point here) | After first successful campaign |
| Reorder goods | Create PO because stock &lt; reorder point | Layer D only |

Never name template scheduling “auto-reorder inventory” in the UI.

---

## 7. Control model: AI operator, not unsupervised company

An “AI supply-chain operator” that books trucks and moves money without gates is an operational and regulatory failure. Recommended policy:

1. **Intent** can be typed in natural language; the system always shows a structured plan.
2. **Cost, mix, lender, and hazardous class** require explicit approve.
3. **Auto-match** allowed inside a budget and SLA; exceptions (no capacity, customs hold, price &gt; cap) stop for a human.
4. **Goods purchase** never auto-binds in v1–v2.
5. **Every child load** remains visible in today’s cargo list so operations can intervene with existing tools (edit load, re-match, dispute ePOD).

This is the same pattern as auto-loan and auto-match already in the platform: automation with policy, not a black box.

---

## 8. Delivery plan (after Features 1–3, not instead of them)

### Phase C0 — Language and honesty (cheap)

- Rename or subtitle “Cargo Inventory” so it is not confused with stock.
- Document that Predictive Logistics is **lane intelligence**.
- Add campaign as a **product narrative** in Supply Chain Hub without fake screens.

### Phase C1 — Distribution Campaign MVP (the real inclusion of this idea)

- Campaign entity + destinations + explode-to-loads (pack weight/volume table).
- UI stepper on cargo owner: intent → plan → approve → board.
- Generate loads via existing create/bulk/template services; batch matching.
- Receivers mapped to cities.
- Budget cap and SLA dashboard (on-time from existing trip timestamps).
- Human approve before publish.

**Pilot intent:** one shipper, 20 cities, one SKU family, Northern Corridor road only, general cargo.

### Phase C2 — Network effects from Features 1–3

- Prefer leftover capacity and multi-drop when exploding loads.
- Campaign-level finance draw-down.
- Border pack completeness as a dispatch gate.
- Insurance offered on approve screen.
- Rollup settlement vs budget.

### Phase D — True supply-chain operator (only with partners)

- Private supplier list + PO + goods-ready signal.
- Optional 3PL warehouse slots.
- Inventory finance as a **separate** lender product.
- Reorder points if the customer feeds stock/sales data.
- Multi-modal only when a real carrier/leg exists.

If Phase D is attempted before C1, the company will own a chatbot that cannot book a truck.

---

## 9. Revenue (additional streams, same trip economics)

Campaigns increase **volume through the existing take-rates** (match commission, lending spread, escrow, insurance, border facilitation). Extra campaign-level fees that are honest:

| Stream | When it is justified |
|--------|----------------------|
| Planning / orchestration fee | % of freight or per campaign — you exploded and governed 20 cities |
| Exception management | Optional; do not charge for your own matching failures |
| SaaS credits | AI batch matching may consume existing feature credits — keep labelled as platform credits |
| Inventory/procurement take-rate | **Only** in Phase D, and only if UrutiX is actually the commercial agent |

Do not sell “fully autonomous supply chain” as a subscription while the backend still creates one load at a time with no parent campaign.

---

## 10. Risks unique to this concept

| Risk | Mitigation |
|------|------------|
| Over-promising “finds suppliers / orders inventory” | Product copy: **distribution planner** until Phase D |
| 20-city plan books 20 FTL trucks | Feature 1 LTL/capacity first; optimizer prefers shared trucks |
| One failed customs hold wrecks the month | Per-corridor pause; do not auto-dispatch remaining loads into a closed border |
| Campaign-level loan with no trip telemetry | Draw down per trip |
| LLM hallucinates destinations or weights | Structured plan + pack profile + user approve |
| Tenant isolation | Campaigns are tenant-scoped like loads |
| Truck owner flooded with low-quality auto loads | Reputation, KYC, and capacity constraints already in matching |

---

## 11. Success metrics (Phase C1)

- Time from approved intent → all child loads published
- % of campaign tonnes moved on **shared / residual** capacity vs exclusive FTL
- Freight cost vs plan and vs budget cap
- On-time % at receiver (existing ePOD timestamps)
- % of child trips escrow-funded before dispatch
- Human interventions per campaign (should fall, not hit zero)

If shared-capacity % stays near zero, the “autonomous company” is just bulk upload with a nicer header.

---

## 12. Decision summary

1. This is the **most ambitious** concept because it changes the **customer sentence** from “move this cargo” to “run my distribution.” It is not a feature flag on matching.
2. UrutiX should **not** become a WMS or a trading house in the same release as leftover space. It **should** become the system that turns **one monthly intent** into **many well-funded, well-documented, well-settled trips**.
3. The inclusion path is a **Distribution Campaign** above `Load` / `Trip`, using cargo-owner Supply Chain Hub, bulk/templates/receivers, batch matching, and the capacity + liquidity + African stack already planned.
4. Suppliers, purchase orders, warehouse slotting, and inventory auto-reorder are a **later layer with partners and approval gates**.
5. The company becomes an AI supply-chain **operator** only after it is already a reliable AI **freight** operator. That sequence is the professional way to integrate this idea.

---

## 13. Source map

**Reuse (do not rebuild):** loads + bulk CSV + templates/cron; receivers; matching/bidding; availability; trips/tracking/ePOD; payments/lending; customs/documents; locations (`WAREHOUSE`); broker multi-stop; predictive analytics (as hints); cargo-owner layout and Supply Chain Hub.

**Add:** `DistributionCampaign` (+ destinations, plan snapshot, approval, child load/trip ids, budget/SLA rollup).

**Do not stretch:** `Load.unitsRequired` into an ERP quantity; parking into WMS; SaaS credits into inventory finance; simulated multi-modal into the campaign brain; mock `Contracts.tsx` into supplier negotiation.

**Depends on:** [Capacity Marketplace and Logistics Liquidity Exchange](./CAPACITY_MARKETPLACE_AND_LIQUIDITY_EXCHANGE.md) Phases 0–3 for the trips a campaign will spawn.
