package com.clinic.management.controller;

import com.clinic.management.entity.AppointmentRequest;
import com.clinic.management.service.AppointmentRequestService;
import lombok.Data;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.time.LocalDate;
import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/v1/appointment-requests")
@RequiredArgsConstructor
public class AppointmentRequestController {

    private final AppointmentRequestService requestService;

    @GetMapping
    @PreAuthorize("@securityService.hasAccess('/appointment-requests')")
    public ResponseEntity<List<AppointmentRequest>> getAllRequests(
            @RequestParam(required = false) AppointmentRequest.RequestStatus status,
            @RequestParam(required = false) LocalDate startDate,
            @RequestParam(required = false) LocalDate endDate,
            @RequestParam(required = false) Long doctorId) {
        return ResponseEntity.ok(requestService.getAllRequests(status, startDate, endDate, doctorId));
    }

    @PostMapping
    @PreAuthorize("@securityService.hasAccess('/appointment-requests')")
    public ResponseEntity<?> createRequest(@RequestBody CreateRequestDto requestDto) {
        try {
            return ResponseEntity.ok(requestService.createRequest(requestDto));
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(Map.of("message", e.getMessage()));
        }
    }

    @PostMapping("/public")
    @PreAuthorize("permitAll()")
    public ResponseEntity<?> createPublicRequest(@RequestBody CreateRequestDto requestDto) {
        return createRequest(requestDto);
    }

    @PutMapping("/{id}/approve")
    @PreAuthorize("@securityService.hasAccess('/appointment-requests')")
    public ResponseEntity<?> approveRequest(@PathVariable Long id) {
        requestService.approveRequest(id);
        return ResponseEntity.ok("Request approved and appointment scheduled");
    }

    @PutMapping("/{id}/reject")
    @PreAuthorize("@securityService.hasAccess('/appointment-requests')")
    public ResponseEntity<?> rejectRequest(@PathVariable Long id) {
        return ResponseEntity.ok(requestService.rejectRequest(id));
    }

    @Data
    public static class CreateRequestDto {
        private String patientName;
        private String patientPhone;
        private String patientEmail;
        private Integer age;
        private String gender;
        private Long doctorId;
        private Long patientId;
        private LocalDate preferredDate;
        private String preferredTime;
        private String reason;
    }
}
