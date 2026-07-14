-- Migration: 000_base_schema.sql
-- Description: Creates core tables (tenants, users, user_profiles, loads, activity_logs)
--              that ALL subsequent migrations depend on.
--
-- IDEMPOTENCY CONTRACT
-- ====================
-- Every statement in this file is fully idempotent:
--   • ENUMs        — DO $$ BEGIN ... EXCEPTION WHEN duplicate_object THEN NULL END $$
--   • Tables       — CREATE TABLE IF NOT EXISTS
--   • Indexes      — CREATE [UNIQUE] INDEX IF NOT EXISTS
--   • Constraints  — guarded by pg_constraint lookup inside DO blocks
--
-- This file is executed as a BOOTSTRAP step before the normal migration loop
-- on every container start-up, so it MUST be a safe no-op when the schema
-- already exists.

-- ============================================================================
-- EXTENSIONS
-- ============================================================================
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- ============================================================================
-- ENUMS
-- ============================================================================

DO $$ BEGIN CREATE TYPE tenant_status AS ENUM (
  'ACTIVE','SUSPENDED','PENDING_ACTIVATION','DEACTIVATED'
); EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN CREATE TYPE tenant_type AS ENUM (
  'ENTERPRISE','SMALL_BUSINESS','INDIVIDUAL','PARTNER'
); EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN CREATE TYPE tenant_kyc_status AS ENUM (
  'PENDING','SUBMITTED','UNDER_REVIEW','APPROVED','REJECTED','INCOMPLETE'
); EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN CREATE TYPE user_role AS ENUM (
  'SUPER_ADMIN','ADMIN','TENANT_ADMIN','CARGO_OWNER','CARGO_RECEIVER',
  'TRUCK_OWNER','DRIVER','AGENT','LENDER','BROKER',
  'FLEET_MANAGER','FLEET_DISPATCHER','FLEET_ACCOUNTANT',
  'FLEET_SAFETY_OFFICER','CUSTOMS_OFFICER'
); EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN CREATE TYPE user_status AS ENUM (
  'PENDING_VERIFICATION','ACTIVE','SUSPENDED','DEACTIVATED'
); EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN CREATE TYPE kyc_status AS ENUM (
  'PENDING','UNDER_REVIEW','VERIFIED','REJECTED'
); EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN CREATE TYPE kyc_requirement_level AS ENUM (
  'BASIC','STANDARD','ENHANCED','PREMIUM'
); EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN CREATE TYPE load_status AS ENUM (
  'DRAFT','CREATED','PUBLISHED','PENDING_CONFIRMATION',
  'ASSIGNED','LOADED','IN_TRANSIT','DELIVERED','CLOSED','CANCELLED','COMPLETED'
); EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN CREATE TYPE load_type AS ENUM (
  'FTL','LTL','REEFER','FLATBED','TANKER','INTERMODAL','OTHER'
); EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN CREATE TYPE equipment_type AS ENUM (
  'DRY_VAN','REEFER','FLATBED','TANKER','CONTAINER','OTHER'
); EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN CREATE TYPE cargo_type AS ENUM (
  'GENERAL','FRAGILE','HAZARDOUS','REFRIGERATED','LIQUID','OVERSIZED','VALUABLE'
); EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN CREATE TYPE urgency_level AS ENUM (
  'LOW','NORMAL','HIGH','CRITICAL'
); EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN CREATE TYPE visibility_type AS ENUM (
  'public','private'
); EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN CREATE TYPE payment_terms AS ENUM (
  'Prepaid','OnDelivery','Net15','Net30','Net45','Net60'
); EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN CREATE TYPE packaging_type AS ENUM (
  'Palletized','Loose','Containerized','Crate','Drum','Other'
); EXCEPTION WHEN duplicate_object THEN NULL; END $$;

-- ============================================================================
-- TENANTS
-- ============================================================================

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

CREATE UNIQUE INDEX IF NOT EXISTS idx_tenants_subdomain
  ON tenants(subdomain) WHERE deleted_at IS NULL;
CREATE INDEX IF NOT EXISTS idx_tenants_status_type ON tenants(status, type);
CREATE INDEX IF NOT EXISTS idx_tenants_active_plan  ON tenants("isActive", "subscriptionPlan");

-- ============================================================================
-- USERS
-- ============================================================================

