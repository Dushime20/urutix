-- Add BROKER role permissions
-- Based on BROKER_AGENT_PERMISSIONS.md

-- First, let's add any missing permissions that BROKER needs
INSERT INTO permissions (name, resource, action, description) VALUES
  -- Broker-specific permissions
  ('load:assign', 'load', 'assign', 'Assign loads to transporters'),
  ('bid:accept', 'bid', 'accept', 'Accept bids'),
  ('bid:reject', 'bid', 'reject', 'Reject bids'),
  ('commission:view_own', 'commission', 'view_own', 'View own commissions'),
  ('commission:calculate', 'commission', 'calculate', 'Calculate commissions'),
  ('commission:request_payout', 'commission', 'request_payout', 'Request commission payouts'),
  ('escrow:create', 'escrow', 'create', 'Create escrow accounts'),
  ('escrow:manage', 'escrow', 'manage', 'Manage escrow funds'),
  ('escrow:release', 'escrow', 'release', 'Release escrow funds'),
  ('contract:create', 'contract', 'create', 'Create contracts'),
  ('contract:view', 'contract', 'view', 'View contracts'),
  ('contract:sign', 'contract', 'sign', 'Sign contracts'),
  ('contract:manage', 'contract', 'manage', 'Manage contract lifecycle'),
  ('insurance:verify', 'insurance', 'verify', 'Verify insurance'),
  ('insurance:check_compliance', 'insurance', 'check_compliance', 'Check compliance'),
  ('insurance:view', 'insurance', 'view', 'View insurance details'),
  ('dispute:create', 'dispute', 'create', 'Create disputes'),
  ('dispute:view', 'dispute', 'view', 'View disputes'),
  ('dispute:mediate', 'dispute', 'mediate', 'Mediate disputes'),
  ('dispute:resolve', 'dispute', 'resolve', 'Resolve disputes'),
  ('document:upload', 'document', 'upload', 'Upload documents'),
  ('document:view', 'document', 'view', 'View documents'),
  ('document:verify', 'document', 'verify', 'Verify documents'),
  ('document:manage', 'document', 'manage', 'Manage documents'),
  ('market:view_rates', 'market', 'view_rates', 'View market rates'),
  ('market:view_trends', 'market', 'view_trends', 'View market trends'),
  ('market:analyze', 'market', 'analyze', 'Analyze market data'),
  ('intelligence:access', 'intelligence', 'access', 'Access market intelligence'),
  ('credit:view', 'credit', 'view', 'View credit information'),
  ('credit:assess', 'credit', 'assess', 'Assess creditworthiness'),
  ('credit:manage', 'credit', 'manage', 'Manage credit limits'),
  ('multistop:create', 'multistop', 'create', 'Create multi-stop loads'),
  ('multistop:manage', 'multistop', 'manage', 'Manage multi-stop routes'),
  ('multistop:optimize', 'multistop', 'optimize', 'Optimize routes'),
  ('performance:view_own', 'performance', 'view_own', 'View own performance'),
  ('performance:track', 'performance', 'track', 'Track performance metrics'),
  ('analytics:view_broker', 'analytics', 'view_broker', 'View broker analytics'),
  ('report:generate', 'report', 'generate', 'Generate reports'),
  ('notification:send', 'notification', 'send', 'Send notifications'),
  ('notification:view', 'notification', 'view', 'View notifications'),
  ('message:send', 'message', 'send', 'Send messages'),
  ('message:view', 'message', 'view', 'View messages'),
  ('bid:create', 'bid', 'create', 'Create bids'),
  ('bid:view_all', 'bid', 'view_all', 'View all bids'),
  ('match:ai_powered', 'match', 'ai_powered', 'Use AI matching'),
  ('match:recommend', 'match', 'recommend', 'Recommend matches')
ON CONFLICT (name) DO NOTHING;

-- Now assign permissions to BROKER role
-- Using existing permissions that match BROKER needs
INSERT INTO role_permissions (role, permission_id)
SELECT 'BROKER', id FROM permissions WHERE name IN (
  -- Cargo/Load Management
  'cargo:view_all',
  'cargo:create',
  'cargo:update_own',
  'cargo:update_all',
  'load:assign',
  
  -- Truck viewing
  'truck:view_all',
  'truck:view_own',
  
  -- Trip management
  'trip:view_all',
  'trip:create',
  'trip:update_status',
  
  -- Bidding
  'bid:view_all',
  'bid:create',
  'bid:accept',
  'bid:reject',
  'match:ai_powered',
  'match:recommend',
  
  -- Commission
  'commission:view_own',
  'commission:calculate',
  'commission:request_payout',
  
  -- Payment
  'payment:view_all',
  'payment:view_own',
  'payment:create',
  
  -- Escrow
  'escrow:create',
  'escrow:manage',
  'escrow:release',
  
  -- Contracts
  'contract:create',
  'contract:view',
  'contract:sign',
  'contract:manage',
  
  -- Insurance
  'insurance:verify',
  'insurance:check_compliance',
  'insurance:view',
  
  -- Disputes
  'dispute:create',
  'dispute:view',
  'dispute:mediate',
  'dispute:resolve',
  
  -- Documents
  'document:upload',
  'document:view',
  'document:verify',
  'document:manage',
  
  -- Market Intelligence
  'market:view_rates',
  'market:view_trends',
  'market:analyze',
  'intelligence:access',
  
  -- Credit
  'credit:view',
  'credit:assess',
  'credit:manage',
  
  -- Multi-stop
  'multistop:create',
  'multistop:manage',
  'multistop:optimize',
  
  -- Performance & Analytics
  'performance:view_own',
  'performance:track',
  'analytics:view_broker',
  'analytics:view_tenant',
  'analytics:view_own',
  'report:generate',
  
  -- Communication
  'notification:send',
  'notification:view',
  'message:send',
  'message:view',
  
  -- User
  'user:view_own',
  'user:view_tenant',
  
  -- Driver viewing
  'driver:view_all',
  'driver:view_own'
)
ON CONFLICT (role, permission_id) DO NOTHING;
