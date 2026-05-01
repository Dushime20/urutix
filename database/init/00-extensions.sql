-- PostgreSQL Extensions for UrutiX
-- This script is automatically run when the database is first created

-- Enable PostGIS for geographic/geometry data types
CREATE EXTENSION IF NOT EXISTS postgis;

-- Enable UUID generation functions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Verify extensions are installed
SELECT extname, extversion FROM pg_extension WHERE extname IN ('postgis', 'uuid-ossp');
