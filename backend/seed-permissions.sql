-- ============================================================
-- URUTIX — Full Permission & Role Seed  (schema-aware version)
-- role_permissions uses: role_id UUID FK → roles.id
--
-- Run inside container:
--   docker exec -i urutix_db_dev psql -U postgres -d urutix < seed-permissions.sql
-- ============================================================

BEGIN;

-- ── 1. Seed system roles ──────────────────────────────────────────────────
INSERT INTO roles (name, description, is_system) VALUES
  ('SUPER_ADMIN',     'Full system access across all tenants',     true),
  ('ADMIN',           'Tenant-level administrative access',         true),
  ('TENANT_ADMIN',    'Tenant admin with limited scope',            true),
  ('CARGO_OWNER',     'Cargo owner — create & manage loads',        true),
  ('TRUCK_OWNER',     'Truck fleet owner — manage fleet & trips',   true),
  ('DRIVER',          'Driver — operational trip access',           true),
  ('BROKER',          'Broker — intermediary access',               true),
  ('AGENT',           'Agent — limited operational access',         true),
  ('LENDER',          'Lender — financial lending access',          true),
  ('CUSTOMS_OFFICER', 'Customs — inspection & compliance access',   true),
  ('RECEIVER',        'Receiver — cargo delivery confirmation',     true)
ON CONFLICT (name) DO UPDATE
  SET description = EXCLUDED.description,
      is_system   = EXCLUDED.is_system,
      updated_at  = now();

