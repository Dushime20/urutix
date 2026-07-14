-- =============================================================================
-- 000_base_schema.sql  —  COMPLETE FOUNDATION SCHEMA
-- =============================================================================
-- This file creates EVERY table that any later migration (001–100) depends on.
-- It is executed unconditionally as a bootstrap step before the migration loop
-- on every container start-up, so every statement MUST be idempotent:
--   • ENUMs        : DO $$ BEGIN ... EXCEPTION WHEN duplicate_object THEN NULL END $$
--   • Tables       : CREATE TABLE IF NOT EXISTS
--   • Indexes      : CREATE [UNIQUE] INDEX IF NOT EXISTS
--   • Constraints  : DO block with pg_constraint existence check
-- =============================================================================

-- ---------------------------------------------------------------------------
-- EXTENSIONS
-- ---------------------------------------------------------------------------
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";
CREATE EXTENSION IF NOT EXISTS "postgis";

-- ---------------------------------------------------------------------------
-- ENUMS
-- ---------------------------------------------------------------------------
DO $$ BEGIN CREATE TYPE tenant_status AS ENUM('ACTIVE','SUSPENDED','PENDING_ACTIVATION','DEACTIVATED'); EXCEPTION WHEN duplicate_object THEN NULL; END $$;
DO $$ BEGIN CREATE TYPE tenant_type AS ENUM('ENTERPRISE','SMALL_BUSINESS','INDIVIDUAL','PARTNER'); EXCEPTION WHEN duplicate_object THEN NULL; END $$;
DO $$ BEGIN CREATE TYPE tenant_kyc_status AS ENUM('PENDING','SUBMITTED','UNDER_REVIEW','APPROVED','REJECTED','INCOMPLETE'); EXCEPTION WHEN duplicate_object THEN NULL; END $$;
DO $$ BEGIN CREATE TYPE user_role AS ENUM('SUPER_ADMIN','ADMIN','TENANT_ADMIN','CARGO_OWNER','CARGO_RECEIVER','TRUCK_OWNER','DRIVER','AGENT','LENDER','BROKER','FLEET_MANAGER','FLEET_DISPATCHER','FLEET_ACCOUNTANT','FLEET_SAFETY_OFFICER','CUSTOMS_OFFICER'); EXCEPTION WHEN duplicate_object THEN NULL; END $$;
DO $$ BEGIN CREATE TYPE user_status AS ENUM('PENDING_VERIFICATION','ACTIVE','SUSPENDED','DEACTIVATED'); EXCEPTION WHEN duplicate_object THEN NULL; END $$;
DO $$ BEGIN CREATE TYPE kyc_status AS ENUM('PENDING','UNDER_REVIEW','VERIFIED','REJECTED'); EXCEPTION WHEN duplicate_object THEN NULL; END $$;
DO $$ BEGIN CREATE TYPE kyc_requirement_level AS ENUM('BASIC','STANDARD','ENHANCED','PREMIUM'); EXCEPTION WHEN duplicate_object THEN NULL; END $$;
DO $$ BEGIN CREATE TYPE load_status AS ENUM('DRAFT','CREATED','PUBLISHED','PENDING_CONFIRMATION','ASSIGNED','LOADED','IN_TRANSIT','DELIVERED','CLOSED','CANCELLED','COMPLETED'); EXCEPTION WHEN duplicate_object THEN NULL; END $$;
DO $$ BEGIN CREATE TYPE load_type AS ENUM('FTL','LTL','REEFER','FLATBED','TANKER','INTERMODAL','OTHER'); EXCEPTION WHEN duplicate_object THEN NULL; END $$;
DO $$ BEGIN CREATE TYPE equipment_type AS ENUM('DRY_VAN','REEFER','FLATBED','TANKER','CONTAINER','OTHER'); EXCEPTION WHEN duplicate_object THEN NULL; END $$;
DO $$ BEGIN CREATE TYPE cargo_type AS ENUM('GENERAL','FRAGILE','HAZARDOUS','REFRIGERATED','LIQUID','OVERSIZED','VALUABLE'); EXCEPTION WHEN duplicate_object THEN NULL; END $$;
DO $$ BEGIN CREATE TYPE urgency_level AS ENUM('LOW','NORMAL','HIGH','CRITICAL'); EXCEPTION WHEN duplicate_object THEN NULL; END $$;
DO $$ BEGIN CREATE TYPE visibility_type AS ENUM('public','private'); EXCEPTION WHEN duplicate_object THEN NULL; END $$;
DO $$ BEGIN CREATE TYPE payment_terms AS ENUM('Prepaid','OnDelivery','Net15','Net30','Net45','Net60'); EXCEPTION WHEN duplicate_object THEN NULL; END $$;
DO $$ BEGIN CREATE TYPE packaging_type AS ENUM('Palletized','Loose','Containerized','Crate','Drum','Other'); EXCEPTION WHEN duplicate_object THEN NULL; END $$;
DO $$ BEGIN CREATE TYPE trip_status AS ENUM('PLANNED','IN_PROGRESS','COMPLETED','CANCELLED','DELAYED'); EXCEPTION WHEN duplicate_object THEN NULL; END $$;
DO $$ BEGIN CREATE TYPE vehicle_status AS ENUM('AVAILABLE','IN_TRANSIT','MAINTENANCE','OUT_OF_SERVICE'); EXCEPTION WHEN duplicate_object THEN NULL; END $$;
DO $$ BEGIN CREATE TYPE driver_status AS ENUM('ACTIVE','INACTIVE','SUSPENDED','ON_LEAVE','TERMINATED','IN_TRANSIT'); EXCEPTION WHEN duplicate_object THEN NULL; END $$;
DO $$ BEGIN CREATE TYPE employment_type AS ENUM('FULL_TIME','PART_TIME','CONTRACT','OWNER_OPERATOR','FREELANCE'); EXCEPTION WHEN duplicate_object THEN NULL; END $$;
DO $$ BEGIN CREATE TYPE fuel_log_status AS ENUM('VERIFIED','PENDING','FLAGGED','REJECTED'); EXCEPTION WHEN duplicate_object THEN NULL; END $$;
DO $$ BEGIN CREATE TYPE payment_method_enum AS ENUM('credit_card','debit_card','bank_transfer','digital_wallet','cash','check','wire_transfer'); EXCEPTION WHEN duplicate_object THEN NULL; END $$;
DO $$ BEGIN CREATE TYPE payment_status_enum AS ENUM('pending','processing','completed','failed','cancelled','refunded','escrow'); EXCEPTION WHEN duplicate_object THEN NULL; END $$;
DO $$ BEGIN CREATE TYPE payment_type_enum AS ENUM('trip_payment','subscription','service_fee','deposit','refund','withdrawal','advance','final'); EXCEPTION WHEN duplicate_object THEN NULL; END $$;
DO $$ BEGIN CREATE TYPE lender_status AS ENUM('active','paused','suspended'); EXCEPTION WHEN duplicate_object THEN NULL; END $$;
DO $$ BEGIN CREATE TYPE loan_request_status AS ENUM('pending','approved','rejected','disbursed','repaid','failed','defaulted'); EXCEPTION WHEN duplicate_object THEN NULL; END $$;
DO $$ BEGIN CREATE TYPE route_status AS ENUM('active','inactive','maintenance'); EXCEPTION WHEN duplicate_object THEN NULL; END $$;
DO $$ BEGIN CREATE TYPE route_type AS ENUM('highway','city','rural','mixed'); EXCEPTION WHEN duplicate_object THEN NULL; END $$;
DO $$ BEGIN CREATE TYPE truck_type AS ENUM('FLATBED','BOX_TRUCK','TANKER','REFRIGERATED','CONTAINER','CAR_CARRIER','HEAVY_HAUL','LOWBED','STEP_DECK','POWER_ONLY','CURTAIN_SIDE','VAN','PLATFORM','BULK','DUMP','CEMENT_MIXER','CRANE','FIRE_TRUCK','AMBULANCE','TOW_TRUCK','GARBAGE','MILITARY','SPECIALIZED'); EXCEPTION WHEN duplicate_object THEN NULL; END $$;
DO $$ BEGIN CREATE TYPE fuel_type AS ENUM('DIESEL','GASOLINE','ELECTRIC','HYBRID','CNG','LNG'); EXCEPTION WHEN duplicate_object THEN NULL; END $$;

