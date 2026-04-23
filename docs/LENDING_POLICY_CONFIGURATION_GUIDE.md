# Lending Policy Configuration Guide

This guide explains every configuration tier available at `/lender/policies`, what each input field means, why it matters, and how the backend uses it. Read this before configuring your lending operation.

---

## Overview

The policy system has **7 configuration tiers**. Together they form a complete lending rulebook that governs:

- What interest rate a borrower gets
- Who qualifies for a loan
- How much they can borrow
- How risk is scored
- How repayment is enforced
- What cargo types are financeable
- How the system behaves operationally

**All tiers are independent.** You can configure them in any order, but the system needs at minimum **Tier 1 (Interest Rates)** and **Tier 4 (Risk Assessment)** to compute loan terms automatically.

---

## Tier 1 — Interest Rate Policies

**Tab:** `INTEREST RATES`  
**Purpose:** Define what annual interest rate applies to a loan based on the borrower's risk level.

You can create multiple policies — one per risk level is the standard approach.

### Fields

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| Policy Name | text | ✅ | A human-readable label, e.g. `"Low Risk Standard Rate"` |
| Risk Level | select | ✅ | Which borrower risk tier this policy applies to: `low`, `medium`, `high`, or `critical` |
| Base Rate (%) | number | ✅ | The starting annual interest rate before any adjustments |
| Minimum Rate (%) | number | ✅ | The floor — the rate can never go below this regardless of adjustments |
| Maximum Rate (%) | number | ✅ | The ceiling — the rate can never exceed this regardless of adjustments |
| Credit Score Factor | number | — | How much the borrower's credit score shifts the rate (see below) |
| Loan History Factor | number | — | Adjustment weight for the borrower's repayment track record |
| Collateral Factor | number | — | Adjustment weight for the collateral provided |
| Business Type Factor | number | — | Adjustment weight based on whether the borrower is an individual, SME, etc. |

### How the rate is computed

```
adjustment = credit_score_factor × ((borrower_credit_score - 575) / 275)
nominal_rate = clamp(base_rate + adjustment, min_rate, max_rate)
```

575 is the midpoint of the standard 300–850 credit score range. A borrower with a score above 575 gets a rate reduction; below 575 gets an increase. The result is always clamped between `min_rate` and `max_rate`.

**Example:**
- Base Rate: 12%, Min: 8%, Max: 20%, Credit Score Factor: 2
- Borrower credit score: 750 → adjustment = 2 × ((750-575)/275) = +1.27% → nominal = 13.27%
- Borrower credit score: 400 → adjustment = 2 × ((400-575)/275) = -1.27% → nominal = 10.73%

### Why this matters

This is the primary driver of `interest_rate` and `effective_annual_rate` in the loan response. Without at least one active policy here, all loans return `interest_rate: null`.

**Recommended setup:** Create one policy per risk level (low/medium/high/critical) with progressively higher base rates.

---

## Tier 2 — Loan Limit Policies

**Tab:** `LOAN LIMITS`  
**Purpose:** Define the minimum and maximum loan amounts a borrower can request, segmented by business type.

### Fields

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| Policy Name | text | ✅ | Label for this limit rule |
| Business Type | select | ✅ | Which borrower category this applies to: `individual`, `sme`, `corporation`, or `cooperative` |
| Minimum Amount | number | ✅ | Smallest loan this lender will issue for this business type (in RWF) |
| Maximum Amount | number | ✅ | Largest loan this lender will issue for this business type (in RWF) |
| Credit Score Requirement | number | ✅ | Minimum credit score a borrower must have to qualify (300–850 scale) |
| Collateral Requirement (%) | number | ✅ | Minimum collateral as a percentage of the loan amount (e.g. 80 = borrower must pledge assets worth 80% of the loan) |
| Max Utilization (%) | number | ✅ | Maximum percentage of the lender's total exposure limit that can be allocated to this business type |

### Backend validation

When a loan request comes in, the system finds the `LoanLimitPolicy` matching the borrower's `business_type` and checks:
- `requested_amount >= min_amount`
- `requested_amount <= max_amount`
- `borrower.credit_score >= credit_score_requirement`

Violations are returned as eligibility failures.

### Why this matters

