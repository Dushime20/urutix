-- Add createdAt column to trucks table if it doesn't exist
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 
        FROM information_schema.columns 
        WHERE table_name = 'trucks' 
        AND column_name = 'createdAt'
    ) THEN
        ALTER TABLE "trucks" 
        ADD COLUMN "createdAt" TIMESTAMP NOT NULL DEFAULT now();
        
        RAISE NOTICE 'Added createdAt column to trucks table';
    ELSE
        RAISE NOTICE 'createdAt column already exists in trucks table';
    END IF;
END $$;

