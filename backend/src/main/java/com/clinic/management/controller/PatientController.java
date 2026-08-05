package com.clinic.management.controller;

import com.clinic.management.entity.Patient;
import com.clinic.management.service.PatientService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.format.annotation.DateTimeFormat;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.time.LocalDate;
import java.util.List;

@RestController
@RequestMapping("/api/v1/patients")
@RequiredArgsConstructor
public class PatientController {

    private final PatientService patientService;

    @GetMapping
    @PreAuthorize("@securityService.hasAccess('/patients')")
    public ResponseEntity<?> getAllPatients(
            @RequestParam(required = false) String search,
            @RequestParam(required = false) String name,
            @RequestParam(required = false) String phone,
            @RequestParam(required = false) Integer minAge,
            @RequestParam(required = false) Integer maxAge,
            @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate startDate,
            @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate endDate,
            @RequestParam(required = false) String bloodGroup,
            @RequestParam(required = false) Integer page,
            @RequestParam(required = false) Integer size,
            @RequestParam(required = false, defaultValue = "id") String sortBy,
            @RequestParam(required = false, defaultValue = "ASC") String sortDir
    ) {
        if (page != null) {
            int pageSize = (size != null && size > 0) ? size : 10;
            return ResponseEntity.ok(patientService.getPatientsPaginated(
                    search, name, phone, minAge, maxAge, startDate, endDate, bloodGroup, page, pageSize, sortBy, sortDir
            ));
        } else {
            return ResponseEntity.ok(patientService.getAllPatients(search));
        }
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
