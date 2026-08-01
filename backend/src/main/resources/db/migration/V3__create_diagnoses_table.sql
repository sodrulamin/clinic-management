-- V3 Migration: Create Diagnoses Table and Seed Default Diagnoses

CREATE TABLE IF NOT EXISTS diagnoses (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    code VARCHAR(50),
    category VARCHAR(100),
    description TEXT,
    active TINYINT(1) DEFAULT 1 NOT NULL,
    created_at DATETIME,
    updated_at DATETIME
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

INSERT INTO diagnoses (name, code, category, description, active, created_at, updated_at) VALUES
('Acute Pharyngitis', 'J02.9', 'ENT / General', 'Acute inflammation of the pharynx and throat', 1, NOW(), NOW()),
('Essential Hypertension', 'I10', 'Cardiology', 'High blood pressure without identifiable secondary cause', 1, NOW(), NOW()),
('Type 2 Diabetes Mellitus', 'E11', 'Endocrinology', 'Chronic metabolic disorder characterized by high blood sugar', 1, NOW(), NOW()),
('Acute Bronchitis', 'J20.9', 'Pulmonology', 'Short-term inflammation of the bronchi in the lungs', 1, NOW(), NOW()),
('Migraine Headache', 'G43.9', 'Neurology', 'Recurrent moderate to severe headaches', 1, NOW(), NOW()),
('Acute Gastritis', 'K29.7', 'Gastroenterology', 'Sudden inflammation of the lining of the stomach', 1, NOW(), NOW()),
('Viral Fever', 'B34.9', 'General Medicine', 'Fever caused by underlying viral infection', 1, NOW(), NOW());
