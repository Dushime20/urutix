# Loan Terms Null Values — Root Cause & Fix Guide

## What you're seeing

```json
{
  "loanTerms": [],
  "interest_rate": null,
  "effective_annual_rate": null,
  "risk_score": null,
  "credit_score": null
}
```

All four computed fields are null and `loanTerms` is an empty array. This document explains exactly why, and what needs to be true for them to populate.

---

## How the values are calculated

### Step 1 — Risk Score

`risk_score` is a weighted average across all **active** `LendingPolicyRiskAssessment` rules for the lender.

For each rule:
1. The rule's `factor` (e.g. `credit_score`, `debt_to_income`, `business_age`) is mapped to an input value from the borrower's profile.
2. That input value is matched against the rule's `scoring_criteria` bands: `excellent → good → fair → poor`.
3. The matched band's `score` is multiplied by the rule's `weight`.
4. Missing input data scores **50** (neutral — conservative but not punitive).

```
risk_score = Σ(factor_score × weight) / Σ(weight)
```

### Step 2 — Risk Level

Derived from `risk_score`:

| Score     | Risk Level |
|-----------|------------|
| ≥ 80      | `low`      |
| 60 – 79   | `medium`   |
| 40 – 59   | `high`     |
| < 40      | `critical` |

### Step 3 — Nominal Interest Rate

1. Find the highest-priority **active** `LendingPolicyInterestRate` record whose `risk_level` matches the derived risk level.
2. If no exact match, fall back to the highest-priority active policy regardless of risk level.
3. Apply `adjustment_factors.credit_score` if configured:
   ```
   adjustment = adj.credit_score × ((borrower_credit_score - 575) / 275)
   nominal_rate = clamp(base_rate + adjustment, min_rate, max_rate)
   ```

### Step 4 — Effective Annual Rate (APR)

Monthly compounding formula (standard for consumer/SME lending):

```
EAR = (1 + nominal_rate / 100 / 12)^12 - 1
effective_annual_rate = EAR × 100   (expressed as %)
```

This is the figure disclosed to borrowers per TILA (US), MCD (EU), NCA (SA) requirements.

### Step 5 — Persistence

An immutable `loan_terms` record is written to the database **once** per loan request. It stores:
- All computed values
- A full snapshot of the policy used (so policy changes never retroactively alter issued loans)
- The `engine_version` so scoring logic changes are traceable
- The per-factor `risk_score_breakdown` for audit

---

## Why everything is null right now

There are **three independent reasons** all firing at once:

### Reason 1 — `lender_id` is null at creation time (most common)

`computeLoanTerms` is only called inside this guard:

```typescript
// lending.service.ts — createLoanRequest()
if (savedLoan.lender_id) {
  const terms = await this.computeLoanTerms(...);
}
```

When a borrower submits a loan request **without specifying a lender**, `lender_id` is `null` at save time. The system then calls `processLoanRequest()` to auto-assign a lender — but that method only saves `loan.lender_id` to the DB. It does **not** call `computeLoanTerms` afterwards.

**Result:** The loan gets a lender assigned, but `computeLoanTerms` is never called, so `loan_terms` stays empty and all values stay null.

**Fix:** Call `computeLoanTerms` inside `processLoanRequest` after the lender is assigned:

```typescript
// After: await this.loanRequestRepository.save(loan);
await this.computeLoanTerms(lender.id, loan.borrower?.credit_score ?? null, loan.id);
```

### Reason 2 — No active lending policies for the lender

`computeLoanTerms` returns all nulls immediately if the lender has no active policies:

```typescript
if (!interestRatePolicies.length && !riskRules.length) {
  this.logger.warn(`computeLoanTerms: no active policies for lender ${lenderId}`);
  return { interest_rate: null, ... };
}
```

**Check:** Go to `/lender/policies` and confirm the lender has at least one active **Interest Rate Policy** and at least one active **Risk Assessment Rule**.

If the policies page is empty, create them. The lender must have:
- ≥ 1 active `LendingPolicyInterestRate` record
- ≥ 1 active `LendingPolicyRiskAssessment` record (for risk scoring)

### Reason 3 — Borrower has no `credit_score`

`credit_score` in the response comes from `borrower.credit_score`. If the `Borrower` record was created without a credit score, it is `null`.

When `credit_score` is null, the `credit_score` factor scores **50** (neutral), but factors like `debt_to_income`, `business_age`, and `collateral_value` also have no input data — they all score 50. The risk score will compute, but `credit_score` in the response will still show `null` because there is no real value to display.

**Fix:** Ensure borrower profiles are created with a `credit_score` value, or integrate a credit bureau lookup when a borrower is onboarded.

---

## Existing loans (already in DB)

Loans created before this feature was implemented have no `loan_terms` record and no computed values in `metadata`. They will always return null unless you backfill them.

**Backfill approach:** Write a one-time script that:
1. Queries all `loan_requests` where `lender_id IS NOT NULL`
2. For each, calls `computeLoanTerms(loan.lender_id, borrower.credit_score, loan.id)`
3. Skips any loan that already has a `loan_terms` record (the method is idempotent — it checks `if (!existing)` before inserting)

---

## Summary checklist

To get real values in the response, all of the following must be true:

| # | Condition | How to verify |
|---|-----------|---------------|
| 1 | Loan has a `lender_id` assigned **before** `computeLoanTerms` is called | Check `loan_requests.lender_id` in DB |
| 2 | `computeLoanTerms` is called after lender assignment (gap in `processLoanRequest`) | Apply the fix in Reason 1 above |
| 3 | Lender has ≥ 1 active `LendingPolicyInterestRate` record | Check `/lender/policies` → Interest Rates tab |
| 4 | Lender has ≥ 1 active `LendingPolicyRiskAssessment` record | Check `/lender/policies` → Risk Assessment tab |
| 5 | Borrower has a `credit_score` value | Check `borrowers.credit_score` in DB |
| 6 | A `loan_terms` row exists for the loan | `SELECT * FROM loan_terms WHERE loan_request_id = '<id>'` |

---

## Immediate fix to apply

In `backend/src/modules/lending/lending.service.ts`, inside `processLoanRequest`, add the `computeLoanTerms` call after the lender is saved:

```typescript
loan.lender_id = lender.id;
await this.loanRequestRepository.save(loan);
this.logger.log(`processLoanRequest: Successfully assigned lender to loan ${loanId}`);

// Compute and persist loan terms now that lender is known
try {
  const fullLoan = await this.loanRequestRepository.findOne({
    where: { id: loanId },
    relations: ['borrower'],
  });
  if (fullLoan) {
    await this.computeLoanTerms(
      lender.id,
      fullLoan.borrower?.credit_score ?? null,
      loanId,
    );
  }
} catch (termsErr) {
  this.logger.error(`processLoanRequest: computeLoanTerms failed for ${loanId}: ${termsErr.message}`);
}
```