-- ── 2. Seed all permissions ───────────────────────────────────────────────
INSERT INTO permissions (resource, action, description, category) VALUES
-- USER MANAGEMENT
('users','view','View all platform users','user_management'),
('users','create','Create new user accounts','user_management'),
('users','edit','Edit user profiles and details','user_management'),
('users','delete','Delete user accounts','user_management'),
('users','activate','Activate or deactivate user accounts','user_management'),
('users','suspend','Suspend user accounts','user_management'),
('users','assign_role','Assign or change user roles','user_management'),
('users','permissions.manage','Grant / revoke individual user permissions','user_management'),
('users','view_own','View own profile','user_management'),
('users','edit_own','Edit own profile','user_management'),
-- CARGO
('cargo','view','View all cargo loads','cargo_management'),
('cargo','view_own','View own cargo loads','cargo_management'),
('cargo','create','Create new cargo loads','cargo_management'),
('cargo','edit','Edit existing cargo loads','cargo_management'),
('cargo','delete','Delete cargo loads','cargo_management'),
('cargo','approve','Approve or reject cargo loads','cargo_management'),
('cargo','archive','Archive completed cargo loads','cargo_management'),
('cargo','bulk_upload','Bulk upload cargo loads via CSV','cargo_management'),
('cargo','assign_receiver','Assign receiver to a cargo load','cargo_management'),
('cargo','view_map','View cargo on map','cargo_management'),
-- FLEET
('fleet','view','View all fleet trucks','fleet_management'),
('fleet','view_own','View own fleet trucks','fleet_management'),
('fleet','create','Add new trucks to fleet','fleet_management'),
('fleet','edit','Edit fleet vehicle details','fleet_management'),
('fleet','delete','Remove vehicles from fleet','fleet_management'),
('fleet','assign_driver','Assign drivers to trucks','fleet_management'),
('fleet','view_tco','View Total Cost of Ownership analysis','fleet_management'),
('fleet','view_routes','View truck route history','fleet_management'),
-- DRIVERS
('drivers','view','View all driver profiles','driver_management'),
('drivers','view_own','View own driver profile','driver_management'),
('drivers','create','Onboard new drivers','driver_management'),
('drivers','edit','Edit driver details','driver_management'),
('drivers','delete','Remove driver accounts','driver_management'),
('drivers','extract_document','Extract text from driver documents (OCR)','driver_management'),
-- TRIPS
('trips','view','View all trips','trip_management'),
('trips','view_assigned','View trips assigned to me','trip_management'),
('trips','create','Create new trips','trip_management'),
('trips','edit','Edit trip details','trip_management'),
('trips','delete','Delete trips','trip_management'),
('trips','start','Start a trip','trip_management'),
('trips','complete','Mark a trip as completed','trip_management'),
('trips','pause','Pause an active trip','trip_management'),
('trips','resume','Resume a paused trip','trip_management'),
('trips','cancel','Cancel a trip','trip_management'),
('trips','assign_driver','Assign a driver to a trip','trip_management'),
('trips','track','Track real-time trip location','trip_management'),
('trips','view_epod','View electronic proof of delivery','trip_management'),
('trips','confirm_epod','Confirm electronic proof of delivery','trip_management'),
-- BIDDING
('auctions','view','View active and past auctions','bidding'),
('auctions','create','Create new auction events','bidding'),
('auctions','manage','Manage auction lifecycle (open/close/cancel)','bidding'),
('auctions','watch','Watch / follow an auction','bidding'),
('bids','view','View all bids on auctions','bidding'),
('bids','view_own','View own bids','bidding'),
('bids','create','Place a bid on an auction','bidding'),
('bids','manage','Accept, reject or manage bids','bidding'),
('bids','view_history','View full bid history','bidding'),
-- MATCHING
('matching','request','Request AI smart matching','matching'),
('matching','respond','Respond to a match request','matching'),
('matching','view_results','View match results','matching'),
('matching','analytics','View cargo alignment analytics','matching'),
-- BROKERS
('brokers','view','View broker profiles','broker_management'),
('brokers','create','Create broker accounts','broker_management'),
('brokers','edit','Edit broker details','broker_management'),
('brokers','delete','Remove broker accounts','broker_management'),
('brokers','assign','Assign broker to a load','broker_management'),
('brokers','view_commissions','View broker commission records','broker_management'),
('brokers','request_payout','Request commission payout','broker_management'),
-- RECEIVERS
('receivers','view','View receiver profiles','receiver_management'),
('receivers','create','Create receiver accounts','receiver_management'),
('receivers','edit','Edit receiver details','receiver_management'),
('receivers','delete','Delete receiver accounts','receiver_management'),
('receivers','inspect','Submit cargo inspection on delivery','receiver_management'),
('receivers','view_epods','View own ePOD documents','receiver_management'),
-- PAYMENTS
('payments','view','View all payment transactions','financial'),
('payments','view_own','View own payment transactions','financial'),
('payments','manage','Process and manage payments','financial'),
('payments','refund','Issue payment refunds','financial'),
('invoices','view','View invoices and billing records','financial'),
('invoices','view_own','View own invoices','financial'),
('invoices','create','Generate new invoices','financial'),
('escrow','view','View escrow accounts and balances','financial'),
('escrow','manage','Manage escrow transactions','financial'),
('revenue','view','View revenue summaries','financial'),
('revenue','view_own','View own tenant revenue','financial'),
-- CREDITS / SUBSCRIPTIONS
('credits','view','View credit balance and transactions','credits'),
('credits','purchase','Purchase credits','credits'),
('credits','consume','Consume credits for features','credits'),
('credits','admin','Admin credit adjustments and grants','credits'),
('credits','view_packages','View available credit packages','credits'),
('subscriptions','view','View subscription plans','credits'),
('subscriptions','purchase','Purchase a subscription plan','credits'),
('subscriptions','manage','Manage subscriptions','credits'),
('subscriptions','admin','Admin subscription management','credits'),
-- LENDING
('lending','view','View lending dashboard and loan data','lending'),
('lending','view_own','View own loan requests and status','lending'),
('lending','create_request','Create a new loan request','lending'),
('lending','approve','Approve or reject loan requests','lending'),
('lending','disburse','Manage loan disbursements','lending'),
('lending','repayment','View and manage loan repayments','lending'),
('lending','credit_check','Perform credit checks on borrowers','lending'),
('lending','portfolio','View lender portfolio analytics','lending'),
('lending','policies','Manage lending policies','lending'),
('lending','team','Manage lender team members','lending'),
('lending','market_trends','View market trends and benchmarks','lending'),
-- ANALYTICS
('analytics','view_own','View own analytics dashboard','analytics'),
('analytics','view_tenant','View tenant-wide analytics','analytics'),
('analytics','view_all','View platform-wide analytics','analytics'),
('reports','view','Access analytics dashboards and reports','analytics'),
('reports','export','Export data and generate report files','analytics'),
('analytics','predictions','View AI predictions and ETA estimates','analytics'),
('analytics','heatmap','View demand heatmaps','analytics'),
('analytics','scoring','View carrier and driver scoring','analytics'),
-- TRACKING
('tracking','view','View real-time tracking for all loads','tracking'),
('tracking','view_own','View tracking for own loads/trips','tracking'),
('tracking','geofencing','Create and manage geofencing zones','tracking'),
-- DOCUMENTS
('documents','view','View uploaded documents','documents'),
('documents','view_own','View own uploaded documents','documents'),
('documents','upload','Upload new documents','documents'),
('documents','delete','Delete documents','documents'),
('documents','ocr','Run OCR / text extraction on documents','documents'),
-- CUSTOMS
('customs','view','View customs dashboard and inspections','customs'),
('customs','create','Create customs inspections','customs'),
('customs','update','Update customs inspection status','customs'),
('customs','flag','Flag a shipment for customs inspection','customs'),
('customs','manage_checkpoints','Manage customs checkpoints','customs'),
-- SAFETY
('safety','view','View safety dashboard','safety'),
('safety','incidents','Manage safety incidents','safety'),
('safety','inspections','Manage vehicle safety inspections','safety'),
('safety','trainings','Manage driver safety trainings','safety'),
('safety','compliance','View compliance status reports','safety'),
-- MAINTENANCE
('maintenance','view','View maintenance logs','maintenance'),
('maintenance','create','Create maintenance records','maintenance'),
('maintenance','edit','Edit maintenance records','maintenance'),
('maintenance','delete','Delete maintenance records','maintenance'),
-- INSURANCE
('insurance','view','View insurance policies and claims','insurance'),
('insurance','create','Create insurance policies and claims','insurance'),
('insurance','edit','Edit insurance records','insurance'),
('insurance','delete','Delete insurance records','insurance'),
('insurance','bulk','Bulk update insurance records','insurance'),
-- FUEL
('fuel','view','View fuel wallet and transactions','fuel'),
('fuel','view_own','View own fuel wallet','fuel'),
('fuel','add_credit','Add fuel wallet credits','fuel'),
('fuel','request_advance','Request fuel advance','fuel'),
('fuel','approve_advance','Approve or reject fuel advances','fuel'),
-- NOTIFICATIONS
('notifications','view','View notifications','notifications'),
('notifications','manage','Manage notification templates and settings','notifications'),
('notifications','send','Send bulk notifications','notifications'),
-- RATINGS
('ratings','view','View ratings and reviews','ratings'),
('ratings','create','Submit ratings for completed trips','ratings'),
('ratings','manage','Manage platform ratings (admin)','ratings'),
-- REWARDS / SCORING
('rewards','view','View available rewards','rewards'),
('rewards','redeem','Redeem earned rewards','rewards'),
('rewards','manage','Manage reward programs (admin)','rewards'),
('scoring','view','View credit and performance scores','rewards'),
('scoring','calculate','Trigger score recalculation','rewards'),
-- CARRIER MARKETPLACE
('carrier_marketplace','view','Browse carrier marketplace','marketplace'),
('carrier_marketplace','network','Manage carrier network','marketplace'),
-- MESSENGER
('messenger','view','View message threads','communication'),
('messenger','send','Send messages','communication'),
-- LOAD TEMPLATES
('load_templates','view','View load templates','cargo_management'),
('load_templates','create','Create load templates','cargo_management'),
('load_templates','edit','Edit load templates','cargo_management'),
('load_templates','delete','Delete load templates','cargo_management'),
('load_templates','schedule','Schedule loads from templates','cargo_management'),
-- LOCATIONS
('locations','view','View location database','system_admin'),
('locations','manage','Manage location database','system_admin'),
('locations','enrich','Enrich locations with OSM data','system_admin'),
-- SYSTEM ADMIN
('settings','view','View system configuration settings','system_admin'),
('settings','edit','Modify system configuration','system_admin'),
('settings','cache','Clear and refresh system cache','system_admin'),
('settings','test_integrations','Test email/SMS integrations','system_admin'),
('auditlogs','view','View audit trail and activity logs','system_admin'),
('system','manage','Full system administration access','system_admin'),
('activity_logs','view','View platform activity logs and stats','system_admin'),
('bulk_email','send','Send bulk emails to users','system_admin'),
('bulk_email','manage','Manage bulk email templates','system_admin'),
('currency','view','View currencies and exchange rates','system_admin'),
('currency','manage','Manage currencies and rates','system_admin'),
-- ADMIN PANEL
('admin','view','Access admin dashboard','admin'),
('admin','manage_users','Manage all platform users','admin'),
('admin','manage_tenants','Manage tenant organizations','admin'),
('admin','manage_subscriptions','Manage subscription plans','admin'),
('admin','manage_credits','Manage platform credits and bonuses','admin'),
('admin','manage_routes','Manage platform routes','admin'),
('admin','view_financials','View full financial overview','admin'),
('admin','view_analytics','View full platform analytics','admin'),
('admin','manage_permissions','Manage roles and permissions','admin'),
('admin','view_disputes','View and manage disputes','admin'),
('admin','view_health','View system health and vitals','admin'),
('admin','view_all_tenants','View all tenant organizations','admin'),
('admin','operational','Access operational admin panel','admin'),
-- TENANT
('tenant','view','View tenant dashboard','tenant'),
('tenant','manage_users','Manage users within own tenant','tenant'),
('tenant','view_analytics','View tenant analytics','tenant'),
('tenant','manage_billing','Manage tenant billing and subscription','tenant'),
('tenant','branding','Manage tenant branding','tenant'),
('tenant','view_credits','View tenant credit balance','tenant'),
-- PERMISSIONS
('permissions','view','View permissions and roles','security'),
('permissions','manage','Manage permissions and roles','security'),
('permissions','grant','Grant permissions to users or roles','security'),
('permissions','revoke','Revoke permissions from users or roles','security'),
('permissions','audit','View permission audit logs','security')
ON CONFLICT (resource, action) DO UPDATE
  SET description = EXCLUDED.description,
      category    = EXCLUDED.category;


