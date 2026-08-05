-- Migration V13: Add user_id column and foreign key to doctors table mapping to users table
ALTER TABLE doctors
ADD COLUMN user_id BIGINT NULL;

ALTER TABLE doctors
ADD CONSTRAINT fk_doctors_user
FOREIGN KEY (user_id) REFERENCES users(id)
ON DELETE SET NULL;

-- Backfill existing doctors by matching email, phone, or doctor full_name with users table
UPDATE doctors d
JOIN users u ON (
    (d.email IS NOT NULL AND LOWER(d.email) = LOWER(u.email)) OR
    (d.phone IS NOT NULL AND d.phone = u.phone) OR
    (d.full_name IS NOT NULL AND LOWER(d.full_name) = LOWER(u.full_name))
)
SET d.user_id = u.id
WHERE d.user_id IS NULL;
