-- Add owner_id column to fuel_wallets table
ALTER TABLE fuel_wallets 
ADD COLUMN IF NOT EXISTS owner_id UUID;

-- Add index for owner_id lookups
CREATE INDEX IF NOT EXISTS idx_fuel_wallets_tenant_owner 
ON fuel_wallets(tenant_id, owner_id);

-- Add foreign key constraint to users table
ALTER TABLE fuel_wallets 
ADD CONSTRAINT fk_fuel_wallets_owner 
FOREIGN KEY (owner_id) REFERENCES users(id) ON DELETE SET NULL;

-- Add comment
COMMENT ON COLUMN fuel_wallets.owner_id IS 'ID of the truck owner (user) who owns this wallet';
