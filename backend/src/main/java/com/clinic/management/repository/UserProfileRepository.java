package com.clinic.management.repository;

import com.clinic.management.entity.UserProfile;
import org.springframework.data.jpa.repository.JpaRepository;
import java.util.Optional;

public interface UserProfileRepository extends JpaRepository<UserProfile, Long> {
    Optional<UserProfile> findByEmailIgnoreCase(String email);
    Optional<UserProfile> findByPhone(String phone);
    Boolean existsByEmail(String email);
}
