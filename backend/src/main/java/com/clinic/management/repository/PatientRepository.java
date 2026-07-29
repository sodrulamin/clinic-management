package com.clinic.management.repository;

import com.clinic.management.entity.Patient;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.Optional;

public interface PatientRepository extends JpaRepository<Patient, Long> {
    List<Patient> findByFullNameContainingIgnoreCaseOrPhoneContaining(String name, String phone);
    Optional<Patient> findByPhone(String phone);
}