-- ---------------------------------------------------------------------------
-- TENANTS
-- ---------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS tenants (
  id                      UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name                    VARCHAR NOT NULL,
  subdomain               VARCHAR,
  domain                  VARCHAR,
  type                    tenant_type NOT NULL DEFAULT 'SMALL_BUSINESS',
  status                  tenant_status NOT NULL DEFAULT 'PENDING_ACTIVATION',
  description             VARCHAR,
  "logoUrl"               VARCHAR,
  "websiteUrl"            VARCHAR,
  "contactEmail"          VARCHAR UNIQUE,
  "contactPhone"          VARCHAR,
  address                 VARCHAR,
  city                    VARCHAR,
  state                   VARCHAR,
  country                 VARCHAR,
  "postalCode"            VARCHAR,
  "taxId"                 VARCHAR,
  "businessLicense"       VARCHAR,
  settings                JSONB NOT NULL DEFAULT '{}',
  features                JSONB NOT NULL DEFAULT '{}',
  "billingInfo"           JSONB NOT NULL DEFAULT '{}',
  "maxUsers"              INTEGER,
  "maxTrucks"             INTEGER,
  "maxDrivers"            INTEGER,
  "maxLoadsPerMonth"      INTEGER,
  "subscriptionPlan"      VARCHAR,
  "subscriptionExpiresAt" TIMESTAMPTZ,
  "trialEndsAt"           TIMESTAMPTZ,
  "isActive"              BOOLEAN NOT NULL DEFAULT false,
  "activatedAt"           TIMESTAMPTZ,
  "suspendedAt"           TIMESTAMPTZ,
  "suspendedReason"       VARCHAR,
  "kycStatus"             tenant_kyc_status NOT NULL DEFAULT 'PENDING',
  "kycData"               JSONB NOT NULL DEFAULT '{}',
  "kycSubmittedAt"        TIMESTAMPTZ,
  "kycVerifiedAt"         TIMESTAMPTZ,
  "kycNotes"              VARCHAR,
  "onboardingStep"        INTEGER NOT NULL DEFAULT 1,
  "createdAt"             TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  "updatedAt"             TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  deleted_at              TIMESTAMPTZ
);
CREATE UNIQUE INDEX IF NOT EXISTS idx_tenants_subdomain ON tenants(subdomain) WHERE deleted_at IS NULL;
CREATE INDEX IF NOT EXISTS idx_tenants_status_type ON tenants(status, type);
CREATE INDEX IF NOT EXISTS idx_tenants_active_plan  ON tenants("isActive", "subscriptionPlan");

