package com.clinic.management.controller;

import com.clinic.management.entity.Patient;
import com.clinic.management.service.PatientService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/v1/patients")
@RequiredArgsConstructor
public class PatientController {

    private final PatientService patientService;

    @GetMapping
    @PreAuthorize("@securityService.hasAccess('/patients')")
    public ResponseEntity<List<Patient>> getAllPatients(@RequestParam(required = false) String search) {
        return ResponseEntity.ok(patientService.getAllPatients(search));
    }

    @GetMapping("/{id}")
    @PreAuthorize("@securityService.hasAccess('/patients')")
    public ResponseEntity<Patient> getPatientById(@PathVariable Long id) {
        return patientService.getPatientById(id)
                .map(ResponseEntity::ok)
                .orElse(ResponseEntity.notFound().build());
    }

    @PostMapping
    @PreAuthorize("@securityService.hasAccess('/patients')")
    public ResponseEntity<?> createPatient(@Valid @RequestBody Patient patient) {
        try {
            return ResponseEntity.ok(patientService.createPatient(patient));
        } catch (IllegalArgumentException e) {
            return ResponseEntity.badRequest().body(e.getMessage());
        }
    }

    @PutMapping("/{id}")
    @PreAuthorize("@securityService.hasAccess('/patients')")
    public ResponseEntity<?> updatePatient(@PathVariable Long id, @Valid @RequestBody Patient updatedPatient) {
        return ResponseEntity.ok(patientService.updatePatient(id, updatedPatient));
    }

    @DeleteMapping("/{id}")
    @PreAuthorize("hasAuthority('ROLE_ADMIN') or hasAuthority('ADMIN')")
    public ResponseEntity<?> deletePatient(@PathVariable Long id) {
        patientService.deletePatient(id);
        return ResponseEntity.ok("Patient deleted successfully");
    }
}
