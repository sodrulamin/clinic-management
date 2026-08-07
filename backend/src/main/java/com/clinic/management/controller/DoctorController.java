package com.clinic.management.controller;

import com.clinic.management.dto.CreateDoctorRequest;
import com.clinic.management.dto.DoctorShiftDto;
import com.clinic.management.entity.Doctor;
import com.clinic.management.exception.UsernameUnavailableException;
import com.clinic.management.service.AppointmentSlotService;
import com.clinic.management.service.DoctorService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.format.annotation.DateTimeFormat;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.AccessDeniedException;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

import java.time.LocalDate;
import java.util.HashMap;
import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/v1/doctors")
@RequiredArgsConstructor
public class DoctorController {

    private final DoctorService doctorService;
    private final AppointmentSlotService appointmentSlotService;

    @GetMapping
    @PreAuthorize("@securityService.hasAccess('/doctors')")
    public ResponseEntity<List<Doctor>> getAllDoctors(@RequestParam(required = false) Boolean activeOnly) {
        return ResponseEntity.ok(doctorService.getAllDoctors(activeOnly));
    }

    @GetMapping("/{id}")
    @PreAuthorize("@securityService.hasAccess('/doctors')")
    public ResponseEntity<Doctor> getDoctorById(@PathVariable Long id) {
        return doctorService.getDoctorById(id)
                .map(ResponseEntity::ok)
                .orElse(ResponseEntity.notFound().build());
    }

    @GetMapping("/{id}/shifts")
    public ResponseEntity<List<DoctorShiftDto>> getDoctorShifts(
            @PathVariable Long id,
            @RequestParam @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate date) {
        return doctorService.getDoctorById(id)
                .map(doctor -> ResponseEntity.ok(appointmentSlotService.getDoctorShiftsForDate(doctor, date)))
                .orElse(ResponseEntity.notFound().build());
    }

    @PostMapping
    @PreAuthorize("hasAuthority('ROLE_ADMIN') or hasAuthority('ADMIN')")
    public ResponseEntity<?> createDoctor(@Valid @RequestBody CreateDoctorRequest request) {
        try {
            Doctor created = doctorService.createDoctor(request);
            return ResponseEntity.ok(created);
        } catch (UsernameUnavailableException e) {
            Map<String, Object> error = new HashMap<>();
            error.put("error", "USERNAME_TAKEN");
            error.put("message", e.getMessage());
            error.put("username", e.getUsername());
            error.put("suggestions", e.getSuggestions());
            return ResponseEntity.status(HttpStatus.CONFLICT).body(error);
        } catch (IllegalArgumentException e) {
            Map<String, Object> error = new HashMap<>();
            error.put("message", e.getMessage());
            return ResponseEntity.status(HttpStatus.BAD_REQUEST).body(error);
        }
    }

    @PutMapping("/{id}")
    @PreAuthorize("@securityService.hasAccess('/doctors')")
    public ResponseEntity<?> updateDoctor(
            @PathVariable Long id,
            @Valid @RequestBody Doctor updatedDoctor,
            Authentication authentication) {
        try {
            return ResponseEntity.ok(doctorService.updateDoctor(id, updatedDoctor, authentication));
        } catch (AccessDeniedException e) {
            return ResponseEntity.status(403).body(e.getMessage());
        }
    }

    @DeleteMapping("/{id}")
    @PreAuthorize("hasAuthority('ROLE_ADMIN') or hasAuthority('ADMIN')")
    public ResponseEntity<?> deleteDoctor(@PathVariable Long id) {
        doctorService.deleteDoctor(id);
        return ResponseEntity.ok("Doctor deleted successfully");
    }
}
