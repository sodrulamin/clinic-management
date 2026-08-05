package com.clinic.management.service;

import com.clinic.management.entity.Patient;
import com.clinic.management.repository.PatientRepository;
import com.clinic.management.specification.PatientSpecification;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Sort;
import org.springframework.data.jpa.domain.Specification;
import org.springframework.stereotype.Service;

import java.time.LocalDate;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.Optional;

@Service
@RequiredArgsConstructor
public class PatientService {

    private final PatientRepository patientRepository;

    public List<Patient> getAllPatients(String search) {
        if (search != null && !search.isBlank()) {
            return patientRepository.findByFullNameContainingIgnoreCaseOrPhoneContaining(search, search);
        }
        return patientRepository.findAll();
    }

    public Map<String, Object> getPatientsPaginated(
            String search, String name, String phone, Integer minAge, Integer maxAge,
            LocalDate startDate, LocalDate endDate, String bloodGroup,
            int page, int size, String sortBy, String sortDir
    ) {
        String validSortBy = (sortBy != null && !sortBy.isBlank()) ? sortBy : "id";
        Sort sort = "DESC".equalsIgnoreCase(sortDir) ? Sort.by(validSortBy).descending() : Sort.by(validSortBy).ascending();
        Pageable pageable = PageRequest.of(page, size, sort);

        Specification<Patient> spec = PatientSpecification.filterPatients(
                search, name, phone, minAge, maxAge, startDate, endDate, bloodGroup
        );

        Page<Patient> pageResult = patientRepository.findAll(spec, pageable);

        Map<String, Object> response = new HashMap<>();
        response.put("content", pageResult.getContent());
        response.put("currentPage", pageResult.getNumber());
        response.put("totalElements", pageResult.getTotalElements());
        response.put("totalPages", pageResult.getTotalPages());
        response.put("pageSize", pageResult.getSize());
        response.put("sortBy", validSortBy);
        response.put("sortDir", "DESC".equalsIgnoreCase(sortDir) ? "DESC" : "ASC");

        return response;
    }

    public Optional<Patient> getPatientById(Long id) {
        return patientRepository.findById(id);
    }

    public Patient createPatient(Patient patient) {
        return patientRepository.save(patient);
    }

    public Patient updatePatient(Long id, Patient updatedPatient) {
        Patient patient = patientRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Patient not found"));

        patient.setFullName(updatedPatient.getFullName());
        patient.setAge(updatedPatient.getAge());
        patient.setGender(updatedPatient.getGender());
        patient.setPhone(updatedPatient.getPhone());
        patient.setEmail(updatedPatient.getEmail());
        patient.setAddress(updatedPatient.getAddress());
        patient.setBloodGroup(updatedPatient.getBloodGroup());
        patient.setMedicalHistory(updatedPatient.getMedicalHistory());

        return patientRepository.save(patient);
    }

    public void deletePatient(Long id) {
        patientRepository.deleteById(id);
    }
}