-- ---------------------------------------------------------------------------
-- USERS
-- ---------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS users (
  id                      UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  "tenantId"              UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  email                   VARCHAR NOT NULL,
  phone                   VARCHAR,
  "passwordHash"          VARCHAR,
  "emailVerifiedAt"       TIMESTAMPTZ,
  "phoneVerifiedAt"       TIMESTAMPTZ,
  "twoFactorEnabled"      BOOLEAN NOT NULL DEFAULT false,
  "twoFactorSecret"       VARCHAR,
  role                    user_role NOT NULL DEFAULT 'CARGO_OWNER',
  status                  user_status NOT NULL DEFAULT 'PENDING_VERIFICATION',
  "lastLoginAt"           TIMESTAMPTZ,
  "loginAttempts"         INTEGER NOT NULL DEFAULT 0,
  "lockedUntil"           TIMESTAMPTZ,
  "createdByCargoOwnerId" UUID,
  "brokerTenantId"        UUID REFERENCES tenants(id) ON DELETE SET NULL,
  "totalCommissionEarned" DECIMAL(10,2) DEFAULT 0,
  "defaultCommissionRate" DECIMAL(5,2),
  "createdAt"             TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  "updatedAt"             TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  deleted_at              TIMESTAMPTZ
);
DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname='fk_users_created_by' AND conrelid='users'::regclass) THEN
    ALTER TABLE users ADD CONSTRAINT fk_users_created_by
      FOREIGN KEY ("createdByCargoOwnerId") REFERENCES users(id) ON DELETE SET NULL NOT VALID;
  END IF;
END $$;
CREATE UNIQUE INDEX IF NOT EXISTS idx_users_tenant_email_role ON users("tenantId", email, role) WHERE deleted_at IS NULL;
CREATE INDEX IF NOT EXISTS idx_users_role_status ON users(role, status);
CREATE INDEX IF NOT EXISTS idx_users_email      ON users(email);
CREATE INDEX IF NOT EXISTS idx_users_tenant_id  ON users("tenantId");

-- ---------------------------------------------------------------------------
-- USER PROFILES
-- ---------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS user_profiles (
  id                         UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  "userId"                   UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  "tenantId"                 UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  "firstName"                VARCHAR NOT NULL,
  "lastName"                 VARCHAR NOT NULL,
  "companyName"              VARCHAR,
  "taxId"                    VARCHAR,
  "businessLicense"          VARCHAR,
  address                    VARCHAR,
  "cityId"                   INTEGER,
  "postalCode"               VARCHAR,
  "countryCode"              VARCHAR,
  "avatarUrl"                VARCHAR,
  bio                        VARCHAR,
  "websiteUrl"               VARCHAR,
  "insuranceInfo"            JSONB NOT NULL DEFAULT '{}',
  "bankAccountInfo"          JSONB NOT NULL DEFAULT '{}',
  preferences                JSONB NOT NULL DEFAULT '{}',
  "kycStatus"                kyc_status NOT NULL DEFAULT 'PENDING',
  "kycDocuments"             TEXT NOT NULL DEFAULT '[]',
  "kycVerifiedAt"            TIMESTAMPTZ,
  kyc_requirement_level      kyc_requirement_level NOT NULL DEFAULT 'BASIC',
  kyc_submitted_at           TIMESTAMPTZ,
  kyc_reviewed_by            VARCHAR,
  kyc_notes                  VARCHAR,
  kyc_data                   JSONB NOT NULL DEFAULT '{}',
  identity_verified          BOOLEAN NOT NULL DEFAULT false,
  address_verified           BOOLEAN NOT NULL DEFAULT false,
  financial_verified         BOOLEAN NOT NULL DEFAULT false,
  business_verified          BOOLEAN NOT NULL DEFAULT false,
  background_check_completed BOOLEAN NOT NULL DEFAULT false,
  compliance_score           INTEGER NOT NULL DEFAULT 0,
  rating                     DECIMAL(3,2) NOT NULL DEFAULT 0,
  "totalTrips"               INTEGER NOT NULL DEFAULT 0,
  "createdAt"                TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  "updatedAt"                TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  deleted_at                 TIMESTAMPTZ
);
CREATE UNIQUE INDEX IF NOT EXISTS idx_user_profiles_user_id   ON user_profiles("userId");
CREATE INDEX IF NOT EXISTS idx_user_profiles_tenant_kyc        ON user_profiles("tenantId","kycStatus");
CREATE INDEX IF NOT EXISTS idx_user_profiles_kyc_level         ON user_profiles(kyc_requirement_level);

