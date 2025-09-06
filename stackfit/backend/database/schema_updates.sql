-- Schema updates for new features

-- 1. Enhanced Member Profile Management
-- Add new fields to members table
ALTER TABLE members ADD COLUMN IF NOT EXISTS age INTEGER;
ALTER TABLE members ADD COLUMN IF NOT EXISTS gender VARCHAR(20);
ALTER TABLE members ADD COLUMN IF NOT EXISTS date_of_birth DATE;
ALTER TABLE members ADD COLUMN IF NOT EXISTS medical_history TEXT;
ALTER TABLE members ADD COLUMN IF NOT EXISTS profile_image_url TEXT;

-- 2. Membership Pausing Functionality
-- Create membership_pauses table
CREATE TABLE IF NOT EXISTS membership_pauses (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    member_id UUID REFERENCES members(id) ON DELETE CASCADE,
    start_date DATE NOT NULL,
    end_date DATE NOT NULL,
    reason TEXT,
    status VARCHAR(20) NOT NULL DEFAULT 'pending', -- pending, approved, rejected, completed
    original_end_date DATE NOT NULL, -- Store the original end date before pausing
    new_end_date DATE, -- Store the new end date after pause is applied
    created_by UUID REFERENCES admins(id),
    approved_by UUID REFERENCES admins(id),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Add paused status to members table
ALTER TABLE members ADD COLUMN IF NOT EXISTS is_paused BOOLEAN DEFAULT FALSE;
ALTER TABLE members ADD COLUMN IF NOT EXISTS current_pause_id UUID REFERENCES membership_pauses(id);

-- 3. Role-based Access Control
-- Add role field to admins table
ALTER TABLE admins ADD COLUMN IF NOT EXISTS role VARCHAR(20) DEFAULT 'admin';

-- Create permissions table
CREATE TABLE IF NOT EXISTS permissions (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    name VARCHAR(100) NOT NULL UNIQUE,
    description TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Create role_permissions table
CREATE TABLE IF NOT EXISTS role_permissions (
    role VARCHAR(20) NOT NULL,
    permission_id UUID REFERENCES permissions(id) ON DELETE CASCADE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    PRIMARY KEY (role, permission_id)
);

-- Create indexes
CREATE INDEX IF NOT EXISTS idx_membership_pauses_member_id ON membership_pauses(member_id);
CREATE INDEX IF NOT EXISTS idx_membership_pauses_status ON membership_pauses(status);
CREATE INDEX IF NOT EXISTS idx_members_is_paused ON members(is_paused);
CREATE INDEX IF NOT EXISTS idx_admins_role ON admins(role);

-- Create trigger for membership_pauses
CREATE TRIGGER update_membership_pauses_updated_at
    BEFORE UPDATE ON membership_pauses
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- Insert default permissions
INSERT INTO permissions (name, description) VALUES
('view_dashboard', 'Can view the dashboard'),
('manage_members', 'Can create, update, and delete members'),
('view_members', 'Can view member details'),
('manage_memberships', 'Can create, update, and delete membership plans'),
('view_memberships', 'Can view membership plans'),
('manage_payments', 'Can process and manage payments'),
('view_payments', 'Can view payment details'),
('manage_attendance', 'Can mark and manage attendance'),
('view_attendance', 'Can view attendance records'),
('approve_pauses', 'Can approve membership pause requests'),
('view_reports', 'Can view reports and analytics')
ON CONFLICT (name) DO NOTHING;

-- Insert default role permissions for admin
INSERT INTO role_permissions (role, permission_id)
SELECT 'admin', id FROM permissions
ON CONFLICT (role, permission_id) DO NOTHING;

-- Insert default role permissions for staff
INSERT INTO role_permissions (role, permission_id)
SELECT 'staff', id FROM permissions 
WHERE name IN ('view_dashboard', 'view_members', 'view_memberships', 'view_attendance', 'manage_attendance')
ON CONFLICT (role, permission_id) DO NOTHING; 

-- Events table for tracking gym events and activities
CREATE TABLE events (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    title VARCHAR(255) NOT NULL,
    description TEXT,
    department VARCHAR(100),
    date TIMESTAMP WITH TIME ZONE NOT NULL,
    created_by UUID REFERENCES admins(id),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_by UUID REFERENCES admins(id)
);

-- Create indexes for events
CREATE INDEX idx_events_date ON events(date);
CREATE INDEX idx_events_department ON events(department);

-- Create trigger for events updated_at
CREATE TRIGGER update_events_updated_at
    BEFORE UPDATE ON events
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column(); 

-- Insert sample events
INSERT INTO events (title, description, department, date) VALUES
('New Member Orientation', 'Introduction session for new gym members', 'Membership', CURRENT_DATE + INTERVAL '2 days'),
('Monthly Billing Cycle', 'Process monthly membership payments', 'Finance', CURRENT_DATE + INTERVAL '5 days'),
('Fitness Challenge Launch', 'Launch of the monthly fitness challenge', 'Programs', CURRENT_DATE + INTERVAL '7 days'),
('Staff Training', 'Quarterly staff training session', 'Administration', CURRENT_DATE + INTERVAL '10 days'),
('Equipment Maintenance', 'Regular maintenance of gym equipment', 'Maintenance', CURRENT_DATE + INTERVAL '3 days'); 