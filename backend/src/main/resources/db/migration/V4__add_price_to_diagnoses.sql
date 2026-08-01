-- V4 Migration: Add price column to diagnoses table

ALTER TABLE diagnoses ADD COLUMN price DOUBLE DEFAULT 0.0 AFTER description;

UPDATE diagnoses SET price = 500.0 WHERE code = 'J02.9';
UPDATE diagnoses SET price = 800.0 WHERE code = 'I10';
UPDATE diagnoses SET price = 1200.0 WHERE code = 'E11';
UPDATE diagnoses SET price = 650.0 WHERE code = 'J20.9';
UPDATE diagnoses SET price = 1000.0 WHERE code = 'G43.9';
UPDATE diagnoses SET price = 750.0 WHERE code = 'K29.7';
UPDATE diagnoses SET price = 400.0 WHERE code = 'B34.9';
