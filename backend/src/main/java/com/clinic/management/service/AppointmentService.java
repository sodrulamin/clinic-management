package com.clinic.management.service;

import com.clinic.management.controller.AppointmentController.CreateAppointmentRequest;
import com.clinic.management.entity.Appointment;
import com.clinic.management.entity.Doctor;
import com.clinic.management.entity.Patient;
import com.clinic.management.entity.User;
import com.clinic.management.repository.AppointmentRepository;
import com.clinic.management.repository.DoctorRepository;
import com.clinic.management.repository.PatientRepository;
import com.clinic.management.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.security.core.Authentication;
import org.springframework.stereotype.Service;

import java.time.LocalDate;
import java.util.HashMap;
import java.util.List;
import java.util.Map;

@Service
@RequiredArgsConstructor
public class AppointmentService {

    private final AppointmentRepository appointmentRepository;
    private final DoctorRepository doctorRepository;
    private final PatientRepository patientRepository;
    private final UserRepository userRepository;

    public List<Appointment> getAllAppointments(Authentication authentication) {
        if (authentication != null) {
            boolean isAdminOrRec = authentication.getAuthorities().stream()
                    .anyMatch(a -> a.getAuthority().equals("ROLE_ADMIN") || a.getAuthority().equals("ROLE_RECEPTIONIST"));

            if (!isAdminOrRec) {
                User user = userRepository.findByUsername(authentication.getName()).orElse(null);
                if (user != null && "ROLE_DOCTOR".equals(user.getRole().getName())) {
                    List<Doctor> allDocs = doctorRepository.findAll();
                    Doctor matchedDoc = allDocs.stream()
                            .filter(d -> (user.getEmail() != null && user.getEmail().equalsIgnoreCase(d.getEmail())) ||
                                         (user.getFullName() != null && user.getFullName().equalsIgnoreCase(d.getFullName())))
                            .findFirst()
                            .orElse(null);

                    if (matchedDoc != null) {
                        return appointmentRepository.findByDoctorId(matchedDoc.getId());
                    } else {
                        return List.of();
                    }
                }
            }
        }
        return appointmentRepository.findAll();
    }

    public Map<String, Object> getStats() {
        Map<String, Object> stats = new HashMap<>();
        stats.put("totalAppointments", appointmentRepository.count());
        stats.put("todayAppointments", appointmentRepository.countByAppointmentDate(LocalDate.now()));
        return stats;
    }

    public Appointment createAppointment(CreateAppointmentRequest request) {
        Doctor doctor = doctorRepository.findById(request.getDoctorId())
                .orElseThrow(() -> new RuntimeException("Doctor not found"));

        Patient patient = patientRepository.findById(request.getPatientId())
                .orElseThrow(() -> new RuntimeException("Patient not found"));

        Appointment appointment = Appointment.builder()
                .doctor(doctor)
                .patient(patient)
                .appointmentDate(request.getAppointmentDate())
                .timeSlot(request.getTimeSlot())
                .reason(request.getReason())
                .status(Appointment.AppointmentStatus.SCHEDULED)
                .build();

        return appointmentRepository.save(appointment);
    }

    public Appointment updateStatus(Long id, Appointment.AppointmentStatus status) {
        Appointment appointment = appointmentRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Appointment not found"));
        appointment.setStatus(status);
        return appointmentRepository.save(appointment);
    }

    public void deleteAppointment(Long id) {
        appointmentRepository.deleteById(id);
    }
}
