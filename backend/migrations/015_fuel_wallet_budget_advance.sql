-- Create fuel_wallets table
CREATE TABLE IF NOT EXISTS fuel_wallets (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id UUID NOT NULL,
    driver_id UUID,
    truck_id UUID,
    balance DECIMAL(15, 2) DEFAULT 0,
    total_credits DECIMAL(15, 2) DEFAULT 0,
    total_debits DECIMAL(15, 2) DEFAULT 0,
    status VARCHAR(50) DEFAULT 'ACTIVE',
    notes TEXT,
    metadata JSONB DEFAULT '{}',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    last_transaction_at TIMESTAMP WITH TIME ZONE,
    FOREIGN KEY (driver_id) REFERENCES drivers(id) ON DELETE SET NULL,
    FOREIGN KEY (truck_id) REFERENCES trucks(id) ON DELETE SET NULL
);

CREATE INDEX idx_fuel_wallets_tenant_driver ON fuel_wallets(tenant_id, driver_id);
CREATE INDEX idx_fuel_wallets_tenant_truck ON fuel_wallets(tenant_id, truck_id);
CREATE INDEX idx_fuel_wallets_tenant_status ON fuel_wallets(tenant_id, status);

-- Create fuel_wallet_transactions table
CREATE TABLE IF NOT EXISTS fuel_wallet_transactions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id UUID NOT NULL,
    wallet_id UUID NOT NULL,
    type VARCHAR(50) NOT NULL,
    amount DECIMAL(15, 2) NOT NULL,
    fuel_log_id UUID,
    description VARCHAR(255) NOT NULL,
    reference_id VARCHAR(100),
    metadata JSONB DEFAULT '{}',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (wallet_id) REFERENCES fuel_wallets(id) ON DELETE CASCADE,
    FOREIGN KEY (fuel_log_id) REFERENCES fuel_logs(id) ON DELETE SET NULL
);

CREATE INDEX idx_fuel_wallet_transactions_tenant_wallet ON fuel_wallet_transactions(tenant_id, wallet_id);
CREATE INDEX idx_fuel_wallet_transactions_tenant_type ON fuel_wallet_transactions(tenant_id, type);
CREATE INDEX idx_fuel_wallet_transactions_tenant_date ON fuel_wallet_transactions(tenant_id, created_at);

-- Create fuel_budgets table
CREATE TABLE IF NOT EXISTS fuel_budgets (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id UUID NOT NULL,
    trip_id UUID NOT NULL,
    truck_id UUID NOT NULL,
    budgeted_amount DECIMAL(15, 2) NOT NULL,
    actual_amount DECIMAL(15, 2) DEFAULT 0,
    variance DECIMAL(15, 2) DEFAULT 0,
    status VARCHAR(50) DEFAULT 'PLANNED',
    variance_percentage DECIMAL(5, 2) DEFAULT 0,
    alert_threshold DECIMAL(5, 2) DEFAULT 10,
    alert_triggered BOOLEAN DEFAULT FALSE,
    notes TEXT,
    metadata JSONB DEFAULT '{}',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (trip_id) REFERENCES trips(id) ON DELETE CASCADE,
    FOREIGN KEY (truck_id) REFERENCES trucks(id)
);

CREATE INDEX idx_fuel_budgets_tenant_trip ON fuel_budgets(tenant_id, trip_id);
CREATE INDEX idx_fuel_budgets_tenant_truck ON fuel_budgets(tenant_id, truck_id);
CREATE INDEX idx_fuel_budgets_tenant_status ON fuel_budgets(tenant_id, status);

-- Create driver_fuel_advances table
CREATE TABLE IF NOT EXISTS driver_fuel_advances (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id UUID NOT NULL,
    driver_id UUID NOT NULL,
    trip_id UUID,
    advance_amount DECIMAL(15, 2) NOT NULL,
    advance_date TIMESTAMP WITH TIME ZONE NOT NULL,
    status VARCHAR(50) DEFAULT 'PENDING',
    approved_by UUID,
    approved_at TIMESTAMP WITH TIME ZONE,
    reconciliation_date TIMESTAMP WITH TIME ZONE,
    reconciliation_amount DECIMAL(15, 2),
    reconciliation_notes TEXT,
    rejection_reason TEXT,
    notes TEXT,
    metadata JSONB DEFAULT '{}',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (driver_id) REFERENCES drivers(id),
    FOREIGN KEY (trip_id) REFERENCES trips(id) ON DELETE SET NULL,
    FOREIGN KEY (approved_by) REFERENCES users(id) ON DELETE SET NULL
);

CREATE INDEX idx_driver_fuel_advances_tenant_driver ON driver_fuel_advances(tenant_id, driver_id);
CREATE INDEX idx_driver_fuel_advances_tenant_trip ON driver_fuel_advances(tenant_id, trip_id);
CREATE INDEX idx_driver_fuel_advances_tenant_status ON driver_fuel_advances(tenant_id, status);
