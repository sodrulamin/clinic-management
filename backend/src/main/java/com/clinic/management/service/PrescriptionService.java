package com.clinic.management.service;

import com.clinic.management.dto.PrescriptionRequest;
import com.clinic.management.entity.Appointment;
import com.clinic.management.entity.Prescription;
import com.clinic.management.entity.User;
import com.clinic.management.repository.AppointmentRepository;
import com.clinic.management.repository.PrescriptionRepository;
import com.clinic.management.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.security.core.Authentication;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.Optional;

@Service
@RequiredArgsConstructor
public class PrescriptionService {

    private final PrescriptionRepository prescriptionRepository;
    private final AppointmentRepository appointmentRepository;
    private final UserRepository userRepository;

    @Transactional
    public Prescription createOrUpdatePrescription(PrescriptionRequest request, Authentication authentication) {
        if (authentication != null) {
            User user = userRepository.findByUsername(authentication.getName()).orElse(null);
            if (user == null || user.getRole() == null || !"ROLE_DOCTOR".equals(user.getRole().getName())) {
                throw new RuntimeException("Only doctors are allowed to write prescriptions.");
            }
        }

        Appointment appointment = appointmentRepository.findById(request.getAppointmentId())
                .orElseThrow(() -> new RuntimeException("Appointment not found"));

        if (request.getMedicines() == null || request.getMedicines().isBlank()) {
            throw new RuntimeException("Prescription medicines list cannot be empty.");
        }

        if (request.getDiscount() != null && request.getDiscount() >= 0) {
            appointment.setDiscount(request.getDiscount());
        }

        // Update appointment status to VISITED (served)
        appointment.setStatus(Appointment.AppointmentStatus.VISITED);
        appointmentRepository.save(appointment);

        Optional<Prescription> existing = prescriptionRepository.findByAppointmentId(appointment.getId());
        Prescription prescription;
        if (existing.isPresent()) {
            prescription = existing.get();
            prescription.setDiagnosis(request.getDiagnosis());
            prescription.setMedicines(request.getMedicines());
            prescription.setAdvice(request.getAdvice());
        } else {
            prescription = Prescription.builder()
                    .appointment(appointment)
                    .doctor(appointment.getDoctor())
                    .patient(appointment.getPatient())
                    .diagnosis(request.getDiagnosis())
                    .medicines(request.getMedicines())
                    .advice(request.getAdvice())
                    .build();
        }

        return prescriptionRepository.save(prescription);
    }

    public Optional<Prescription> getPrescriptionByAppointmentId(Long appointmentId) {
        return prescriptionRepository.findByAppointmentId(appointmentId);
    }

    public List<Prescription> getPrescriptionsByPatientId(Long patientId) {
        return prescriptionRepository.findByPatientId(patientId);
    }

    public List<Prescription> getPrescriptionsByDoctorId(Long doctorId) {
        return prescriptionRepository.findByDoctorId(doctorId);
    }
}
