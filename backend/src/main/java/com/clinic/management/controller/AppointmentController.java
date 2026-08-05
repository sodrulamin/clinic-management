package com.clinic.management.controller;

import com.clinic.management.entity.Appointment;
import com.clinic.management.scheduler.AppointmentScheduler;
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
    private final AppointmentScheduler appointmentScheduler;

    @GetMapping
    @PreAuthorize("@securityService.hasAccess('/appointments')")
    public ResponseEntity<List<Appointment>> getAllAppointments(
            Authentication authentication,
            @RequestParam(required = false) LocalDate startDate,
            @RequestParam(required = false) LocalDate endDate,
            @RequestParam(required = false) Boolean allDates,
            @RequestParam(required = false) Long doctorId) {
        return ResponseEntity.ok(appointmentService.getAllAppointments(authentication, startDate, endDate, allDates, doctorId));
    }

    @GetMapping("/{id}")
    @PreAuthorize("@securityService.hasAccess('/appointments')")
    public ResponseEntity<?> getAppointmentById(@PathVariable Long id) {
        return appointmentService.getAppointmentById(id)
                .map(ResponseEntity::ok)
                .orElseGet(() -> ResponseEntity.notFound().build());
    }

    @GetMapping("/stats")
    @PreAuthorize("@securityService.hasAccess('/appointments')")
    public ResponseEntity<Map<String, Object>> getStats(
            Authentication authentication,
            @RequestParam(required = false) LocalDate startDate,
            @RequestParam(required = false) LocalDate endDate,
            @RequestParam(required = false) Boolean allDates,
            @RequestParam(required = false) Long doctorId) {
        return ResponseEntity.ok(appointmentService.getStats(authentication, startDate, endDate, allDates, doctorId));
    }

    @PostMapping
    @PreAuthorize("@securityService.hasAccess('/appointments')")
    public ResponseEntity<?> createAppointment(@RequestBody CreateAppointmentRequest request) {
        try {
            return ResponseEntity.ok(appointmentService.createAppointment(request));
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(Map.of("message", e.getMessage()));
        }
    }

    @PutMapping("/{id}/status")
    @PreAuthorize("@securityService.hasAccess('/appointments')")
    public ResponseEntity<?> updateStatus(@PathVariable Long id, @RequestParam Appointment.AppointmentStatus status, Authentication authentication) {
        try {
            return ResponseEntity.ok(appointmentService.updateStatus(id, status, authentication));
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(Map.of("message", e.getMessage()));
        }
    }

    @PutMapping("/{id}/discount")
    @PreAuthorize("@securityService.hasAccess('/appointments')")
    public ResponseEntity<?> updateDiscount(@PathVariable Long id, @RequestParam Double discount, Authentication authentication) {
        try {
            return ResponseEntity.ok(appointmentService.updateDiscount(id, discount, authentication));
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(Map.of("message", e.getMessage()));
        }
    }

    @PostMapping("/trigger-auto-cancel")
    @PreAuthorize("hasAuthority('ROLE_ADMIN')")
    public ResponseEntity<?> triggerAutoCancel() {
        appointmentScheduler.autoCancelUnservedAppointments();
        return ResponseEntity.ok(Map.of(
                "message", "ShedLock auto-cancel scheduler executed successfully"
        ));
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
        private String patientName;
        private String patientPhone;
        private String patientEmail;
        private LocalDate appointmentDate;
        private String timeSlot;
        private String reason;
        private Integer age;
        private String gender;
    }
}