-- ── 3. Assign permissions to roles (using UUID joins) ─────────────────────
-- Helper uses role name + resource + action → inserts into role_permissions

CREATE OR REPLACE FUNCTION grp(p_role_name varchar, p_resource varchar, p_action varchar)
RETURNS void AS $$
DECLARE
  v_role_id uuid;
  v_perm_id uuid;
BEGIN
  SELECT id INTO v_role_id FROM roles       WHERE name     = p_role_name;
  SELECT id INTO v_perm_id FROM permissions WHERE resource = p_resource AND action = p_action;
  IF v_role_id IS NOT NULL AND v_perm_id IS NOT NULL THEN
    INSERT INTO role_permissions (role_id, permission_id)
    VALUES (v_role_id, v_perm_id)
    ON CONFLICT (role_id, permission_id) DO NOTHING;
  END IF;
END;
$$ LANGUAGE plpgsql;

-- Clear and re-seed role assignments
DELETE FROM role_permissions;

-- ── ADMIN ─────────────────────────────────────────────────────────────────
SELECT grp('ADMIN','users','view');
SELECT grp('ADMIN','users','create');
SELECT grp('ADMIN','users','edit');
SELECT grp('ADMIN','users','delete');
SELECT grp('ADMIN','users','activate');
SELECT grp('ADMIN','users','suspend');
SELECT grp('ADMIN','users','assign_role');
SELECT grp('ADMIN','users','permissions.manage');
SELECT grp('ADMIN','cargo','view');
SELECT grp('ADMIN','cargo','edit');
SELECT grp('ADMIN','cargo','approve');
SELECT grp('ADMIN','cargo','delete');
SELECT grp('ADMIN','fleet','view');
SELECT grp('ADMIN','drivers','view');
SELECT grp('ADMIN','trips','view');
SELECT grp('ADMIN','trips','edit');
SELECT grp('ADMIN','trips','delete');
SELECT grp('ADMIN','auctions','view');
SELECT grp('ADMIN','auctions','manage');
SELECT grp('ADMIN','bids','view');
SELECT grp('ADMIN','bids','manage');
SELECT grp('ADMIN','payments','view');
SELECT grp('ADMIN','payments','manage');
SELECT grp('ADMIN','payments','refund');
SELECT grp('ADMIN','invoices','view');
SELECT grp('ADMIN','invoices','create');
SELECT grp('ADMIN','escrow','view');
SELECT grp('ADMIN','escrow','manage');
SELECT grp('ADMIN','revenue','view');
SELECT grp('ADMIN','credits','admin');
SELECT grp('ADMIN','subscriptions','admin');
SELECT grp('ADMIN','analytics','view_all');
SELECT grp('ADMIN','reports','view');
SELECT grp('ADMIN','reports','export');
SELECT grp('ADMIN','tracking','view');
SELECT grp('ADMIN','documents','view');
SELECT grp('ADMIN','customs','view');
SELECT grp('ADMIN','safety','view');
SELECT grp('ADMIN','auditlogs','view');
SELECT grp('ADMIN','notifications','manage');
SELECT grp('ADMIN','notifications','send');
SELECT grp('ADMIN','ratings','manage');
SELECT grp('ADMIN','brokers','view');
SELECT grp('ADMIN','admin','view');
SELECT grp('ADMIN','admin','manage_users');
SELECT grp('ADMIN','admin','manage_tenants');
SELECT grp('ADMIN','admin','view_financials');
SELECT grp('ADMIN','admin','view_analytics');
SELECT grp('ADMIN','admin','view_disputes');
SELECT grp('ADMIN','admin','view_health');
SELECT grp('ADMIN','admin','manage_subscriptions');
SELECT grp('ADMIN','admin','manage_credits');
SELECT grp('ADMIN','admin','manage_routes');
SELECT grp('ADMIN','admin','view_all_tenants');
SELECT grp('ADMIN','admin','operational');
SELECT grp('ADMIN','permissions','view');
SELECT grp('ADMIN','currency','view');
SELECT grp('ADMIN','settings','view');
SELECT grp('ADMIN','settings','edit');
SELECT grp('ADMIN','activity_logs','view');
SELECT grp('ADMIN','bulk_email','send');
SELECT grp('ADMIN','bulk_email','manage');
SELECT grp('ADMIN','rewards','manage');
SELECT grp('ADMIN','lending','view');
SELECT grp('ADMIN','locations','view');
SELECT grp('ADMIN','locations','manage');

