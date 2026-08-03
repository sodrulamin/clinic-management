CREATE TABLE IF NOT EXISTS prescription_medicines (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    prescription_id BIGINT NOT NULL,
    type VARCHAR(50),
    name VARCHAR(255) NOT NULL,
    instruction VARCHAR(255),
    doses VARCHAR(100),
    duration VARCHAR(100),
    sort_order INT NOT NULL DEFAULT 0,
    CONSTRAINT fk_prescription_medicines_prescription FOREIGN KEY (prescription_id) REFERENCES prescriptions(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