Without loan limit policies, the system has no guardrails on loan size. A borrower could request any amount and the system would have no policy basis to reject it. This also protects the lender from concentration risk — you can set tighter limits for higher-risk business types.

---

## Tier 3 — Eligibility Criteria

**Tab:** `ELIGIBILITY`  
**Purpose:** Define pass/fail rules that a borrower must meet before a loan is even considered. These are binary gates — fail one mandatory criterion and the application is rejected.

### Fields

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| Criteria Name | text | ✅ | Label, e.g. `"Minimum Business Age"` |
| Category | select | ✅ | What aspect of the borrower this criterion evaluates (see categories below) |
| Description | textarea | ✅ | Plain-language explanation of what this criterion checks |
| Requirement | text | ✅ | The rule statement, e.g. `"Business must be registered for at least 12 months"` |
| Minimum Value | number | — | Numeric lower bound for the criterion (e.g. minimum credit score of 500) |
| Maximum Value | number | — | Numeric upper bound (e.g. maximum debt-to-income ratio of 60%) |
| Required | checkbox | — | If checked, failing this criterion immediately disqualifies the borrower. If unchecked, it is advisory only. |

### Categories

| Category | What it checks |
|----------|---------------|
| `credit_score` | Borrower's credit bureau score |
| `business_age` | How long the business has been operating |
| `revenue` | Minimum annual or monthly revenue |
| `collateral` | Whether sufficient collateral is available |
| `guarantor` | Whether a guarantor is required and present |
| `documents` | Whether required documents have been submitted |
| `industry` | Whether the borrower's industry is permitted |
| `location` | Whether the borrower operates in a permitted region |

### Why this matters

Eligibility criteria are your first line of defence. They prevent unqualified borrowers from consuming underwriting resources. In regulated markets, some criteria (KYC documents, minimum credit score) are legally mandatory — marking them as `Required` ensures they are enforced automatically.

---

## Tier 4 — Risk Assessment Rules

**Tab:** `RISK RULES`  
**Purpose:** Define how the borrower's composite risk score (0–100) is calculated. This score determines which Interest Rate Policy applies and appears as `risk_score` in the loan response.

This is the most technically important tier. **Without at least one active rule here, `risk_score` will always be null.**

### Fields

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| Risk Factor | select | ✅ | Which dimension of borrower risk this rule measures (see factors below) |
| Weight (%) | number | ✅ | How much this factor contributes to the overall score. All active rule weights are summed and used as the denominator. They do not need to add up to 100. |
| Excellent Min / Max / Points | number | — | The input value range that qualifies as "excellent" and the score awarded |
| Good Min / Max / Points | number | — | The input value range that qualifies as "good" and the score awarded |
| Fair Min / Max / Points | number | — | The input value range that qualifies as "fair" and the score awarded |
| Poor Min / Max / Points | number | — | The input value range that qualifies as "poor" and the score awarded |

### Risk Factors

| Factor | What it measures | Typical input source |
|--------|-----------------|---------------------|
| `credit_score` | Borrower's credit bureau score | `borrower.credit_score` |
| `payment_history` | Track record of on-time repayments | `borrower.credit_score` (proxy until bureau integration) |
| `debt_to_income` | Total debt as % of income | `borrower.debt_to_income_ratio` |
| `business_age` | Years the business has been operating | `borrower.business_age_years` |
| `industry_risk` | Risk profile of the borrower's industry | External data feed (not yet integrated) |
| `collateral_value` | Value of pledged collateral | `borrower.collateral_value` |
| `cash_flow` | Monthly net cash flow | Financial statements (not yet integrated) |
| `market_conditions` | Macro-economic risk index | External data feed (not yet integrated) |

### How the score is computed

```
For each active rule:
  1. Look up the input value for the rule's factor
  2. Match it against the scoring bands (excellent → good → fair → poor)
  3. Take the matched band's Points value
  4. Multiply by the rule's Weight

risk_score = Σ(points × weight) / Σ(weight)
```

If the input value is missing (null), the factor scores **50** — neutral, neither rewarding nor penalising the borrower for missing data.

### Risk level thresholds