-- ── TENANT_ADMIN ──────────────────────────────────────────────────────────
SELECT grp('TENANT_ADMIN','users','view');
SELECT grp('TENANT_ADMIN','users','create');
SELECT grp('TENANT_ADMIN','users','edit');
SELECT grp('TENANT_ADMIN','users','activate');
SELECT grp('TENANT_ADMIN','users','suspend');
SELECT grp('TENANT_ADMIN','cargo','view');
SELECT grp('TENANT_ADMIN','cargo','approve');
SELECT grp('TENANT_ADMIN','fleet','view');
SELECT grp('TENANT_ADMIN','trips','view');
SELECT grp('TENANT_ADMIN','payments','view');
SELECT grp('TENANT_ADMIN','invoices','view');
SELECT grp('TENANT_ADMIN','revenue','view_own');
SELECT grp('TENANT_ADMIN','analytics','view_tenant');
SELECT grp('TENANT_ADMIN','reports','view');
SELECT grp('TENANT_ADMIN','credits','view');
SELECT grp('TENANT_ADMIN','credits','view_packages');
SELECT grp('TENANT_ADMIN','subscriptions','view');
SELECT grp('TENANT_ADMIN','subscriptions','manage');
SELECT grp('TENANT_ADMIN','notifications','view');
SELECT grp('TENANT_ADMIN','tenant','view');
SELECT grp('TENANT_ADMIN','tenant','manage_users');
SELECT grp('TENANT_ADMIN','tenant','view_analytics');
SELECT grp('TENANT_ADMIN','tenant','manage_billing');
SELECT grp('TENANT_ADMIN','tenant','branding');
SELECT grp('TENANT_ADMIN','tenant','view_credits');
SELECT grp('TENANT_ADMIN','auditlogs','view');

