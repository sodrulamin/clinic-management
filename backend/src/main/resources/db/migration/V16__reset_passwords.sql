-- Migration V16: Reset default passwords of seeded users to ensure they match default credentials
UPDATE users SET password = '$2a$10$8.UnVuG9HHg7ke3CDbC8ee2Wny5/yC1b.1qD3zYw5Gz4bK1Kz4bK1' WHERE username = 'admin';
UPDATE users SET password = '$2a$10$E2b70f.qO9f/15.g953xvuJ8v9H39420t/96h10901e18g.0441g6' WHERE username = 'doctor';
UPDATE users SET password = '$2a$10$J3v957.rP0g/26.h064ywvK9w0I40531u/07i21012f29h.1552h7' WHERE username = 'receptionist';