| risk_score | risk_level | Effect |
|------------|------------|--------|
| ≥ 80 | `low` | Matches the `low` Interest Rate Policy → lowest rate |
| 60–79 | `medium` | Matches the `medium` Interest Rate Policy |
| 40–59 | `high` | Matches the `high` Interest Rate Policy |
| < 40 | `critical` | Matches the `critical` Interest Rate Policy → highest rate |

### Example configuration

**Rule: Credit Score**
- Factor: `credit_score`, Weight: `40`
- Excellent: 750–850 → 100 points
- Good: 650–749 → 75 points
- Fair: 550–649 → 50 points
- Poor: 300–549 → 25 points

**Rule: Business Age**
- Factor: `business_age`, Weight: `30`
- Excellent: 5–99 years → 100 points
- Good: 3–4 years → 75 points
- Fair: 1–2 years → 50 points
- Poor: 0–0 years → 20 points

A borrower with credit score 700 and 4 years in business:
- Credit score: 75 points × 40 weight = 3000
- Business age: 75 points × 30 weight = 2250
- risk_score = (3000 + 2250) / (40 + 30) = **75** → `medium` risk level

---

## Tier 5 — Repayment Policies

**Tab:** `REPAYMENT`  
**Purpose:** Define the repayment schedule, grace periods, late fees, and default escalation rules for loans issued under this lender.

### Fields

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| Policy Name | text | ✅ | Label for this repayment structure |
| Frequency | select | ✅ | How often repayments are due: `weekly`, `biweekly`, `monthly`, `quarterly`, `semi_annually`, `annually` |
| Grace Period (days) | number | ✅ | Number of days after a due date before a payment is considered late. A grace period of 5 means the borrower has 5 extra days before penalties apply. |
| Late Fee | number | ✅ | Fixed monetary penalty charged when a payment is overdue (in RWF) |
| Penalty Rate (%) | number | ✅ | Additional interest rate applied to the outstanding balance once a payment is overdue |
| Max Extensions | number | ✅ | Maximum number of times a borrower can request a repayment extension before the loan is escalated |
| Default Threshold (days) | number | ✅ | Number of days overdue before the loan is classified as defaulted and escalation procedures begin |

### Additional backend fields (not yet in modal)

The backend also supports:
- `early_payment_discount` — percentage discount on interest for early repayment
- `allow_partial_payments` — whether the borrower can pay less than the full instalment
- `minimum_payment_percentage` — if partial payments are allowed, the minimum % of the instalment that must be paid
- `escalation_rules` — automated actions triggered at specific overdue thresholds (e.g. send SMS at 7 days, legal notice at 30 days)

### Why this matters

Repayment policies directly affect the lender's cash flow and default rate. A grace period that is too long increases exposure; one that is too short damages borrower relationships. The `default_threshold_days` value is what triggers a loan's status change to `defaulted` in the system.

---

## Tier 6 — Cargo Type Policies

**Tab:** `CARGO POLICIES`  
**Purpose:** Define lending rules specific to the type of cargo being financed. Since this is a freight/logistics lending platform, the cargo being transported is a key risk variable.

### Fields

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| Cargo Type | text | ✅ | Free-text name for the cargo, e.g. `"Refrigerated Pharmaceuticals"` |
| Risk Level | select | ✅ | The inherent risk of this cargo category: `low`, `medium`, `high`, `critical` |
| Risk Multiplier | number | ✅ | A multiplier applied to the base risk score for loans involving this cargo. `1.0` = no change, `1.5` = 50% higher risk weighting, `0.8` = 20% lower. Range: 0.1–10. |
| Max Loan Amount | number | ✅ | The maximum loan the lender will issue for a shipment of this cargo type (in RWF) |
| Insurance Required | checkbox | — | If checked, the borrower must provide proof of cargo insurance before the loan is disbursed |
| Special Conditions | textarea | — | Comma-separated list of conditions that apply, e.g. `"Temperature monitoring required, GPS tracking mandatory"` |

### Additional backend fields (not yet in modal)

- `interest_rate_adjustment` — adds or subtracts a fixed % from the computed interest rate for this cargo type (e.g. hazardous cargo adds +2%)
- `minimum_insurance_coverage` — minimum insured value required
- `required_certifications` — list of certifications the carrier must hold
- `prohibited_routes` — routes where this cargo cannot be financed
- `required_equipment` — specific truck/container types required
- `max_transit_days` — maximum trip duration eligible for financing
- `collateral_requirement_multiplier` — scales the collateral requirement up or down for this cargo

