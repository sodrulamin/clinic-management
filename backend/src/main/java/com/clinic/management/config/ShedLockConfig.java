package com.clinic.management.config;

import net.javacrumbs.shedlock.core.LockProvider;
import net.javacrumbs.shedlock.provider.jdbctemplate.JdbcTemplateLockProvider;
import net.javacrumbs.shedlock.spring.annotation.EnableSchedulerLock;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.scheduling.annotation.EnableScheduling;

import javax.sql.DataSource;

@Configuration
@EnableScheduling
@EnableSchedulerLock(defaultLockAtMostFor = "10m")
public class ShedLockConfig {

    @Bean
    public LockProvider lockProvider(DataSource dataSource, JdbcTemplate jdbcTemplate) {
        // Automatically ensure the shedlock database table exists for distributed locking
        jdbcTemplate.execute("CREATE TABLE IF NOT EXISTS shedlock (" +
                "name VARCHAR(64) NOT NULL, " +
                "lock_until TIMESTAMP(3) NOT NULL, " +
                "locked_at TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3), " +
                "locked_by VARCHAR(255) NOT NULL, " +
                "PRIMARY KEY (name)" +
                ")");

        return new JdbcTemplateLockProvider(
                JdbcTemplateLockProvider.Configuration.builder()
                        .withJdbcTemplate(jdbcTemplate)
                        .usingDbTime()
                        .build()
        );
    }
}
