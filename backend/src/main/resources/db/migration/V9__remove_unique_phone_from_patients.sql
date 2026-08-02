SET @exist := (SELECT COUNT(*) FROM information_schema.statistics WHERE table_schema = DATABASE() AND table_name = 'patients' AND non_unique = 0 AND column_name = 'phone');
SET @sqlstmt := IF(@exist > 0, (SELECT CONCAT('ALTER TABLE patients DROP INDEX ', index_name) FROM information_schema.statistics WHERE table_schema = DATABASE() AND table_name = 'patients' AND non_unique = 0 AND column_name = 'phone' LIMIT 1), 'SELECT 1');
PREPARE stmt FROM @sqlstmt;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;
