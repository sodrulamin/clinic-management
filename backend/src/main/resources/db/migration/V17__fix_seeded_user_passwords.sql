-- Migration V17: Fix seeded user passwords to use verified working BCrypt hashes
UPDATE users SET password = '$2a$10$3shG2OW7JkMRlcmWMOjYKeimIIpuYhvy9Pz6XnN0RmG4Fri/y5frS' WHERE username = 'admin';
UPDATE users SET password = '$2a$10$kZt9oGKWNCKj8by/vVQ8OejNPlxKz65EcqdRyGIhNjdt36Xa0yMW.' WHERE username = 'doctor';
UPDATE users SET password = '$2a$10$exNMUuZryVXcmGXNOgZDYu2wFmV2hXuVMJQqq3KwDynNDiF6cPrRm' WHERE username = 'receptionist';
