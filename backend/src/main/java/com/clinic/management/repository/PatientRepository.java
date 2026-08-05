package com.clinic.management.repository;

import com.clinic.management.entity.Patient;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.JpaSpecificationExecutor;

import java.util.List;
import java.util.Optional;

public interface PatientRepository extends JpaRepository<Patient, Long>, JpaSpecificationExecutor<Patient> {
    List<Patient> findByFullNameContainingIgnoreCaseOrPhoneContaining(String name, String phone);
    Optional<Patient> findByPhone(String phone);
    List<Patient> findAllByPhone(String phone);
}
