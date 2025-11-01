-- Enable RLS on all tables that are missing it
-- These tables were found to have RLS policies but RLS was not enabled

-- Check and enable RLS for all public tables
DO $$ 
BEGIN
    -- Enable RLS for any table in public schema that doesn't have it enabled
    EXECUTE (
        SELECT string_agg('ALTER TABLE ' || schemaname || '.' || tablename || ' ENABLE ROW LEVEL SECURITY;', E'\n')
        FROM pg_tables
        WHERE schemaname = 'public'
        AND NOT EXISTS (
            SELECT 1 FROM pg_class c
            JOIN pg_namespace n ON n.oid = c.relnamespace
            WHERE c.relname = pg_tables.tablename
            AND n.nspname = pg_tables.schemaname
            AND c.relrowsecurity = true
        )
    );
END $$;