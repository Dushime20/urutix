-- Migration: Email Templates System
-- Description: Creates email_templates table for storing reusable email templates
-- Date: 2026-02-14

-- Create email_templates table
CREATE TABLE IF NOT EXISTS email_templates (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name VARCHAR(255) NOT NULL UNIQUE,
  subject VARCHAR(500) NOT NULL,
  category VARCHAR(100),
  description TEXT,
  html_body TEXT NOT NULL,
  text_body TEXT,
  template_variables JSONB DEFAULT '[]'::jsonb,
  is_active BOOLEAN DEFAULT true,
  created_by UUID REFERENCES users(id) ON DELETE SET NULL,
  updated_by UUID REFERENCES users(id) ON DELETE SET NULL,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- Create index on category for faster filtering
CREATE INDEX IF NOT EXISTS idx_email_templates_category ON email_templates(category);

-- Create index on is_active for faster filtering
CREATE INDEX IF NOT EXISTS idx_email_templates_active ON email_templates(is_active);

-- Create index on name for faster lookups
CREATE INDEX IF NOT EXISTS idx_email_templates_name ON email_templates(name);

-- Add trigger to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_email_templates_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER email_templates_updated_at
  BEFORE UPDATE ON email_templates
  FOR EACH ROW
  EXECUTE FUNCTION update_email_templates_updated_at();

-- Add comment to table
COMMENT ON TABLE email_templates IS 'Stores reusable email templates for the bulk email system';
COMMENT ON COLUMN email_templates.template_variables IS 'JSON array of variable names used in the template (e.g., ["tenantName", "email"])';
