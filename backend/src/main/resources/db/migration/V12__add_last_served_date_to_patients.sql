-- Add last_served_date column to patients table
ALTER TABLE patients ADD COLUMN last_served_date DATE NULL;

-- Backfill last_served_date for existing patients based on their latest VISITED or COMPLETED appointment
UPDATE patients p
SET p.last_served_date = (
    SELECT MAX(a.appointment_date)
    FROM appointments a
    WHERE a.patient_id = p.id AND a.status IN ('VISITED', 'COMPLETED')
);
