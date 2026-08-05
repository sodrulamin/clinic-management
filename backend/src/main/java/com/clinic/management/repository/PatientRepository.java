package com.clinic.management.repository;

import com.clinic.management.entity.Patient;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.JpaSpecificationExecutor;

import java.util.List;
import java.util.Optional;

public interface PatientRepository extends JpaRepository<Patient, Long>, JpaSpecificationExecutor<Patient> {
    List<Patient> findByUserProfileFullNameContainingIgnoreCaseOrUserProfilePhoneContaining(String name, String phone);
    Optional<Patient> findByUserProfilePhone(String phone);
    List<Patient> findAllByUserProfilePhone(String phone);

    default List<Patient> findByFullNameContainingIgnoreCaseOrPhoneContaining(String name, String phone) {
        return findByUserProfileFullNameContainingIgnoreCaseOrUserProfilePhoneContaining(name, phone);
    }
    default Optional<Patient> findByPhone(String phone) {
        return findByUserProfilePhone(phone);
    }
    default List<Patient> findAllByPhone(String phone) {
        return findAllByUserProfilePhone(phone);
    }
}
