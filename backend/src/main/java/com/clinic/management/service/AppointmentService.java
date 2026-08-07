package com.clinic.management.service;

import com.clinic.management.controller.AppointmentController.CreateAppointmentRequest;
import com.clinic.management.entity.Appointment;
import com.clinic.management.entity.Doctor;
import com.clinic.management.entity.Patient;
import com.clinic.management.entity.User;
import com.clinic.management.entity.UserProfile;
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
import java.util.Optional;

@Service
@RequiredArgsConstructor
public class AppointmentService {

    private final AppointmentRepository appointmentRepository;
    private final DoctorRepository doctorRepository;
    private final PatientRepository patientRepository;
    private final UserRepository userRepository;
    private final AppointmentSlotService appointmentSlotService;

    private Doctor findDoctorForUser(User user) {
        if (user == null) return null;
        if (user.getUserProfile() != null && user.getUserProfile().getId() != null) {
            Optional<Doctor> docOpt = doctorRepository.findByUserProfileId(user.getUserProfile().getId());
            if (docOpt.isPresent()) {
                return docOpt.get();
            }
        }
        List<Doctor> allDocs = doctorRepository.findAll();
        return allDocs.stream()
                .filter(d -> (d.getUserProfile() != null && user.getUserProfile() != null && d.getUserProfile().getId().equals(user.getUserProfile().getId())) ||
                        (user.getEmail() != null && user.getEmail().equalsIgnoreCase(d.getEmail())) ||
                        (user.getPhone() != null && user.getPhone().equals(d.getPhone())) ||
                        (user.getFullName() != null && user.getFullName().equalsIgnoreCase(d.getFullName())) ||
                        (d.getFullName() != null && d.getFullName().toLowerCase().contains(user.getUsername().toLowerCase())))
                .findFirst()
                .orElse(allDocs.isEmpty() ? null : allDocs.get(0));
    }

    public List<Appointment> getAllAppointments(Authentication authentication, LocalDate startDate, LocalDate endDate, Boolean allDates, Long targetDoctorId) {
        List<Appointment> list;
        if (authentication != null) {
            boolean isAdminOrRec = authentication.getAuthorities().stream()
                    .anyMatch(a -> a.getAuthority().equals("ROLE_ADMIN") || a.getAuthority().equals("ROLE_RECEPTIONIST"));

            if (!isAdminOrRec) {
                User user = userRepository.findByUsername(authentication.getName()).orElse(null);
                if (user != null && user.getRole() != null && "ROLE_DOCTOR".equals(user.getRole().getName())) {
                    Doctor matchedDoc = findDoctorForUser(user);

                    if (matchedDoc != null) {
                        list = appointmentRepository.findByDoctorId(matchedDoc.getId());
                    } else {
                        list = List.of();
                    }
                } else {
                    list = appointmentRepository.findAll();
                }
            } else {
                list = appointmentRepository.findAll();
            }
        } else {
            list = appointmentRepository.findAll();
        }

        if (targetDoctorId != null) {
            list = list.stream().filter(a -> a.getDoctor() != null && targetDoctorId.equals(a.getDoctor().getId())).toList();
        }

        if (!Boolean.TRUE.equals(allDates)) {
            if (startDate != null) {
                list = list.stream().filter(a -> a.getAppointmentDate() != null && !a.getAppointmentDate().isBefore(startDate)).toList();
            }
            if (endDate != null) {
                list = list.stream().filter(a -> a.getAppointmentDate() != null && !a.getAppointmentDate().isAfter(endDate)).toList();
            }
        }

        return list;
    }

    public java.util.Optional<Appointment> getAppointmentById(Long id) {
        return appointmentRepository.findById(id);
    }

