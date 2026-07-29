package com.clinic.management.config;

import com.clinic.management.entity.*;
import com.clinic.management.repository.*;
import lombok.RequiredArgsConstructor;
import org.springframework.boot.CommandLineRunner;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Component;

import java.time.LocalDate;
import java.util.List;

@Component
@RequiredArgsConstructor
public class DataInitializer implements CommandLineRunner {

    private final RoleRepository roleRepository;
    private final UserRepository userRepository;
    private final MenuRepository menuRepository;
    private final RoleMenuRepository roleMenuRepository;
    private final PatientRepository patientRepository;
    private final DoctorRepository doctorRepository;
    private final AppointmentRepository appointmentRepository;
    private final AppointmentRequestRepository appointmentRequestRepository;
    private final PasswordEncoder passwordEncoder;

    @Override
    public void run(String... args) throws Exception {
        // 1. Seed Roles
        Role adminRole = roleRepository.findByName("ROLE_ADMIN").orElseGet(() ->
                roleRepository.save(Role.builder().name("ROLE_ADMIN").description("Administrator with full access").build()));

        Role doctorRole = roleRepository.findByName("ROLE_DOCTOR").orElseGet(() ->
                roleRepository.save(Role.builder().name("ROLE_DOCTOR").description("Medical Doctor").build()));

        Role receptionistRole = roleRepository.findByName("ROLE_RECEPTIONIST").orElseGet(() ->
                roleRepository.save(Role.builder().name("ROLE_RECEPTIONIST").description("Front Desk Receptionist").build()));

        Role patientRole = roleRepository.findByName("ROLE_PATIENT").orElseGet(() ->
                roleRepository.save(Role.builder().name("ROLE_PATIENT").description("Registered Patient").build()));

        // 2. Seed Menus
        Menu mDashboard = menuRepository.findByPath("/dashboard").orElseGet(() ->
                menuRepository.save(Menu.builder().title("Dashboard").path("/dashboard").icon("LayoutDashboard").sortOrder(1).build()));

        Menu mUsers = menuRepository.findByPath("/users").orElseGet(() ->
                menuRepository.save(Menu.builder().title("User Management").path("/users").icon("Users").sortOrder(2).build()));

        Menu mRoleMenus = menuRepository.findByPath("/role-menus").orElseGet(() ->
                menuRepository.save(Menu.builder().title("Role & Menu Config").path("/role-menus").icon("ShieldCheck").sortOrder(3).build()));

        Menu mPatients = menuRepository.findByPath("/patients").orElseGet(() ->
                menuRepository.save(Menu.builder().title("Patients Database").path("/patients").icon("UserPlus").sortOrder(4).build()));

        Menu mDoctors = menuRepository.findByPath("/doctors").orElseGet(() ->
                menuRepository.save(Menu.builder().title("Doctor Information").path("/doctors").icon("Stethoscope").sortOrder(5).build()));

        Menu mAppointments = menuRepository.findByPath("/appointments").orElseGet(() ->
                menuRepository.save(Menu.builder().title("Appointments").path("/appointments").icon("Calendar").sortOrder(6).build()));

        Menu mRequests = menuRepository.findByPath("/appointment-requests").orElseGet(() ->
                menuRepository.save(Menu.builder().title("Appointment Requests").path("/appointment-requests").icon("ClipboardList").sortOrder(7).build()));

        // 3. Seed Role-Menu relationships
        seedRoleMenusIfEmpty(adminRole, List.of(mDashboard, mUsers, mRoleMenus, mPatients, mDoctors, mAppointments, mRequests));
        seedRoleMenusIfEmpty(doctorRole, List.of(mDashboard, mPatients, mDoctors, mAppointments, mRequests));
        seedRoleMenusIfEmpty(receptionistRole, List.of(mDashboard, mPatients, mDoctors, mAppointments, mRequests));
        seedRoleMenusIfEmpty(patientRole, List.of(mDashboard, mDoctors, mAppointments, mRequests));

        // 4. Seed Default Users
        if (!userRepository.existsByUsername("admin")) {
            userRepository.save(User.builder()
                    .username("admin")
                    .password(passwordEncoder.encode("admin123"))
                    .fullName("Super Admin")
                    .email("admin@clinic.com")
                    .phone("+1 555-0100")
                    .role(adminRole)
                    .active(true)
                    .build());
        }

        if (!userRepository.existsByUsername("doctor")) {
            userRepository.save(User.builder()
                    .username("doctor")
                    .password(passwordEncoder.encode("doctor123"))
                    .fullName("Dr. Sarah Jenkins")
                    .email("dr.jenkins@clinic.com")
                    .phone("+1 555-0200")
                    .role(doctorRole)
                    .active(true)
                    .build());
        }

        if (!userRepository.existsByUsername("receptionist")) {
            userRepository.save(User.builder()
                    .username("receptionist")
                    .password(passwordEncoder.encode("rec123"))
                    .fullName("Emma Watson")
                    .email("reception@clinic.com")
                    .phone("+1 555-0300")
                    .role(receptionistRole)
                    .active(true)
                    .build());
        }

        // 5. Seed Sample Doctors
        if (doctorRepository.count() == 0) {
            Doctor doc1 = doctorRepository.save(Doctor.builder()
                    .fullName("Dr. Sarah Jenkins")
                    .specialization("Cardiology")
                    .qualification("MD, FACC")
                    .email("dr.jenkins@clinic.com")
                    .phone("+1 555-0200")
                    .roomNo("Suite 301")
                    .consultationFee(150.0)
                    .workingHours("Mon-Fri 09:00 - 16:00")
                    .active(true)
                    .build());

            Doctor doc2 = doctorRepository.save(Doctor.builder()
                    .fullName("Dr. Robert Chen")
                    .specialization("Neurology")
                    .qualification("MBBS, MD (Neurology)")
                    .email("chen@clinic.com")
                    .phone("+1 555-0201")
                    .roomNo("Suite 405")
                    .consultationFee(180.0)
                    .workingHours("Mon-Thu 10:00 - 17:00")
                    .active(true)
                    .build());

            Doctor doc3 = doctorRepository.save(Doctor.builder()
                    .fullName("Dr. Emily Taylor")
                    .specialization("Pediatrics")
                    .qualification("MD (Pediatrics)")
                    .email("taylor@clinic.com")
                    .phone("+1 555-0202")
                    .roomNo("Suite 102")
                    .consultationFee(120.0)
                    .workingHours("Tue-Sat 08:30 - 15:30")
                    .active(true)
                    .build());

            // 6. Seed Sample Patients
            if (patientRepository.count() == 0) {
                Patient p1 = patientRepository.save(Patient.builder()
                        .fullName("John Doe")
                        .age(38)
                        .gender("Male")
                        .phone("+1 555-9001")
                        .email("john.doe@gmail.com")
                        .address("123 Elm Street, Cityville")
                        .bloodGroup("O+")
                        .medicalHistory("Hypertension, Seasonal allergies")
                        .build());

                Patient p2 = patientRepository.save(Patient.builder()
                        .fullName("Alice Smith")
                        .age(29)
                        .gender("Female")
                        .phone("+1 555-9002")
                        .email("alice.smith@gmail.com")
                        .address("456 Oak Avenue, Metropolis")
                        .bloodGroup("A+")
                        .medicalHistory("No chronic condition")
                        .build());

                // Seed Sample Appointments
                appointmentRepository.save(Appointment.builder()
                        .doctor(doc1)
                        .patient(p1)
                        .appointmentDate(LocalDate.now())
                        .timeSlot("10:00 AM - 10:30 AM")
                        .status(Appointment.AppointmentStatus.SCHEDULED)
                        .reason("Regular cardiac checkup")
                        .build());

                appointmentRepository.save(Appointment.builder()
                        .doctor(doc2)
                        .patient(p2)
                        .appointmentDate(LocalDate.now().plusDays(1))
                        .timeSlot("02:00 PM - 02:30 PM")
                        .status(Appointment.AppointmentStatus.SCHEDULED)
                        .reason("Migraine consultation")
                        .build());

                // Seed Sample Appointment Requests
                appointmentRequestRepository.save(AppointmentRequest.builder()
                        .patientName("Michael Brown")
                        .patientPhone("+1 555-9003")
                        .patientEmail("michael.b@gmail.com")
                        .doctor(doc3)
                        .preferredDate(LocalDate.now().plusDays(2))
                        .preferredTime("11:00 AM")
                        .reason("Child routine vaccination checkup")
                        .status(AppointmentRequest.RequestStatus.PENDING)
                        .build());
            }
        }
    }

    private void seedRoleMenusIfEmpty(Role role, List<Menu> menus) {
        if (roleMenuRepository.findByRoleId(role.getId()).isEmpty()) {
            for (Menu menu : menus) {
                roleMenuRepository.save(RoleMenu.builder().role(role).menu(menu).build());
            }
        }
    }
}