-- ---------------------------------------------------------------------------
-- LOADS
-- ---------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS loads (
  id                                  UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  "tenantId"                          UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  "cargoOwnerId"                      UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  "receiverId"                        UUID REFERENCES users(id) ON DELETE SET NULL,
  "brokerId"                          UUID REFERENCES users(id) ON DELETE SET NULL,
  "brokerCommissionRate"              DECIMAL(5,2),
  "brokerCommissionAmount"            DECIMAL(15,2),
  reference                           VARCHAR,
  title                               VARCHAR NOT NULL,
  description                         TEXT,
  weight                              DECIMAL(10,2) NOT NULL,
  volume                              DECIMAL(10,2),
  "loadType"                          load_type NOT NULL DEFAULT 'FTL',
  "equipmentType"                     equipment_type NOT NULL DEFAULT 'DRY_VAN',
  "cargoType"                         cargo_type NOT NULL DEFAULT 'GENERAL',
  visibility                          visibility_type NOT NULL DEFAULT 'public',
  "unitsRequired"                     INTEGER NOT NULL DEFAULT 1,
  locations                           JSONB NOT NULL DEFAULT '[]',
  origin                              JSONB,
  destination                         JSONB,
  "pickupWindow"                      JSONB,
  "deliveryWindow"                    JSONB,
  "pickupDate"                        TIMESTAMPTZ,
  "deliveryDate"                      TIMESTAMPTZ,
  status                              load_status NOT NULL DEFAULT 'DRAFT',
  "loadValue"                         DECIMAL(15,2) NOT NULL,
  "offeredPrice"                      DECIMAL(15,2),
  "currencyCode"                      VARCHAR(3) NOT NULL DEFAULT 'USD',
  pricing                             JSONB,
  "paymentTerms"                      payment_terms NOT NULL DEFAULT 'Net30',
  "invitedCarriers"                   TEXT,
  "isFragile"                         BOOLEAN NOT NULL DEFAULT false,
  "isHazardous"                       BOOLEAN NOT NULL DEFAULT false,
  "requiresRefrigeration"             BOOLEAN NOT NULL DEFAULT false,
  "contactInfo"                       JSONB NOT NULL DEFAULT '{}',
  "autoMatchEnabled"                  BOOLEAN NOT NULL DEFAULT true,
  "matchingCriteria"                  JSONB NOT NULL DEFAULT '{}',
  "publishedAt"                       TIMESTAMPTZ,
  "assignedTruckId"                   UUID,
  "assignedCarrierId"                 UUID,
  rating                              DECIMAL(3,2) NOT NULL DEFAULT 0,
  "viewCount"                         INTEGER NOT NULL DEFAULT 0,
  length DECIMAL(8,2), width DECIMAL(8,2), height DECIMAL(8,2),
  "stackableHeight"                   DECIMAL(8,2),
  "isStackable"                       BOOLEAN NOT NULL DEFAULT false,
  "temperatureMin"                    DECIMAL(5,2),
  "temperatureMax"                    DECIMAL(5,2),
  "requiresHumidityControl"           BOOLEAN NOT NULL DEFAULT false,
  "requiresForklift"                  BOOLEAN NOT NULL DEFAULT false,
  "requiresCrane"                     BOOLEAN NOT NULL DEFAULT false,
  "requiresLoadingDock"               BOOLEAN NOT NULL DEFAULT false,
  "loadingTimeEstimate"               DECIMAL(5,2),
  "unloadingTimeEstimate"             DECIMAL(5,2),
  "hazmatClass"                       VARCHAR(50),
  "hazmatNumber"                      VARCHAR(20),
  "urgencyLevel"                      urgency_level NOT NULL DEFAULT 'NORMAL',
  "isTimeCritical"                    BOOLEAN NOT NULL DEFAULT false,
  "maxTransitTime"                    DECIMAL(5,2),
  "packagingType"                     packaging_type NOT NULL DEFAULT 'Palletized',
  "numberOfPieces"                    INTEGER NOT NULL DEFAULT 0,
  "numberOfPallets"                   INTEGER NOT NULL DEFAULT 0,
  "requiresGpsMonitoring"             BOOLEAN NOT NULL DEFAULT false,
  "requiresTemperatureMonitoring"     BOOLEAN NOT NULL DEFAULT false,
  "insuranceValue"                    DECIMAL(15,2),
  "requiresLowClearanceRoute"         BOOLEAN NOT NULL DEFAULT false,
  "maxClearanceHeight"                DECIMAL(5,2),
  "requiresEscortVehicle"             BOOLEAN NOT NULL DEFAULT false,
  "specialHandlingInstructions"       TEXT,
  "loadingInstructions"               TEXT,
  "unloadingInstructions"             TEXT,
  "emergencyContactInfo"              TEXT,
  "truckRequirements"                 JSONB NOT NULL DEFAULT '{}',
  "carrierPreferences"                JSONB NOT NULL DEFAULT '{}',
  "costPreferences"                   JSONB NOT NULL DEFAULT '{}',
  "requiresPreShipmentInspection"     BOOLEAN NOT NULL DEFAULT false,
  "requiresDeliveryInspection"        BOOLEAN NOT NULL DEFAULT false,
  "requiresPhotographicDocumentation" BOOLEAN NOT NULL DEFAULT false,
  metadata                            JSONB DEFAULT '{}',
  "createdAt"                         TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  "updatedAt"                         TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  deleted_at                          TIMESTAMPTZ
);
CREATE INDEX IF NOT EXISTS idx_loads_tenant_status ON loads("tenantId", status);
CREATE INDEX IF NOT EXISTS idx_loads_cargo_owner   ON loads("cargoOwnerId");
CREATE INDEX IF NOT EXISTS idx_loads_reference     ON loads(reference);
CREATE INDEX IF NOT EXISTS idx_loads_visibility    ON loads(visibility);