-- ── CARGO_OWNER ───────────────────────────────────────────────────────────
SELECT grp('CARGO_OWNER','cargo','view_own');
SELECT grp('CARGO_OWNER','cargo','create');
SELECT grp('CARGO_OWNER','cargo','edit');
SELECT grp('CARGO_OWNER','cargo','delete');
SELECT grp('CARGO_OWNER','cargo','archive');
SELECT grp('CARGO_OWNER','cargo','assign_receiver');
SELECT grp('CARGO_OWNER','cargo','view_map');
SELECT grp('CARGO_OWNER','auctions','view');
SELECT grp('CARGO_OWNER','auctions','create');
SELECT grp('CARGO_OWNER','bids','view');
SELECT grp('CARGO_OWNER','bids','manage');
SELECT grp('CARGO_OWNER','matching','request');
SELECT grp('CARGO_OWNER','matching','view_results');
SELECT grp('CARGO_OWNER','trips','view_assigned');
SELECT grp('CARGO_OWNER','trips','view_epod');
SELECT grp('CARGO_OWNER','tracking','view_own');
SELECT grp('CARGO_OWNER','payments','view_own');
SELECT grp('CARGO_OWNER','invoices','view_own');
SELECT grp('CARGO_OWNER','invoices','create');
SELECT grp('CARGO_OWNER','lending','view_own');
SELECT grp('CARGO_OWNER','lending','create_request');
SELECT grp('CARGO_OWNER','analytics','view_own');
SELECT grp('CARGO_OWNER','documents','view_own');
SELECT grp('CARGO_OWNER','documents','upload');
SELECT grp('CARGO_OWNER','ratings','view');
SELECT grp('CARGO_OWNER','ratings','create');
SELECT grp('CARGO_OWNER','rewards','view');
SELECT grp('CARGO_OWNER','rewards','redeem');
SELECT grp('CARGO_OWNER','load_templates','view');
SELECT grp('CARGO_OWNER','load_templates','create');
SELECT grp('CARGO_OWNER','load_templates','edit');
SELECT grp('CARGO_OWNER','load_templates','delete');
SELECT grp('CARGO_OWNER','load_templates','schedule');
SELECT grp('CARGO_OWNER','messenger','view');
SELECT grp('CARGO_OWNER','messenger','send');
SELECT grp('CARGO_OWNER','notifications','view');
SELECT grp('CARGO_OWNER','credits','view');
SELECT grp('CARGO_OWNER','credits','purchase');
SELECT grp('CARGO_OWNER','subscriptions','view');
SELECT grp('CARGO_OWNER','subscriptions','purchase');
SELECT grp('CARGO_OWNER','carrier_marketplace','view');
SELECT grp('CARGO_OWNER','users','view_own');
SELECT grp('CARGO_OWNER','users','edit_own');
SELECT grp('CARGO_OWNER','scoring','view');

