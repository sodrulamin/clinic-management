-- Migration V14: Seed initial roles, menus, role_menus, users, doctors, patients, appointments, and appointment_requests

-- 1. Seed Roles
INSERT IGNORE INTO roles (id, name, description) VALUES
(1, 'ROLE_ADMIN', 'Administrator with full access'),
(2, 'ROLE_DOCTOR', 'Medical Doctor'),
(3, 'ROLE_RECEPTIONIST', 'Front Desk Receptionist'),
(4, 'ROLE_PATIENT', 'Registered Patient');

-- 2. Seed Menus
INSERT IGNORE INTO menus (id, title, path, icon, sort_order) VALUES
(1, 'Dashboard', '/dashboard', 'LayoutDashboard', 1),
(2, 'User Management', '/users', 'Users', 2),
(3, 'Role & Menu Config', '/role-menus', 'ShieldCheck', 3),
(4, 'Patients Database', '/patients', 'UserPlus', 4),
(5, 'Doctor Information', '/doctors', 'Stethoscope', 5),
(6, 'Appointments', '/appointments', 'Calendar', 6),
(7, 'Appointment Requests', '/appointment-requests', 'ClipboardList', 7),
(8, 'Diagnoses Config', '/diagnoses', 'Activity', 8);

-- 3. Seed Role-Menu mappings
INSERT IGNORE INTO role_menus (role_id, menu_id) VALUES
(1, 1), (1, 2), (1, 3), (1, 4), (1, 5), (1, 6), (1, 7), (1, 8),
(2, 1), (2, 4), (2, 5), (2, 6), (2, 7), (2, 8),
(3, 1), (3, 4), (3, 5), (3, 6), (3, 7),
(4, 1), (4, 5), (4, 6), (4, 7);

-- 4. Seed Default Users
INSERT IGNORE INTO users (id, username, password, full_name, email, phone, role_id, active, created_at) VALUES
(1, 'admin', '$2a$10$8.UnVuG9HHg7ke3CDbC8ee2Wny5/yC1b.1qD3zYw5Gz4bK1Kz4bK1', 'Super Admin', 'admin@clinic.com', '+1 555-0100', 1, 1, NOW()),
(2, 'doctor', '$2a$10$E2b70f.qO9f/15.g953xvuJ8v9H39420t/96h10901e18g.0441g6', 'Dr. Sarah Jenkins', 'dr.jenkins@clinic.com', '+1 555-0200', 2, 1, NOW()),
(3, 'receptionist', '$2a$10$J3v957.rP0g/26.h064ywvK9w0I40531u/07i21012f29h.1552h7', 'Emma Watson', 'reception@clinic.com', '+1 555-0300', 3, 1, NOW());

-- 5. Seed Sample Doctors
INSERT IGNORE INTO doctors (id, full_name, specialization, qualification, email, phone, room_no, consultation_fee, max_discount_percent, max_discount_fixed, working_hours, profile_image, appointment_duration_minutes, active, user_id) VALUES
(1, 'Dr. Sarah Jenkins', 'Cardiology', 'MD, FACC', 'dr.jenkins@clinic.com', '+1 555-0200', 'Suite 301', 150.0, 0.0, 0.0, 'Mon-Fri 09:00 - 16:00', NULL, 20, 1, 2),
(2, 'Dr. Robert Chen', 'Neurology', 'MBBS, MD (Neurology)', 'chen@clinic.com', '+1 555-0201', 'Suite 405', 180.0, 0.0, 0.0, 'Mon-Thu 10:00 - 17:00', NULL, 30, 1, NULL),
(3, 'Dr. Emily Taylor', 'Pediatrics', 'MD (Pediatrics)', 'taylor@clinic.com', '+1 555-0202', 'Suite 102', 120.0, 0.0, 0.0, 'Tue-Sat 08:30 - 15:30', NULL, 15, 1, NULL);

-- 6. Seed Sample Patients
INSERT IGNORE INTO patients (id, full_name, age, gender, phone, email, address, blood_group, medical_history, created_at, last_served_date) VALUES
(1, 'John Doe', 38, 'Male', '+1 555-9001', 'john.doe@gmail.com', '123 Elm Street, Cityville', 'O+', 'Hypertension, Seasonal allergies', NOW(), NULL),
(2, 'Alice Smith', 29, 'Female', '+1 555-9002', 'alice.smith@gmail.com', '456 Oak Avenue, Metropolis', 'A+', 'No chronic condition', NOW(), NULL);

-- 7. Seed Sample Appointments
INSERT IGNORE INTO appointments (id, doctor_id, patient_id, appointment_date, time_slot, status, reason, created_at, discount) VALUES
(1, 1, 1, CURDATE(), '10:00 AM - 10:30 AM', 'SCHEDULED', 'Regular cardiac checkup', NOW(), 0.0),
(2, 2, 2, DATE_ADD(CURDATE(), INTERVAL 1 DAY), '02:00 PM - 02:30 PM', 'SCHEDULED', 'Migraine consultation', NOW(), 0.0);

-- 8. Seed Sample Appointment Requests
INSERT IGNORE INTO appointment_requests (id, patient_name, patient_phone, patient_email, doctor_id, preferred_date, preferred_time, reason, status, created_at) VALUES
(1, 'Michael Brown', '+1 555-9003', 'michael.b@gmail.com', 3, DATE_ADD(CURDATE(), INTERVAL 2 DAY), '11:00 AM', 'Child routine vaccination checkup', 'PENDING', NOW());