-- ---------------------------------------------------------------------------
-- TRUCKS  (TypeORM entity — referenced by trips, fuel_wallets, fuel_logs)
-- ---------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS trucks (
  id                    UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  "tenantId"            UUID NOT NULL,
  "ownerId"             UUID NOT NULL,
  "plateNumber"         VARCHAR(20) NOT NULL,
  vin                   VARCHAR(17) UNIQUE,
  make                  VARCHAR(100) NOT NULL DEFAULT '',
  model                 VARCHAR(100) NOT NULL DEFAULT '',
  year                  INTEGER NOT NULL DEFAULT 2020,
  color                 VARCHAR(50),
  "fuelType"            fuel_type NOT NULL DEFAULT 'DIESEL',
  "capacityWeight"      DECIMAL(10,2) NOT NULL DEFAULT 0,
  "capacityVolume"      DECIMAL(10,2) NOT NULL DEFAULT 0,
  "truckType"           truck_type NOT NULL DEFAULT 'FLATBED',
  status                vehicle_status NOT NULL DEFAULT 'AVAILABLE',
  "currentLocation"     geometry(Point,4326),
  current_address       VARCHAR,
  "locationUpdatedAt"   TIMESTAMPTZ,
  "registrationNumber"  VARCHAR(50),
  "registrationExpiry"  DATE,
  "insurancePolicy"     VARCHAR(50),
  "insuranceExpiry"     DATE,
  "hasRefrigeration"    BOOLEAN NOT NULL DEFAULT false,
  "hasLiftGate"         BOOLEAN NOT NULL DEFAULT false,
  "hasGps"              BOOLEAN NOT NULL DEFAULT false,
  "hasHazmatPermit"     BOOLEAN NOT NULL DEFAULT false,
  "equipmentList"       JSONB NOT NULL DEFAULT '[]',
  "lastMaintenanceDate" DATE,
  "nextMaintenanceDate" DATE,
  mileage               INTEGER NOT NULL DEFAULT 0,
  "totalTrips"          INTEGER NOT NULL DEFAULT 0,
  "totalRevenue"        DECIMAL(15,2) NOT NULL DEFAULT 0,
  "averageRating"       DECIMAL(3,2) NOT NULL DEFAULT 0,
  "currentDriverId"     UUID,
  "currentTripId"       UUID,
  "isActive"            BOOLEAN NOT NULL DEFAULT true,
  "cargoCapabilities"   JSONB NOT NULL DEFAULT '{}',
  "loadingCapabilities" JSONB NOT NULL DEFAULT '{}',
  "securityFeatures"    JSONB NOT NULL DEFAULT '{}',
  certifications        JSONB NOT NULL DEFAULT '{}',
  "routeCapabilities"   JSONB NOT NULL DEFAULT '{}',
  "costStructure"       JSONB NOT NULL DEFAULT '{}',
  "assignedDrivers"     JSONB NOT NULL DEFAULT '[]',
  "assignedRoutes"      JSONB NOT NULL DEFAULT '[]',
  "maintenanceAlerts"   JSONB NOT NULL DEFAULT '[]',
  "createdAt"           TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  "updatedAt"           TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  deleted_at            TIMESTAMPTZ
);
CREATE UNIQUE INDEX IF NOT EXISTS idx_trucks_tenant_plate ON trucks("tenantId","plateNumber") WHERE deleted_at IS NULL;
CREATE INDEX IF NOT EXISTS idx_trucks_owner_status ON trucks("ownerId", status);

