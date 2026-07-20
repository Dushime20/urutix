-- Migration: 059_add_loan_terms_acceptance_fields
-- Description: Borrower terms-acceptance tracking for TILA-compliant loan workflow
--              (offer → accept → disburse). Idempotent — safe on Docker startup via migrate.js.

DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.tables
    WHERE table_schema = 'public' AND table_name = 'loan_requests'
  ) THEN
    IF NOT EXISTS (
      SELECT 1 FROM information_schema.columns
      WHERE table_name = 'loan_requests' AND column_name = 'terms_offered_at'
    ) THEN
      ALTER TABLE loan_requests ADD COLUMN terms_offered_at TIMESTAMP;
    END IF;

    IF NOT EXISTS (
      SELECT 1 FROM information_schema.columns
      WHERE table_name = 'loan_requests' AND column_name = 'borrower_accepted_at'
    ) THEN
      ALTER TABLE loan_requests ADD COLUMN borrower_accepted_at TIMESTAMP;
    END IF;

    IF NOT EXISTS (
      SELECT 1 FROM information_schema.columns
      WHERE table_name = 'loan_requests' AND column_name = 'terms_declined_at'
    ) THEN
      ALTER TABLE loan_requests ADD COLUMN terms_declined_at TIMESTAMP;
    END IF;

    IF NOT EXISTS (
      SELECT 1 FROM information_schema.columns
      WHERE table_name = 'loan_requests' AND column_name = 'terms_decline_reason'
    ) THEN
      ALTER TABLE loan_requests ADD COLUMN terms_decline_reason TEXT;
    END IF;

    IF NOT EXISTS (
      SELECT 1 FROM information_schema.columns
      WHERE table_name = 'loan_requests' AND column_name = 'loan_term_months'
    ) THEN
      ALTER TABLE loan_requests ADD COLUMN loan_term_months INTEGER;
    END IF;
  END IF;
END $$;

COMMENT ON COLUMN loan_requests.terms_offered_at IS
  'When lender formally offered terms — borrower must accept before disbursement';
COMMENT ON COLUMN loan_requests.borrower_accepted_at IS
  'Borrower electronic consent timestamp — required before disbursement';
COMMENT ON COLUMN loan_requests.terms_declined_at IS
  'When borrower declined the offered terms';
COMMENT ON COLUMN loan_requests.terms_decline_reason IS
  'Borrower reason for declining offered terms';
COMMENT ON COLUMN loan_requests.loan_term_months IS
  'Agreed repayment term in months at origination';