### Why this matters

Cargo type is a direct proxy for loss-given-default. A loan financing hazardous chemicals has a fundamentally different risk profile than one financing dry goods. Without cargo policies, the system treats all cargo identically — which misprices risk and exposes the lender to unexpected losses on high-risk shipments.

---

## Tier 7 — System Configuration

**Tab:** `SYSTEM CONFIG`  
**Purpose:** Global operational settings that govern how the entire lending engine behaves. One record per lender — this is not a list, it is a single configuration object.

### Fields

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| Configuration Name | text | ✅ | Label for this config set |
| Auto Approval Limit | number | ✅ | Loan requests **below** this amount are automatically approved without manual review (in RWF). Set to 0 to disable auto-approval entirely. |
| Manual Review Threshold | number | ✅ | Loan requests **above** this amount require senior review before approval. Should be higher than the auto-approval limit. |
| Max Concurrent Loans | number | ✅ | Maximum number of active (approved + disbursed) loans a single borrower can hold at one time |
| Total Exposure Limit | number | ✅ | The maximum total outstanding loan balance across all borrowers (in RWF). The system will reject new loans that would push the portfolio above this limit. |
| Cooldown Period (days) | number | ✅ | Number of days a borrower must wait after fully repaying a loan before they can apply for another one |
| Strict Compliance Mode | checkbox | — | When enabled, all loans must pass every mandatory eligibility criterion with no exceptions. Disabling allows manual overrides. |
| Audit Trail Enabled | checkbox | — | When enabled, every state change on every loan is logged with a timestamp and the user who made the change |

### Additional backend fields (not yet in modal)

| Field | Description |
|-------|-------------|
| `approval_mode` | `manual` (all loans need human approval), `automatic` (system approves within limits), or `hybrid` (auto below threshold, manual above) |
| `max_portfolio_utilization` | % of `total_exposure_limit` that can be deployed before new loans are paused (default 80%) |
| `default_interest_rate` | Fallback rate used when no Interest Rate Policy matches |
| `default_repayment_term_days` | Default loan term when none is specified in the request |
| `default_advance_percentage` | Default % of cargo value that can be advanced (e.g. 70 = lend up to 70% of the shipment value) |
| `compliance_level` | `basic`, `standard`, `strict`, or `regulatory` — controls how strictly eligibility rules are enforced |
| `kyc_verification_required` | Whether KYC documents must be verified before any loan is approved |
| `aml_screening_enabled` | Whether Anti-Money Laundering screening runs on every borrower |
| `risk_thresholds.minimum_credit_score` | Hard floor — no loan is issued below this score regardless of other policies |
| `risk_thresholds.maximum_debt_to_income` | Hard ceiling on debt-to-income ratio |
| `risk_thresholds.minimum_business_age_months` | Hard minimum business age in months |
| `risk_thresholds.maximum_default_rate` | If the lender's portfolio default rate exceeds this %, new loans are paused |

### Why this matters

System Config is the master switch. The `auto_approval_limit` and `approval_mode` directly control whether loans flow automatically or queue for human review. The `total_exposure_limit` is your capital protection — it prevents the system from over-committing the lender's funds. `kyc_verification_required` and `aml_screening_enabled` are regulatory requirements in most jurisdictions and should be enabled in production.

---

## Minimum viable configuration

To get the system computing real loan terms, you need at minimum:

1. **One active Interest Rate Policy** for each risk level you want to support
2. **One active Risk Assessment Rule** for `credit_score` with scoring bands defined

Everything else is optional but strongly recommended for a production lending operation.

## Policy evaluation order

When a loan request arrives, the system evaluates policies in this order:

```
1. System Config  →  Is the lender accepting new loans? Is the borrower in cooldown?
2. Loan Limits    →  Is the requested amount within bounds for this business type?
3. Eligibility    →  Does the borrower pass all mandatory criteria?
4. Risk Rules     →  Compute risk_score and derive risk_level
5. Cargo Policy   →  Apply cargo-specific multipliers and caps
6. Interest Rates →  Select the policy matching risk_level, compute nominal_rate and EAR
7. Repayment      →  Attach repayment schedule terms to the approved loan
```