-- ---------------------------------------------------------------------------
-- DRIVERS  (TypeORM entity — referenced by trips, fuel_wallets, fuel_logs)
-- ---------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS drivers (
  id                      UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  "tenantId"              UUID NOT NULL,
  "userId"                UUID NOT NULL,
  "employerId"            UUID NOT NULL,
  "employeeId"            VARCHAR,
  "firstName"             VARCHAR NOT NULL DEFAULT '',
  "lastName"              VARCHAR NOT NULL DEFAULT '',
  email                   VARCHAR NOT NULL DEFAULT '',
  phone                   VARCHAR NOT NULL DEFAULT '',
  "dateOfBirth"           DATE,
  address                 TEXT,
  "emergencyContact"      JSONB NOT NULL DEFAULT '{}',
  "licenseNumber"         VARCHAR(100) UNIQUE,
  "licenseClasses"        JSONB NOT NULL DEFAULT '[]',
  "licenseIssueDate"      DATE,
  "licenseExpiry"         DATE,
  "licenseState"          VARCHAR(100),
  "licenseCountry"        VARCHAR(100),
  endorsements            JSONB NOT NULL DEFAULT '[]',
  restrictions            JSONB NOT NULL DEFAULT '[]',
  "employmentType"        employment_type NOT NULL DEFAULT 'FULL_TIME',
  "hireDate"              DATE,
  "terminationDate"       DATE,
  status                  driver_status NOT NULL DEFAULT 'ACTIVE',
  "availabilityStatus"    VARCHAR NOT NULL DEFAULT 'AVAILABLE',
  "currentTruckId"        UUID,
  "currentTripId"         UUID,
  "currentLocation"       geometry(Point,4326),
  "locationUpdatedAt"     TIMESTAMPTZ,
  "hoursWorkedThisWeek"   DECIMAL(5,2) NOT NULL DEFAULT 0,
  "hoursWorkedThisMonth"  DECIMAL(5,2) NOT NULL DEFAULT 0,
  "lastBreakTime"         TIMESTAMPTZ,
  "consecutiveDrivingHours" INTEGER NOT NULL DEFAULT 0,
  "medicalCertExpiry"     DATE,
  "drugTestDate"          DATE,
  "backgroundCheckDate"   DATE,
  "trainingCompletionDate" DATE,
  certifications          JSONB NOT NULL DEFAULT '[]',
  rating                  DECIMAL(3,2) NOT NULL DEFAULT 0,
  "totalTrips"            INTEGER NOT NULL DEFAULT 0,
  "totalDistance"         DECIMAL(12,2) NOT NULL DEFAULT 0,
  "safetyScore"           DECIMAL(5,2) NOT NULL DEFAULT 100,
  "onTimeDeliveryRate"    DECIMAL(5,2) NOT NULL DEFAULT 0,
  "hourlyRate"            DECIMAL(10,2),
  "mileageRate"           DECIMAL(10,2),
  "totalEarnings"         DECIMAL(15,2) NOT NULL DEFAULT 0,
  experience              INTEGER,
  "driverNotes"           TEXT,
  preferences             JSONB NOT NULL DEFAULT '{}',
  "hoursOfService"        JSONB NOT NULL DEFAULT '{"breaks":[],"drivingHours":0,"onDutyHours":0,"offDutyHours":0}',
  "createdAt"             TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  "updatedAt"             TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  deleted_at              TIMESTAMPTZ
);
CREATE UNIQUE INDEX IF NOT EXISTS idx_drivers_license ON drivers("licenseNumber") WHERE deleted_at IS NULL;
CREATE INDEX IF NOT EXISTS idx_drivers_tenant_status ON drivers("tenantId", status);
CREATE INDEX IF NOT EXISTS idx_drivers_user_id       ON drivers("userId");

-- ---------------------------------------------------------------------------
-- TRIPS  (TypeORM entity — referenced by payments, fuel_wallets, loan_requests)
-- ---------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS trips (
  id                  UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  "tenantId"          UUID NOT NULL,
  "loadId"            UUID NOT NULL,
  "truckId"           UUID NOT NULL,
  "driverId"          UUID,
  "tripNumber"        VARCHAR(50) UNIQUE NOT NULL,
  status              trip_status NOT NULL DEFAULT 'PLANNED',
  "plannedStartTime"  TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  "plannedEndTime"    TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  "actualStartTime"   TIMESTAMPTZ,
  "estimatedEndTime"  TIMESTAMPTZ,
  "actualEndTime"     TIMESTAMPTZ,
  "plannedRoute"      JSONB,
  "actualRoute"       JSONB,
  "totalDistance"     DECIMAL(10,2),
  "agreedPrice"       DECIMAL(15,2) NOT NULL DEFAULT 0,
  "currencyCode"      VARCHAR(3) NOT NULL DEFAULT 'USD',
  "fuelCost"          DECIMAL(10,2),
  "tollsCost"         DECIMAL(10,2),
  "otherExpenses"     DECIMAL(10,2),
  "totalCost"         DECIMAL(15,2),
  "profitMargin"      DECIMAL(5,2),
  "fuelEfficiency"    DECIMAL(8,2),
  "averageSpeed"      DECIMAL(8,2),
  "onTimePerformance" BOOLEAN,
  eta                 TIMESTAMPTZ,
  distance            FLOAT,
  duration            FLOAT,
  "currentLocation"   geometry(Point,4326),
  "locationUpdatedAt" TIMESTAMPTZ,
  "estimatedArrival"  TIMESTAMPTZ,
  "cargoOwnerRating"  DECIMAL(3,2),
  "cargoOwnerFeedback" TEXT,
  "driverRating"      DECIMAL(3,2),
  "driverFeedback"    TEXT,
  notes               TEXT,
  "issuesReported"    JSONB NOT NULL DEFAULT '[]',
  "createdAt"         TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  "updatedAt"         TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  "completedAt"       TIMESTAMPTZ,
  deleted_at          TIMESTAMPTZ
);
CREATE INDEX IF NOT EXISTS idx_trips_tenant_status ON trips("tenantId", status);
CREATE INDEX IF NOT EXISTS idx_trips_load_id       ON trips("loadId");
CREATE INDEX IF NOT EXISTS idx_trips_truck_driver  ON trips("truckId", "driverId");

