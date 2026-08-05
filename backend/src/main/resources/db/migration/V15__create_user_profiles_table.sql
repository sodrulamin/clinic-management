-- Migration V15: Create user_profiles table and normalize common profile fields across users, doctors, and patients

-- 1. Create user_profiles table
CREATE TABLE IF NOT EXISTS user_profiles (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    full_name VARCHAR(255) NOT NULL,
    email VARCHAR(255) NULL,
    phone VARCHAR(50) NULL,
    gender VARCHAR(20) NULL,
    age INT NULL,
    address VARCHAR(255) NULL,
    profile_image LONGTEXT NULL,
    created_at DATETIME NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- 2. Add profile_id column to users, doctors, and patients tables
ALTER TABLE users ADD COLUMN profile_id BIGINT NULL;
ALTER TABLE doctors ADD COLUMN profile_id BIGINT NULL;
ALTER TABLE patients ADD COLUMN profile_id BIGINT NULL;

-- 3. Populate user_profiles from users table and link users.profile_id
INSERT INTO user_profiles (full_name, email, phone, created_at)
SELECT full_name, email, phone, COALESCE(created_at, NOW()) FROM users;

UPDATE users u
JOIN user_profiles up ON (
    (u.email IS NOT NULL AND LOWER(u.email) = LOWER(up.email)) OR
    (LOWER(u.full_name) = LOWER(up.full_name))
)
SET u.profile_id = up.id
WHERE u.profile_id IS NULL;

-- 4. Link doctors to existing user_profiles or create new user_profiles for doctors
UPDATE doctors d
JOIN user_profiles up ON (
    (d.email IS NOT NULL AND LOWER(d.email) = LOWER(up.email)) OR
    (d.phone IS NOT NULL AND d.phone = up.phone) OR
    (d.full_name IS NOT NULL AND LOWER(d.full_name) = LOWER(up.full_name))
)
SET d.profile_id = up.id
WHERE d.profile_id IS NULL;

INSERT INTO user_profiles (full_name, email, phone, profile_image, created_at)
SELECT full_name, email, phone, profile_image, NOW()
FROM doctors
WHERE profile_id IS NULL;

UPDATE doctors d
JOIN user_profiles up ON (
    (d.email IS NOT NULL AND LOWER(d.email) = LOWER(up.email)) OR
    (d.phone IS NOT NULL AND d.phone = up.phone) OR
    (d.full_name IS NOT NULL AND LOWER(d.full_name) = LOWER(up.full_name))
)
SET d.profile_id = up.id
WHERE d.profile_id IS NULL;

-- 5. Link patients to existing user_profiles or create new user_profiles for patients
UPDATE patients p
JOIN user_profiles up ON (
    (p.email IS NOT NULL AND LOWER(p.email) = LOWER(up.email)) OR
    (p.phone IS NOT NULL AND p.phone = up.phone) OR
    (p.full_name IS NOT NULL AND LOWER(p.full_name) = LOWER(up.full_name))
)
SET p.profile_id = up.id
WHERE p.profile_id IS NULL;

INSERT INTO user_profiles (full_name, email, phone, gender, age, address, created_at)
SELECT full_name, email, phone, gender, age, address, COALESCE(created_at, NOW())
FROM patients
WHERE profile_id IS NULL;

UPDATE patients p
JOIN user_profiles up ON (
    (p.email IS NOT NULL AND LOWER(p.email) = LOWER(up.email)) OR
    (p.phone IS NOT NULL AND p.phone = up.phone) OR
    (p.full_name IS NOT NULL AND LOWER(p.full_name) = LOWER(up.full_name))
)
SET p.profile_id = up.id
WHERE p.profile_id IS NULL;

-- 6. Add Foreign Key constraints on profile_id
ALTER TABLE users ADD CONSTRAINT fk_users_profile FOREIGN KEY (profile_id) REFERENCES user_profiles(id) ON DELETE SET NULL;
ALTER TABLE doctors ADD CONSTRAINT fk_doctors_profile FOREIGN KEY (profile_id) REFERENCES user_profiles(id) ON DELETE SET NULL;
ALTER TABLE patients ADD CONSTRAINT fk_patients_profile FOREIGN KEY (profile_id) REFERENCES user_profiles(id) ON DELETE SET NULL;

-- 7. Drop legacy columns from users, doctors, and patients
-- Drop user_id foreign key constraint and user_id column from doctors
ALTER TABLE doctors DROP FOREIGN KEY fk_doctors_user;
ALTER TABLE doctors DROP COLUMN user_id;

-- Drop redundant profile columns from users
ALTER TABLE users DROP COLUMN full_name;
ALTER TABLE users DROP COLUMN email;
ALTER TABLE users DROP COLUMN phone;
ALTER TABLE users DROP COLUMN created_at;

-- Drop redundant profile columns from doctors
ALTER TABLE doctors DROP COLUMN full_name;
ALTER TABLE doctors DROP COLUMN email;
ALTER TABLE doctors DROP COLUMN phone;
ALTER TABLE doctors DROP COLUMN profile_image;

-- Drop redundant profile columns from patients
ALTER TABLE patients DROP COLUMN full_name;
ALTER TABLE patients DROP COLUMN email;
ALTER TABLE patients DROP COLUMN phone;
ALTER TABLE patients DROP COLUMN age;
ALTER TABLE patients DROP COLUMN gender;
ALTER TABLE patients DROP COLUMN address;
ALTER TABLE patients DROP COLUMN created_at;
