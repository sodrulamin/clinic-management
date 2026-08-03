package com.clinic.management.repository;

import com.clinic.management.entity.PrescriptionMedicine;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.util.List;

public interface PrescriptionMedicineRepository extends JpaRepository<PrescriptionMedicine, Long> {

    void deleteByPrescriptionId(Long prescriptionId);

    List<PrescriptionMedicine> findByPrescriptionIdOrderBySortOrderAsc(Long prescriptionId);

    @Query("SELECT DISTINCT pm.name FROM PrescriptionMedicine pm WHERE LOWER(pm.name) LIKE LOWER(CONCAT('%', :query, '%')) ORDER BY pm.name ASC")
    List<String> findDistinctNamesByQuery(@Param("query") String query);

    @Query("SELECT DISTINCT pm.instruction FROM PrescriptionMedicine pm WHERE LOWER(pm.instruction) LIKE LOWER(CONCAT('%', :query, '%')) AND pm.instruction IS NOT NULL AND pm.instruction != '' ORDER BY pm.instruction ASC")
    List<String> findDistinctInstructionsByQuery(@Param("query") String query);
}