-- ---------------------------------------------------------------------------
-- PAYMENTS  (TypeORM entity — referenced by credit_transactions, subscription_payments)
-- ---------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS payments (
  id               UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  "idempotencyKey" VARCHAR,
  "tenantId"       UUID NOT NULL,
  "tripId"         UUID,
  "payerId"        UUID NOT NULL,
  "payeeId"        UUID,
  amount           DECIMAL(10,2) NOT NULL,
  currency         VARCHAR(3) NOT NULL,
  "paymentMethod"  payment_method_enum NOT NULL,
  "paymentType"    payment_type_enum NOT NULL,
  status           payment_status_enum NOT NULL DEFAULT 'pending',
  description      VARCHAR,
  "referenceNumber" VARCHAR,
  "transactionId"  VARCHAR,
  "gatewayResponse" VARCHAR,
  "failureReason"  VARCHAR,
  "billingAddress" VARCHAR,
  notes            VARCHAR,
  "dueDate"        TIMESTAMPTZ,
  "processedAt"    TIMESTAMPTZ,
  "processingFee"  DECIMAL(10,2),
  metadata         JSONB NOT NULL DEFAULT '{}',
  "createdAt"      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  "updatedAt"      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  deleted_at       TIMESTAMPTZ
);
CREATE INDEX IF NOT EXISTS idx_payments_tenant_status ON payments("tenantId", status);
CREATE INDEX IF NOT EXISTS idx_payments_trip_id       ON payments("tripId");
CREATE INDEX IF NOT EXISTS idx_payments_payer_payee   ON payments("payerId", "payeeId");

