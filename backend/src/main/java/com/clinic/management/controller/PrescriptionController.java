package com.clinic.management.controller;

import com.clinic.management.dto.PrescriptionRequest;
import com.clinic.management.entity.Prescription;
import com.clinic.management.service.PrescriptionService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

import java.util.Map;

@RestController
@RequestMapping("/api/v1/prescriptions")
@RequiredArgsConstructor
public class PrescriptionController {

    private final PrescriptionService prescriptionService;

    @PostMapping
    @PreAuthorize("@securityService.hasAccess('/appointments')")
    public ResponseEntity<?> createPrescription(@RequestBody PrescriptionRequest request, Authentication authentication) {
        try {
            Prescription prescription = prescriptionService.createOrUpdatePrescription(request, authentication);
            return ResponseEntity.ok(prescription);
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(Map.of("message", e.getMessage()));
        }
    }

    @GetMapping("/appointment/{appointmentId}")
    @PreAuthorize("@securityService.hasAccess('/appointments')")
    public ResponseEntity<?> getPrescriptionByAppointment(@PathVariable Long appointmentId) {
        return prescriptionService.getPrescriptionByAppointmentId(appointmentId)
                .map(ResponseEntity::ok)
                .orElseGet(() -> ResponseEntity.notFound().build());
    }

    @GetMapping("/patient/{patientId}")
    @PreAuthorize("@securityService.hasAccess('/patients')")
    public ResponseEntity<?> getPrescriptionsByPatient(@PathVariable Long patientId) {
        return ResponseEntity.ok(prescriptionService.getPrescriptionsByPatientId(patientId));
    }

    @GetMapping("/medicine-suggestions")
    @PreAuthorize("@securityService.hasAccess('/appointments')")
    public ResponseEntity<?> getMedicineSuggestions(@RequestParam(required = false, defaultValue = "") String query) {
        return ResponseEntity.ok(prescriptionService.getMedicineSuggestions(query));
    }

    @GetMapping("/instruction-suggestions")
    @PreAuthorize("@securityService.hasAccess('/appointments')")
    public ResponseEntity<?> getInstructionSuggestions(@RequestParam(required = false, defaultValue = "") String query) {
        return ResponseEntity.ok(prescriptionService.getInstructionSuggestions(query));
    }
}