-- ── TRUCK_OWNER ───────────────────────────────────────────────────────────
SELECT grp('TRUCK_OWNER','fleet','view_own');
SELECT grp('TRUCK_OWNER','fleet','create');
SELECT grp('TRUCK_OWNER','fleet','edit');
SELECT grp('TRUCK_OWNER','fleet','delete');
SELECT grp('TRUCK_OWNER','fleet','assign_driver');
SELECT grp('TRUCK_OWNER','fleet','view_tco');
SELECT grp('TRUCK_OWNER','fleet','view_routes');
SELECT grp('TRUCK_OWNER','drivers','view_own');
SELECT grp('TRUCK_OWNER','drivers','create');
SELECT grp('TRUCK_OWNER','drivers','edit');
SELECT grp('TRUCK_OWNER','auctions','view');
SELECT grp('TRUCK_OWNER','bids','view_own');
SELECT grp('TRUCK_OWNER','bids','create');
SELECT grp('TRUCK_OWNER','bids','view_history');
SELECT grp('TRUCK_OWNER','matching','respond');
SELECT grp('TRUCK_OWNER','trips','view');
SELECT grp('TRUCK_OWNER','trips','assign_driver');
SELECT grp('TRUCK_OWNER','trips','view_epod');
SELECT grp('TRUCK_OWNER','tracking','view_own');
SELECT grp('TRUCK_OWNER','payments','view_own');
SELECT grp('TRUCK_OWNER','invoices','view_own');
SELECT grp('TRUCK_OWNER','maintenance','view');
SELECT grp('TRUCK_OWNER','maintenance','create');
SELECT grp('TRUCK_OWNER','maintenance','edit');
SELECT grp('TRUCK_OWNER','safety','view');
SELECT grp('TRUCK_OWNER','safety','inspections');
SELECT grp('TRUCK_OWNER','insurance','view');
SELECT grp('TRUCK_OWNER','insurance','create');
SELECT grp('TRUCK_OWNER','fuel','view_own');
SELECT grp('TRUCK_OWNER','fuel','approve_advance');
SELECT grp('TRUCK_OWNER','lending','view_own');
SELECT grp('TRUCK_OWNER','lending','create_request');
SELECT grp('TRUCK_OWNER','analytics','view_own');
SELECT grp('TRUCK_OWNER','documents','view_own');
SELECT grp('TRUCK_OWNER','documents','upload');
SELECT grp('TRUCK_OWNER','ratings','view');
SELECT grp('TRUCK_OWNER','ratings','create');
SELECT grp('TRUCK_OWNER','rewards','view');
SELECT grp('TRUCK_OWNER','rewards','redeem');
SELECT grp('TRUCK_OWNER','carrier_marketplace','view');
SELECT grp('TRUCK_OWNER','carrier_marketplace','network');
SELECT grp('TRUCK_OWNER','messenger','view');
SELECT grp('TRUCK_OWNER','messenger','send');
SELECT grp('TRUCK_OWNER','notifications','view');
SELECT grp('TRUCK_OWNER','credits','view');
SELECT grp('TRUCK_OWNER','credits','purchase');
SELECT grp('TRUCK_OWNER','subscriptions','view');
SELECT grp('TRUCK_OWNER','subscriptions','purchase');
SELECT grp('TRUCK_OWNER','users','view_own');
SELECT grp('TRUCK_OWNER','users','edit_own');
SELECT grp('TRUCK_OWNER','scoring','view');