-- ---------------------------------------------------------------------------
-- FUEL_LOGS  (TypeORM entity — referenced by fuel_wallet_transactions)
-- ---------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS fuel_logs (
  id               UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id        UUID NOT NULL,
  user_id          UUID NOT NULL,
  truck_id         UUID NOT NULL,
  driver_id        UUID,
  created_by       UUID NOT NULL,
  fuel_date        TIMESTAMPTZ NOT NULL,
  fuel_amount      DECIMAL(10,2) NOT NULL,
  gallons          DECIMAL(10,2) NOT NULL DEFAULT 0,
  price_per_gallon DECIMAL(10,2) NOT NULL DEFAULT 0,
  total_cost       DECIMAL(10,2) NOT NULL DEFAULT 0,
  location         VARCHAR(255) NOT NULL DEFAULT '',
  odometer         DECIMAL(10,2),
  status           fuel_log_status NOT NULL DEFAULT 'PENDING',
  receipt_number   VARCHAR(100),
  payment_method   VARCHAR(100),
  notes            TEXT,
  metadata         JSONB NOT NULL DEFAULT '{}',
  is_flagged       BOOLEAN NOT NULL DEFAULT false,
  flag_reason      TEXT,
  created_at       TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at       TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_fuel_logs_tenant_truck  ON fuel_logs(tenant_id, truck_id);
CREATE INDEX IF NOT EXISTS idx_fuel_logs_tenant_driver ON fuel_logs(tenant_id, driver_id);
CREATE INDEX IF NOT EXISTS idx_fuel_logs_tenant_status ON fuel_logs(tenant_id, status);

-- ---------------------------------------------------------------------------
-- ACTIVITY_LOGS
-- ---------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS activity_logs (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id       UUID REFERENCES users(id) ON DELETE SET NULL,
  action        VARCHAR(100) NOT NULL,
  resource      VARCHAR(100),
  resource_id   VARCHAR(255),
  details       JSONB,
  ip_address    INET,
  user_agent    TEXT,
  location      JSONB,
  is_suspicious BOOLEAN NOT NULL DEFAULT false,
  session_id    VARCHAR(255),
  created_at    TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_activity_logs_user_id    ON activity_logs(user_id);
CREATE INDEX IF NOT EXISTS idx_activity_logs_action     ON activity_logs(action);
CREATE INDEX IF NOT EXISTS idx_activity_logs_resource   ON activity_logs(resource, resource_id);
CREATE INDEX IF NOT EXISTS idx_activity_logs_created_at ON activity_logs(created_at);
CREATE INDEX IF NOT EXISTS idx_activity_logs_suspicious ON activity_logs(is_suspicious) WHERE is_suspicious = true;

-- ---------------------------------------------------------------------------
-- LENDERS  (TypeORM entity — referenced by loan_requests)
-- ---------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS lenders (
  id                         UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id                  UUID NOT NULL,
  name                       VARCHAR(255) NOT NULL,
  api_key_hash               VARCHAR(500) NOT NULL DEFAULT '',
  callback_url               VARCHAR(500),
  outbound_api_key_encrypted VARCHAR(1000),
  webhook_secret_encrypted   VARCHAR(1000),
  contact_email              VARCHAR(255) NOT NULL DEFAULT '',
  status                     lender_status NOT NULL DEFAULT 'active',
  metadata                   JSONB,
  created_at                 TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at                 TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_lenders_tenant_status ON lenders(tenant_id, status);

-- ---------------------------------------------------------------------------
-- BORROWERS  (TypeORM entity — referenced by loan_requests)
-- ---------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS borrowers (
  id         UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id  UUID NOT NULL,
  user_id    UUID REFERENCES users(id) ON DELETE SET NULL,
  metadata   JSONB NOT NULL DEFAULT '{}',
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_borrowers_tenant ON borrowers(tenant_id);

-- ---------------------------------------------------------------------------
-- LOAN_REQUESTS  (TypeORM entity — referenced by loan_disbursements, loan_repayments)
-- ---------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS loan_requests (
  id                    UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id             UUID NOT NULL,
  cargo_id              UUID NOT NULL,
  trip_id               UUID NOT NULL,
  lender_id             UUID,
  requested_amount      DECIMAL(15,2) NOT NULL,
  approved_amount       DECIMAL(15,2),
  status                loan_request_status NOT NULL DEFAULT 'pending',
  idempotency_key       VARCHAR(255) UNIQUE NOT NULL,
  interest_amount       DECIMAL(15,2),
  due_date              DATE,
  created_by            UUID NOT NULL,
  borrower_id           UUID,
  external_loan_ref     VARCHAR(255),
  rejection_reason      TEXT,
  requested_split       JSON,
  metadata              JSON,
  loan_number           VARCHAR(50) UNIQUE,
  purpose               VARCHAR(100),
  kyc_verified          BOOLEAN NOT NULL DEFAULT false,
  currency              VARCHAR(3) NOT NULL DEFAULT 'RWF',
  origination_fee_rate  DECIMAL(5,4),
  origination_fee_amount DECIMAL(15,2),
  total_cost_of_credit  DECIMAL(15,2),
  apr                   DECIMAL(7,4),
  collateral_description VARCHAR(500),
  collateral_value      DECIMAL(15,2),
  ltv_ratio             DECIMAL(5,4),
  grace_period_end      DATE,
  days_past_due         INTEGER NOT NULL DEFAULT 0,
  ifrs9_stage           INTEGER NOT NULL DEFAULT 1,
  risk_score            DECIMAL(5,2),
  risk_tier             VARCHAR(20),
  pd_at_origination     DECIMAL(6,4),
  lgd_at_origination    DECIMAL(6,4),
  expected_loss         DECIMAL(6,4),
  repaid_at             TIMESTAMPTZ,
  defaulted_at          TIMESTAMPTZ,
  created_at            TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at            TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_loan_requests_tenant_status ON loan_requests(tenant_id, status);
CREATE INDEX IF NOT EXISTS idx_loan_requests_lender        ON loan_requests(lender_id);

-- ---------------------------------------------------------------------------
-- ROUTES  (TypeORM entity — referenced by route_trucks)
-- ---------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS routes (
  id               UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  "tenantId"       UUID NOT NULL,
  name             VARCHAR(100) NOT NULL,
  origin           VARCHAR(100) NOT NULL,
  destination      VARCHAR(100) NOT NULL,
  origin_lat       DECIMAL(10,7),
  origin_lng       DECIMAL(10,7),
  origin_address   VARCHAR(255),
  destination_lat  DECIMAL(10,7),
  destination_lng  DECIMAL(10,7),
  destination_address VARCHAR(255),
  distance         DECIMAL(10,2) NOT NULL DEFAULT 0,
  "estimatedTime"  INTEGER NOT NULL DEFAULT 0,
  "routeType"      route_type NOT NULL DEFAULT 'highway',
  status           route_status NOT NULL DEFAULT 'active',
  "assignedTrucks" JSONB NOT NULL DEFAULT '[]',
  "assignedDrivers" JSONB NOT NULL DEFAULT '[]',
  description      VARCHAR,
  created_by       UUID,
  "isActive"       BOOLEAN NOT NULL DEFAULT true,
  "createdAt"      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  "updatedAt"      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  deleted_at       TIMESTAMPTZ
);
CREATE UNIQUE INDEX IF NOT EXISTS idx_routes_tenant_name ON routes("tenantId", name) WHERE deleted_at IS NULL;

-- ---------------------------------------------------------------------------
-- EPODS  (TypeORM entity — referenced by migration 041)
-- ---------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS epods (
  id         UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  "tenantId" UUID NOT NULL,
  "tripId"   UUID UNIQUE,
  status     VARCHAR(50) NOT NULL DEFAULT 'PENDING',
  metadata   JSONB NOT NULL DEFAULT '{}',
  "createdAt" TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  "updatedAt" TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  deleted_at  TIMESTAMPTZ
);
CREATE INDEX IF NOT EXISTS idx_epods_tenant ON epods("tenantId");

