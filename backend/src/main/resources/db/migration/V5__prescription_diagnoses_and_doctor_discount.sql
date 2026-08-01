-- V5 Migration: Add doctor max discount caps + create prescription_diagnoses table

-- Add max discount configuration to doctors
ALTER TABLE doctors ADD COLUMN max_discount_percent DOUBLE DEFAULT 0.0 AFTER consultation_fee;
ALTER TABLE doctors ADD COLUMN max_discount_fixed DOUBLE DEFAULT 0.0 AFTER max_discount_percent;

-- Create prescription_diagnoses table for per-diagnosis prescriptions
CREATE TABLE IF NOT EXISTS prescription_diagnoses (
    id                  BIGINT AUTO_INCREMENT PRIMARY KEY,
    prescription_id     BIGINT NOT NULL,
    diagnosis_id        BIGINT,                                              -- null for free-text/custom entry
    custom_name         VARCHAR(255),                                        -- used when diagnosis_id is null
    diagnosis_price     DOUBLE NOT NULL DEFAULT 0.0,                        -- price snapshot at prescription time
    discount_type       ENUM('NONE', 'PERCENT', 'FIXED') NOT NULL DEFAULT 'NONE',
    discount_value      DOUBLE NOT NULL DEFAULT 0.0,                        -- percent (0-100) or fixed taka amount
    net_price           DOUBLE NOT NULL DEFAULT 0.0,                        -- computed net after discount
    sort_order          INT NOT NULL DEFAULT 0,
    CONSTRAINT fk_pd_prescription FOREIGN KEY (prescription_id) REFERENCES prescriptions(id) ON DELETE CASCADE,
    CONSTRAINT fk_pd_diagnosis    FOREIGN KEY (diagnosis_id)    REFERENCES diagnoses(id)    ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
