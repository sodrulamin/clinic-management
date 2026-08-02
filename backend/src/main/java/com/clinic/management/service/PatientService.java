package com.clinic.management.service;

import com.clinic.management.entity.Patient;
import com.clinic.management.repository.PatientRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

import java.util.List;
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
