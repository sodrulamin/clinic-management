ALTER TABLE appointment_requests ADD COLUMN patient_id BIGINT DEFAULT NULL;
ALTER TABLE appointment_requests ADD CONSTRAINT fk_app_requests_patient FOREIGN KEY (patient_id) REFERENCES patients(id) ON DELETE SET NULL;
