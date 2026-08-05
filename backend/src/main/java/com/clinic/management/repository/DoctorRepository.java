package com.clinic.management.repository;

import com.clinic.management.entity.Doctor;
import org.springframework.data.jpa.repository.JpaRepository;
import java.util.List;
import java.util.Optional;

public interface DoctorRepository extends JpaRepository<Doctor, Long> {
    List<Doctor> findByActiveTrue();
    List<Doctor> findBySpecializationContainingIgnoreCase(String specialization);
    Optional<Doctor> findByUserProfileId(Long profileId);
    Optional<Doctor> findByUserProfileEmailIgnoreCase(String email);
}