-- ── DRIVER ────────────────────────────────────────────────────────────────
SELECT grp('DRIVER','trips','view_assigned');
SELECT grp('DRIVER','trips','start');
SELECT grp('DRIVER','trips','complete');
SELECT grp('DRIVER','trips','pause');
SELECT grp('DRIVER','trips','resume');
SELECT grp('DRIVER','trips','view_epod');
SELECT grp('DRIVER','trips','confirm_epod');
SELECT grp('DRIVER','tracking','view_own');
SELECT grp('DRIVER','fuel','view_own');
SELECT grp('DRIVER','fuel','request_advance');
SELECT grp('DRIVER','safety','view');
SELECT grp('DRIVER','safety','incidents');
SELECT grp('DRIVER','documents','view_own');
SELECT grp('DRIVER','documents','upload');
SELECT grp('DRIVER','notifications','view');
SELECT grp('DRIVER','ratings','view');
SELECT grp('DRIVER','messenger','view');
SELECT grp('DRIVER','messenger','send');
SELECT grp('DRIVER','users','view_own');
SELECT grp('DRIVER','users','edit_own');

-- ── BROKER ────────────────────────────────────────────────────────────────
SELECT grp('BROKER','cargo','view');
SELECT grp('BROKER','auctions','view');
SELECT grp('BROKER','bids','view');
SELECT grp('BROKER','bids','create');
SELECT grp('BROKER','trips','view');
SELECT grp('BROKER','brokers','view');
SELECT grp('BROKER','brokers','view_commissions');
SELECT grp('BROKER','brokers','request_payout');
SELECT grp('BROKER','matching','request');
SELECT grp('BROKER','matching','view_results');
SELECT grp('BROKER','payments','view_own');
SELECT grp('BROKER','documents','view_own');
SELECT grp('BROKER','messenger','view');
SELECT grp('BROKER','messenger','send');
SELECT grp('BROKER','notifications','view');
SELECT grp('BROKER','users','view_own');
SELECT grp('BROKER','users','edit_own');

