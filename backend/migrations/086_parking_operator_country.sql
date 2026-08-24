ALTER TABLE parking_reservations
  ADD COLUMN IF NOT EXISTS "companyCountry" VARCHAR(2) NOT NULL DEFAULT '',
  ADD COLUMN IF NOT EXISTS "operatorPrimaryLabel" VARCHAR(80),
  ADD COLUMN IF NOT EXISTS "operatorSecondaryLabel" VARCHAR(80);

UPDATE parking_reservations
SET
  "companyCountry" = CASE WHEN COALESCE("companyCountry", '') = '' THEN 'US' ELSE "companyCountry" END,
  "operatorPrimaryLabel" = COALESCE("operatorPrimaryLabel", 'MC Number'),
  "operatorSecondaryLabel" = COALESCE("operatorSecondaryLabel", 'USDOT Number')
WHERE COALESCE("companyCountry", '') = ''
   OR "operatorPrimaryLabel" IS NULL;

ALTER TABLE parking_reservations
  ALTER COLUMN "usdotNumber" SET DEFAULT '';