CREATE TABLE IF NOT EXISTS users (
  id                       UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  "tenantId"               UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  email                    VARCHAR NOT NULL,
  phone                    VARCHAR,
  "passwordHash"           VARCHAR,
  "emailVerifiedAt"        TIMESTAMPTZ,
  "phoneVerifiedAt"        TIMESTAMPTZ,
  "twoFactorEnabled"       BOOLEAN NOT NULL DEFAULT false,
  "twoFactorSecret"        VARCHAR,
  role                     user_role NOT NULL DEFAULT 'CARGO_OWNER',
  status                   user_status NOT NULL DEFAULT 'PENDING_VERIFICATION',
  "lastLoginAt"            TIMESTAMPTZ,
  "loginAttempts"          INTEGER NOT NULL DEFAULT 0,
  "lockedUntil"            TIMESTAMPTZ,
  "createdByCargoOwnerId"  UUID,
  "brokerTenantId"         UUID REFERENCES tenants(id) ON DELETE SET NULL,
  "totalCommissionEarned"  DECIMAL(10,2) DEFAULT 0,
  "defaultCommissionRate"  DECIMAL(5,2),
  "createdAt"              TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  "updatedAt"              TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  deleted_at               TIMESTAMPTZ
);

-- Self-referential FK — guarded so re-runs are safe
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint
    WHERE conname = 'fk_users_created_by' AND conrelid = 'users'::regclass
  ) THEN
    ALTER TABLE users
      ADD CONSTRAINT fk_users_created_by
      FOREIGN KEY ("createdByCargoOwnerId") REFERENCES users(id) ON DELETE SET NULL
      NOT VALID;
  END IF;
END $$;

CREATE UNIQUE INDEX IF NOT EXISTS idx_users_tenant_email_role
  ON users("tenantId", email, role) WHERE deleted_at IS NULL;
CREATE INDEX IF NOT EXISTS idx_users_role_status ON users(role, status);
CREATE INDEX IF NOT EXISTS idx_users_email      ON users(email);
CREATE INDEX IF NOT EXISTS idx_users_tenant_id  ON users("tenantId");

-- ============================================================================
-- USER PROFILES
-- ============================================================================

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

CREATE UNIQUE INDEX IF NOT EXISTS idx_user_profiles_user_id
  ON user_profiles("userId");
CREATE INDEX IF NOT EXISTS idx_user_profiles_tenant_kyc
  ON user_profiles("tenantId", "kycStatus");
CREATE INDEX IF NOT EXISTS idx_user_profiles_kyc_level
  ON user_profiles(kyc_requirement_level);
CREATE INDEX IF NOT EXISTS idx_user_profiles_rating
  ON user_profiles(rating, "totalTrips");

-- ============================================================================
-- LOADS
-- ============================================================================

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
  length                              DECIMAL(8,2),
  width                               DECIMAL(8,2),
  height                              DECIMAL(8,2),
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

CREATE INDEX IF NOT EXISTS idx_loads_tenant_status_owner
  ON loads("tenantId", status, "cargoOwnerId");
CREATE INDEX IF NOT EXISTS idx_loads_status_dates
  ON loads(status, "pickupDate", "deliveryDate");
CREATE INDEX IF NOT EXISTS idx_loads_cargo_urgency
  ON loads("cargoType", "urgencyLevel");
CREATE INDEX IF NOT EXISTS idx_loads_tenant_status  ON loads("tenantId", status);
CREATE INDEX IF NOT EXISTS idx_loads_cargo_owner    ON loads("cargoOwnerId");
CREATE INDEX IF NOT EXISTS idx_loads_reference      ON loads(reference);
CREATE INDEX IF NOT EXISTS idx_loads_visibility     ON loads(visibility);
CREATE INDEX IF NOT EXISTS idx_loads_load_type      ON loads("loadType");
CREATE INDEX IF NOT EXISTS idx_loads_equipment_type ON loads("equipmentType");

-- ============================================================================
-- ACTIVITY LOGS
-- ============================================================================

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

CREATE INDEX IF NOT EXISTS idx_activity_logs_user_id
  ON activity_logs(user_id);
CREATE INDEX IF NOT EXISTS idx_activity_logs_action
  ON activity_logs(action);
CREATE INDEX IF NOT EXISTS idx_activity_logs_resource
  ON activity_logs(resource, resource_id);
CREATE INDEX IF NOT EXISTS idx_activity_logs_created_at
  ON activity_logs(created_at);
CREATE INDEX IF NOT EXISTS idx_activity_logs_suspicious
  ON activity_logs(is_suspicious) WHERE is_suspicious = true;
