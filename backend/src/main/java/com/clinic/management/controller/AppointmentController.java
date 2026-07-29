package com.clinic.management.controller;

import com.clinic.management.entity.Appointment;
import com.clinic.management.service.AppointmentService;
import lombok.Data;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

import java.time.LocalDate;
import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/v1/appointments")
@RequiredArgsConstructor
public class AppointmentController {

    private final AppointmentService appointmentService;

    @GetMapping
    @PreAuthorize("@securityService.hasAccess('/appointments')")
    public ResponseEntity<List<Appointment>> getAllAppointments(Authentication authentication) {
        return ResponseEntity.ok(appointmentService.getAllAppointments(authentication));
    }

    @GetMapping("/stats")
    @PreAuthorize("@securityService.hasAccess('/appointments')")
    public ResponseEntity<Map<String, Object>> getStats() {
        return ResponseEntity.ok(appointmentService.getStats());
    }

    @PostMapping
    @PreAuthorize("@securityService.hasAccess('/appointments')")
    public ResponseEntity<?> createAppointment(@RequestBody CreateAppointmentRequest request) {
        return ResponseEntity.ok(appointmentService.createAppointment(request));
    }

    @PutMapping("/{id}/status")
    @PreAuthorize("@securityService.hasAccess('/appointments')")
    public ResponseEntity<?> updateStatus(@PathVariable Long id, @RequestParam Appointment.AppointmentStatus status) {
        return ResponseEntity.ok(appointmentService.updateStatus(id, status));
    }

    @DeleteMapping("/{id}")
    @PreAuthorize("hasAuthority('ROLE_ADMIN') or hasAuthority('ROLE_RECEPTIONIST')")
    public ResponseEntity<?> deleteAppointment(@PathVariable Long id) {
        appointmentService.deleteAppointment(id);
        return ResponseEntity.ok("Appointment deleted successfully");
    }

    @Data
    public static class CreateAppointmentRequest {
        private Long doctorId;
        private Long patientId;
        private LocalDate appointmentDate;
        private String timeSlot;
        private String reason;
    }
}