    public Map<String, Object> getStats(Authentication authentication, LocalDate startDate, LocalDate endDate, Boolean allDates, Long targetDoctorId) {
        Map<String, Object> stats = new HashMap<>();

        boolean isDoctor = false;
        Doctor doctor = null;

        if (authentication != null) {
            User user = userRepository.findByUsername(authentication.getName()).orElse(null);
            if (user != null && user.getRole() != null && "ROLE_DOCTOR".equals(user.getRole().getName())) {
                isDoctor = true;
                doctor = findDoctorForUser(user);
            }
        }

        List<Appointment> apps;
        if (isDoctor && doctor != null) {
            apps = appointmentRepository.findByDoctorId(doctor.getId());
        } else if (targetDoctorId != null) {
            apps = appointmentRepository.findByDoctorId(targetDoctorId);
        } else {
            apps = appointmentRepository.findAll();
        }

        List<Appointment> filteredApps = apps;
        boolean isAll = Boolean.TRUE.equals(allDates);

        if (!isAll) {
            LocalDate start = startDate != null ? startDate : (endDate == null ? LocalDate.now() : null);
            LocalDate end = endDate != null ? endDate : (startDate == null ? LocalDate.now() : null);

            if (start != null) {
                filteredApps = filteredApps.stream().filter(a -> a.getAppointmentDate() != null && !a.getAppointmentDate().isBefore(start)).toList();
            }
            if (end != null) {
                filteredApps = filteredApps.stream().filter(a -> a.getAppointmentDate() != null && !a.getAppointmentDate().isAfter(end)).toList();
            }
        }

        List<Appointment> servedApps = filteredApps.stream()
                .filter(a -> a.getStatus() == Appointment.AppointmentStatus.VISITED || a.getStatus() == Appointment.AppointmentStatus.COMPLETED)
                .toList();

        double income = servedApps.stream()
                .mapToDouble(a -> {
                    double baseFee = (a.getDoctor() != null && a.getDoctor().getConsultationFee() != null) ? a.getDoctor().getConsultationFee() : 0.0;
                    double disc = (a.getDiscount() != null) ? a.getDiscount() : 0.0;
                    return Math.max(0.0, baseFee - disc);
                })
                .sum();

        stats.put("totalAppointments", apps.size());
        stats.put("todayAppointments", filteredApps.size());
        stats.put("todayVisited", servedApps.size());
        stats.put("todayIncome", income);
        stats.put("isDoctorView", isDoctor);

        return stats;
    }

    public Appointment createAppointment(CreateAppointmentRequest request) {
        Doctor doctor = doctorRepository.findById(request.getDoctorId())
                .orElseThrow(() -> new RuntimeException("Doctor not found"));

        Patient patient;
        if (request.getPatientId() != null) {
            patient = patientRepository.findById(request.getPatientId())
                    .orElseThrow(() -> new RuntimeException("Patient not found"));

            boolean patientUpdated = false;
            if (request.getAge() != null) {
                patient.setAge(request.getAge());
                patientUpdated = true;
            }
            if (request.getGender() != null && !request.getGender().isBlank()) {
                patient.setGender(request.getGender());
                patientUpdated = true;
            }
            if (request.getPatientName() != null && !request.getPatientName().isBlank()) {
                patient.setFullName(request.getPatientName());
                patientUpdated = true;
            }
            if (request.getPatientPhone() != null && !request.getPatientPhone().isBlank()) {
                patient.setPhone(request.getPatientPhone());
                patientUpdated = true;
            }
            if (request.getPatientEmail() != null && !request.getPatientEmail().isBlank()) {
                patient.setEmail(request.getPatientEmail());
                patientUpdated = true;
            }
            if (patientUpdated) {
                patientRepository.save(patient);
            }
        } else {
            patient = Patient.builder()
                    .userProfile(UserProfile.builder()
                            .fullName(request.getPatientName() != null && !request.getPatientName().isBlank() ? request.getPatientName() : "New Patient")
                            .phone(request.getPatientPhone())
                            .email(request.getPatientEmail())
                            .age(request.getAge())
                            .gender(request.getGender())
                            .build())
                    .build();
            patient = patientRepository.save(patient);
        }

        String timeSlot = request.getTimeSlot();
        if (timeSlot == null || timeSlot.isBlank() || timeSlot.toLowerCase().startsWith("shift") || timeSlot.toLowerCase().contains("shift")) {
            timeSlot = appointmentSlotService.determineNextAvailableSlot(doctor, request.getAppointmentDate(), timeSlot);
        }

        Appointment appointment = Appointment.builder()
                .doctor(doctor)
                .patient(patient)
                .appointmentDate(request.getAppointmentDate())
                .timeSlot(timeSlot)
                .reason(request.getReason())
                .status(Appointment.AppointmentStatus.SCHEDULED)
                .build();

        return appointmentRepository.save(appointment);
    }

    public Appointment updateStatus(Long id, Appointment.AppointmentStatus status, Authentication authentication) {
        if (status == Appointment.AppointmentStatus.VISITED) {
            boolean isDoctor = false;
            if (authentication != null) {
                User user = userRepository.findByUsername(authentication.getName()).orElse(null);
                if (user != null && user.getRole() != null && "ROLE_DOCTOR".equals(user.getRole().getName())) {
                    isDoctor = true;
                }
            }
            if (!isDoctor) {
                throw new RuntimeException("Only doctors are allowed to serve patients.");
            }
        }

        Appointment appointment = appointmentRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Appointment not found"));
        appointment.setStatus(status);
        if (status == Appointment.AppointmentStatus.VISITED && appointment.getPatient() != null) {
            Patient patient = appointment.getPatient();
            patient.setLastServedDate(appointment.getAppointmentDate() != null ? appointment.getAppointmentDate() : LocalDate.now());
            patientRepository.save(patient);
        }
        return appointmentRepository.save(appointment);
    }

