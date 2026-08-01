package com.clinic.management.repository;

import com.clinic.management.entity.PrescriptionDiagnosis;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface PrescriptionDiagnosisRepository extends JpaRepository<PrescriptionDiagnosis, Long> {
    List<PrescriptionDiagnosis> findByPrescriptionIdOrderBySortOrderAsc(Long prescriptionId);
    void deleteByPrescriptionId(Long prescriptionId);
}
