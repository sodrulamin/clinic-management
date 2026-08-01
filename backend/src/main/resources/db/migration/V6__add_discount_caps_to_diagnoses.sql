-- V6 Migration: Add max discount configuration to diagnoses table

ALTER TABLE diagnoses ADD COLUMN max_discount_percent DOUBLE DEFAULT NULL AFTER price;
ALTER TABLE diagnoses ADD COLUMN max_discount_fixed DOUBLE DEFAULT NULL AFTER max_discount_percent;