-- ── AGENT ─────────────────────────────────────────────────────────────────
SELECT grp('AGENT','cargo','view');
SELECT grp('AGENT','cargo','create');
SELECT grp('AGENT','auctions','view');
SELECT grp('AGENT','bids','view');
SELECT grp('AGENT','trips','view');
SELECT grp('AGENT','matching','request');
SELECT grp('AGENT','tracking','view_own');
SELECT grp('AGENT','payments','view_own');
SELECT grp('AGENT','documents','view_own');
SELECT grp('AGENT','messenger','view');
SELECT grp('AGENT','messenger','send');
SELECT grp('AGENT','notifications','view');
SELECT grp('AGENT','users','view_own');
SELECT grp('AGENT','users','edit_own');

-- ── LENDER ────────────────────────────────────────────────────────────────
SELECT grp('LENDER','lending','view');
SELECT grp('LENDER','lending','approve');
SELECT grp('LENDER','lending','disburse');
SELECT grp('LENDER','lending','repayment');
SELECT grp('LENDER','lending','credit_check');
SELECT grp('LENDER','lending','portfolio');
SELECT grp('LENDER','lending','policies');
SELECT grp('LENDER','lending','team');
SELECT grp('LENDER','lending','market_trends');
SELECT grp('LENDER','analytics','view_own');
SELECT grp('LENDER','reports','view');
SELECT grp('LENDER','reports','export');
SELECT grp('LENDER','documents','view');
SELECT grp('LENDER','payments','view_own');
SELECT grp('LENDER','messenger','view');
SELECT grp('LENDER','messenger','send');
SELECT grp('LENDER','notifications','view');
SELECT grp('LENDER','users','view_own');
SELECT grp('LENDER','users','edit_own');
SELECT grp('LENDER','scoring','view');

-- ── CUSTOMS_OFFICER ───────────────────────────────────────────────────────
SELECT grp('CUSTOMS_OFFICER','customs','view');
SELECT grp('CUSTOMS_OFFICER','customs','create');
SELECT grp('CUSTOMS_OFFICER','customs','update');
SELECT grp('CUSTOMS_OFFICER','customs','flag');
SELECT grp('CUSTOMS_OFFICER','cargo','view');
SELECT grp('CUSTOMS_OFFICER','trips','view');
SELECT grp('CUSTOMS_OFFICER','documents','view');
SELECT grp('CUSTOMS_OFFICER','safety','compliance');
SELECT grp('CUSTOMS_OFFICER','notifications','view');
SELECT grp('CUSTOMS_OFFICER','users','view_own');
SELECT grp('CUSTOMS_OFFICER','users','edit_own');

-- ── RECEIVER ──────────────────────────────────────────────────────────────
SELECT grp('RECEIVER','receivers','view');
SELECT grp('RECEIVER','receivers','inspect');
SELECT grp('RECEIVER','receivers','view_epods');
SELECT grp('RECEIVER','cargo','view_own');
SELECT grp('RECEIVER','trips','view_epod');
SELECT grp('RECEIVER','trips','confirm_epod');
SELECT grp('RECEIVER','documents','view_own');
SELECT grp('RECEIVER','notifications','view');
SELECT grp('RECEIVER','users','view_own');
SELECT grp('RECEIVER','users','edit_own');

-- Cleanup helper
DROP FUNCTION IF EXISTS grp(varchar, varchar, varchar);

COMMIT;

-- ── Verification ──────────────────────────────────────────────────────────
SELECT 'Permissions seeded:' as info, COUNT(*) as count FROM permissions
UNION ALL
SELECT 'Roles seeded:',      COUNT(*) FROM roles
UNION ALL
SELECT 'Role assignments:',  COUNT(*) FROM role_permissions;

SELECT r.name as role, COUNT(rp.permission_id) as permissions
FROM roles r
LEFT JOIN role_permissions rp ON r.id = rp.role_id
GROUP BY r.name
ORDER BY r.name;