    public Appointment updateDiscount(Long id, Double discount, Authentication authentication) {
        Appointment appointment = appointmentRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Appointment not found"));

        if (discount == null || discount < 0) {
            throw new RuntimeException("Discount amount cannot be negative.");
        }

        double consultationFee = (appointment.getDoctor() != null && appointment.getDoctor().getConsultationFee() != null)
                ? appointment.getDoctor().getConsultationFee()
                : 0.0;

        if (discount > consultationFee) {
            throw new RuntimeException("Discount cannot exceed consultation fee (৳" + consultationFee + ").");
        }

        appointment.setDiscount(discount);
        return appointmentRepository.save(appointment);
    }

    public void deleteAppointment(Long id) {
        appointmentRepository.deleteById(id);
    }

    public Map<String, Object> getServedComparisonStats(Authentication authentication) {
        if (authentication == null) {
            throw new RuntimeException("Unauthorized access");
        }

        User user = userRepository.findByUsername(authentication.getName()).orElse(null);
        if (user == null || user.getRole() == null) {
            throw new RuntimeException("Unauthorized access");
        }

        String roleName = user.getRole().getName();
        boolean isAdmin = "ROLE_ADMIN".equals(roleName) || "ADMIN".equals(roleName);
        boolean isDoctor = "ROLE_DOCTOR".equals(roleName) || "DOCTOR".equals(roleName);

        if (!isAdmin && !isDoctor) {
            throw new RuntimeException("Access denied. Only doctors and admins can view served patient comparison stats.");
        }

        List<Appointment> allApps;
        if (isDoctor && !isAdmin) {
            Doctor doctor = findDoctorForUser(user);

            if (doctor != null) {
                allApps = appointmentRepository.findByDoctorId(doctor.getId());
            } else {
                allApps = List.of();
            }
        } else {
            allApps = appointmentRepository.findAll();
        }

        List<Appointment> servedApps = allApps.stream()
                .filter(a -> a.getStatus() == Appointment.AppointmentStatus.VISITED ||
                             a.getStatus() == Appointment.AppointmentStatus.COMPLETED)
                .toList();

        LocalDate today = LocalDate.now();
        LocalDate yesterday = today.minusDays(1);
        LocalDate sameDayLastWeek = today.minusDays(7);

        long todayCount = servedApps.stream()
                .filter(a -> today.equals(a.getAppointmentDate()))
                .count();

        long yesterdayCount = servedApps.stream()
                .filter(a -> yesterday.equals(a.getAppointmentDate()))
                .count();

        long sameDayLastWeekCount = servedApps.stream()
                .filter(a -> sameDayLastWeek.equals(a.getAppointmentDate()))
                .count();

        java.util.function.ToDoubleFunction<Appointment> feeCalc = a -> {
            double baseFee = (a.getDoctor() != null && a.getDoctor().getConsultationFee() != null) ? a.getDoctor().getConsultationFee() : 0.0;
            double disc = (a.getDiscount() != null) ? a.getDiscount() : 0.0;
            return Math.max(0.0, baseFee - disc);
        };

        double todayIncome = servedApps.stream()
                .filter(a -> today.equals(a.getAppointmentDate()))
                .mapToDouble(feeCalc)
                .sum();

        double yesterdayIncome = servedApps.stream()
                .filter(a -> yesterday.equals(a.getAppointmentDate()))
                .mapToDouble(feeCalc)
                .sum();

        double sameDayLastWeekIncome = servedApps.stream()
                .filter(a -> sameDayLastWeek.equals(a.getAppointmentDate()))
                .mapToDouble(feeCalc)
                .sum();

        Map<String, Object> result = new HashMap<>();
        result.put("todayDate", today.toString());
        result.put("todayDayName", today.getDayOfWeek().toString());
        result.put("todayCount", todayCount);
        result.put("todayIncome", todayIncome);

        result.put("yesterdayDate", yesterday.toString());
        result.put("yesterdayDayName", yesterday.getDayOfWeek().toString());
        result.put("yesterdayCount", yesterdayCount);
        result.put("yesterdayIncome", yesterdayIncome);

        result.put("sameDayLastWeekDate", sameDayLastWeek.toString());
        result.put("sameDayLastWeekDayName", sameDayLastWeek.getDayOfWeek().toString());
        result.put("sameDayLastWeekCount", sameDayLastWeekCount);
        result.put("sameDayLastWeekIncome", sameDayLastWeekIncome);

        result.put("userRole", roleName);
        result.put("scope", isDoctor && !isAdmin ? "MY_PATIENTS" : "ALL_PATIENTS");

        return result;
    }
}
