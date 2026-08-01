package com.clinic.management.service;

import com.clinic.management.entity.Diagnosis;
import com.clinic.management.repository.DiagnosisRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

import java.util.List;

@Service
@RequiredArgsConstructor
public class DiagnosisService {

    private final DiagnosisRepository diagnosisRepository;

    public List<Diagnosis> getAllDiagnoses() {
        return diagnosisRepository.findAllByOrderByNameAsc();
    }

    public List<Diagnosis> getActiveDiagnoses() {
        return diagnosisRepository.findByActiveTrueOrderByNameAsc();
    }

    public Diagnosis getDiagnosisById(Long id) {
        return diagnosisRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Diagnosis not found with id: " + id));
    }

    public Diagnosis createDiagnosis(Diagnosis diagnosis) {
        if (diagnosis.getName() == null || diagnosis.getName().isBlank()) {
            throw new RuntimeException("Diagnosis name is required.");
        }
        if (diagnosisRepository.existsByNameIgnoreCase(diagnosis.getName().trim())) {
            throw new RuntimeException("A diagnosis with this name already exists.");
        }
        diagnosis.setName(diagnosis.getName().trim());
        if (diagnosis.getCode() != null) diagnosis.setCode(diagnosis.getCode().trim());
        if (diagnosis.getCategory() != null) diagnosis.setCategory(diagnosis.getCategory().trim());
        if (diagnosis.getPrice() == null || diagnosis.getPrice() < 0) diagnosis.setPrice(0.0);
        if (diagnosis.getActive() == null) diagnosis.setActive(true);

        return diagnosisRepository.save(diagnosis);
    }

    public Diagnosis updateDiagnosis(Long id, Diagnosis details) {
        Diagnosis diagnosis = getDiagnosisById(id);

        if (details.getName() == null || details.getName().isBlank()) {
            throw new RuntimeException("Diagnosis name is required.");
        }
        if (diagnosisRepository.existsByNameIgnoreCaseAndIdNot(details.getName().trim(), id)) {
            throw new RuntimeException("Another diagnosis with this name already exists.");
        }

        diagnosis.setName(details.getName().trim());
        diagnosis.setCode(details.getCode() != null ? details.getCode().trim() : null);
        diagnosis.setCategory(details.getCategory() != null ? details.getCategory().trim() : null);
        diagnosis.setDescription(details.getDescription());
        diagnosis.setPrice(details.getPrice() != null && details.getPrice() >= 0 ? details.getPrice() : 0.0);
        diagnosis.setMaxDiscountPercent(details.getMaxDiscountPercent());
        diagnosis.setMaxDiscountFixed(details.getMaxDiscountFixed());
        if (details.getActive() != null) {
            diagnosis.setActive(details.getActive());
        }

        return diagnosisRepository.save(diagnosis);
    }

    public void deleteDiagnosis(Long id) {
        Diagnosis diagnosis = getDiagnosisById(id);
        diagnosisRepository.delete(diagnosis);
    }
}
