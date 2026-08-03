package com.clinic.management.service;

import com.clinic.management.controller.AppointmentRequestController.CreateRequestDto;
import com.clinic.management.entity.*;
import com.clinic.management.repository.*;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;

@Service
@RequiredArgsConstructor
public class AppointmentRequestService {

    private final AppointmentRequestRepository requestRepository;
    private final DoctorRepository doctorRepository;
    private final PatientRepository patientRepository;
    private final AppointmentRepository appointmentRepository;
    private final AppointmentSlotService appointmentSlotService;

    public List<AppointmentRequest> getAllRequests(AppointmentRequest.RequestStatus status) {
        if (status != null) {
            return requestRepository.findByStatus(status);
        }
        return requestRepository.findAll();
    }

    public AppointmentRequest createRequest(CreateRequestDto requestDto) {
        Doctor doctor = doctorRepository.findById(requestDto.getDoctorId())
                .orElseThrow(() -> new RuntimeException("Doctor not found"));

        String preferredTime = requestDto.getPreferredTime();
        if (preferredTime == null || preferredTime.isBlank()) {
            preferredTime = appointmentSlotService.determineNextAvailableSlot(doctor, requestDto.getPreferredDate());
        }

        AppointmentRequest request = AppointmentRequest.builder()
                .patientName(requestDto.getPatientName())
                .patientPhone(requestDto.getPatientPhone())
                .patientEmail(requestDto.getPatientEmail())
                .age(requestDto.getAge())
                .gender(requestDto.getGender())
                .patientId(requestDto.getPatientId())
                .doctor(doctor)
                .preferredDate(requestDto.getPreferredDate())
                .preferredTime(preferredTime)
                .reason(requestDto.getReason())
                .status(AppointmentRequest.RequestStatus.PENDING)
                .build();

        return requestRepository.save(request);
    }

    @Transactional
    public void approveRequest(Long id) {
        AppointmentRequest req = requestRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Request not found"));

        req.setStatus(AppointmentRequest.RequestStatus.APPROVED);
        requestRepository.save(req);

        Patient patient;
        if (req.getPatientId() != null) {
            patient = patientRepository.findById(req.getPatientId())
                    .orElseGet(() -> createNewPatientFromRequest(req));
        } else {
            // Always create a new patient if no existing patient was selected from suggested dropdown
            patient = createNewPatientFromRequest(req);
        }

        boolean pUpdate = false;
        if (req.getAge() != null) {
            patient.setAge(req.getAge());
            pUpdate = true;
        }
        if (req.getGender() != null && !req.getGender().isBlank()) {
            patient.setGender(req.getGender());
            pUpdate = true;
        }
        if (pUpdate) {
            patientRepository.save(patient);
        }

        // Create scheduled appointment
        Appointment appointment = Appointment.builder()
                .doctor(req.getDoctor())
                .patient(patient)
                .appointmentDate(req.getPreferredDate())
                .timeSlot(req.getPreferredTime())
                .reason(req.getReason())
                .status(Appointment.AppointmentStatus.SCHEDULED)
                .build();

        appointmentRepository.save(appointment);
    }

    public AppointmentRequest rejectRequest(Long id) {
        AppointmentRequest req = requestRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Request not found"));
        req.setStatus(AppointmentRequest.RequestStatus.REJECTED);
        return requestRepository.save(req);
    }

    private Patient createNewPatientFromRequest(AppointmentRequest req) {
        return patientRepository.save(Patient.builder()
                .fullName(req.getPatientName())
                .phone(req.getPatientPhone())
                .email(req.getPatientEmail())
                .age(req.getAge())
                .gender(req.getGender())
                .medicalHistory("Created from appointment request")
                .build());
    }
}
