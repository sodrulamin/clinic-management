package com.clinic.management.repository;

import com.clinic.management.entity.User;
import org.springframework.data.jpa.repository.JpaRepository;
import java.util.Optional;

public interface UserRepository extends JpaRepository<User, Long> {
    Optional<User> findByUsername(String username);
    Optional<User> findByUserProfileEmailIgnoreCase(String email);
    Optional<User> findByUserProfileId(Long profileId);
    java.util.List<User> findAllByUserProfileId(Long profileId);
    Boolean existsByUsername(String username);
    Boolean existsByUserProfileEmailIgnoreCase(String email);

    default Optional<User> findByEmail(String email) {
        return findByUserProfileEmailIgnoreCase(email);
    }
    default Boolean existsByEmail(String email) {
        return existsByUserProfileEmailIgnoreCase(email);
    }
}
