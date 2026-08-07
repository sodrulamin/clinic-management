package com.clinic.management.service;

import com.clinic.management.dto.CreateDoctorRequest;
import com.clinic.management.entity.Doctor;
import com.clinic.management.entity.Role;
import com.clinic.management.entity.User;
import com.clinic.management.entity.UserProfile;
import com.clinic.management.exception.UsernameUnavailableException;
import com.clinic.management.repository.DoctorRepository;
import com.clinic.management.repository.RoleRepository;
import com.clinic.management.repository.UserProfileRepository;
import com.clinic.management.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.security.access.AccessDeniedException;
import org.springframework.security.core.Authentication;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.ArrayList;
import java.util.List;
import java.util.Optional;

@Service
@RequiredArgsConstructor
public class DoctorService {

    private final DoctorRepository doctorRepository;
    private final UserRepository userRepository;
    private final UserProfileRepository userProfileRepository;
    private final RoleRepository roleRepository;
    private final PasswordEncoder passwordEncoder;

    public List<Doctor> getAllDoctors(Boolean activeOnly) {
        if (Boolean.TRUE.equals(activeOnly)) {
            return doctorRepository.findByActiveTrue();
        }
        return doctorRepository.findAll();
    }

    public Optional<Doctor> getDoctorById(Long id) {
        return doctorRepository.findById(id);
    }

    public List<String> generateUsernameSuggestions(String baseUsername) {
        if (baseUsername == null || baseUsername.isBlank()) {
            baseUsername = "doctor";
        }
        String cleanBase = baseUsername.trim().toLowerCase().replaceAll("[^a-z0-9._]", "");
        if (cleanBase.isEmpty()) {
            cleanBase = "doctor";
        }

        List<String> candidates = List.of(
                cleanBase + "1",
                cleanBase + "2",
                cleanBase + "_doc",
                "dr_" + cleanBase,
                cleanBase + "_clinic",
                cleanBase + "2026",
                cleanBase + "99"
        );

        List<String> available = new ArrayList<>();
        for (String cand : candidates) {
            if (!userRepository.existsByUsername(cand)) {
                available.add(cand);
                if (available.size() >= 4) {
                    break;
                }
            }
        }

        int count = 10;
        while (available.size() < 4) {
            String cand = cleanBase + count++;
            if (!userRepository.existsByUsername(cand)) {
                available.add(cand);
            }
        }

        return available;
    }

    @Transactional
    public Doctor createDoctor(CreateDoctorRequest request) {
        // 1. Check Username availability
        String username = request.getUsername();
        if (username == null || username.trim().isBlank()) {
            throw new IllegalArgumentException("Username is required for doctor creation.");
        }
        username = username.trim();
        if (userRepository.existsByUsername(username)) {
            List<String> suggestions = generateUsernameSuggestions(username);
            throw new UsernameUnavailableException(username, suggestions);
        }

        // 2. Basic Password Check
        String password = request.getPassword();
        if (password == null || password.trim().length() < 6) {
            throw new IllegalArgumentException("Password must be at least 6 characters long.");
        }

        // 3. Mandatory Qualification & Phone Checks
        if (request.getQualification() == null || request.getQualification().trim().isBlank()) {
            throw new IllegalArgumentException("Qualification is required.");
        }
        if (request.getPhone() == null || request.getPhone().trim().isBlank()) {
            throw new IllegalArgumentException("Phone number is required.");
        }

        // 4. Save shared UserProfile
        UserProfile userProfile = UserProfile.builder()
                .fullName(request.getFullName())
                .email(request.getEmail())
                .phone(request.getPhone())
                .profileImage(request.getProfileImage())
                .build();
        userProfile = userProfileRepository.save(userProfile);

        // 5. Create User Account for Doctor
        Role doctorRole = roleRepository.findByName("ROLE_DOCTOR")
                .orElseThrow(() -> new RuntimeException("Role ROLE_DOCTOR not found"));

        User user = User.builder()
                .username(username)
                .password(passwordEncoder.encode(password))
                .role(doctorRole)
                .userProfile(userProfile)
                .active(request.getActive() != null ? request.getActive() : true)
                .build();
        userRepository.save(user);

        // 6. Create Doctor Profile
        Doctor doctor = Doctor.builder()
                .userProfile(userProfile)
                .specialization(request.getSpecialization())
                .qualification(request.getQualification())
                .roomNo(request.getRoomNo())
                .consultationFee(request.getConsultationFee() != null ? request.getConsultationFee() : 100.0)
                .maxDiscountPercent(request.getMaxDiscountPercent() != null ? request.getMaxDiscountPercent() : 0.0)
                .maxDiscountFixed(request.getMaxDiscountFixed() != null ? request.getMaxDiscountFixed() : 0.0)
                .workingHours(request.getWorkingHours() != null ? request.getWorkingHours() : "Mon-Fri 09:00 - 17:00")
                .appointmentDurationMinutes(request.getAppointmentDurationMinutes() != null ? request.getAppointmentDurationMinutes() : 20)
                .active(request.getActive() != null ? request.getActive() : true)
                .build();

        return doctorRepository.save(doctor);
    }

    public Doctor updateDoctor(Long id, Doctor updatedDoctor, Authentication authentication) {
        Doctor doctor = doctorRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Doctor not found"));

        boolean isAdmin = authentication != null && authentication.getAuthorities().stream()
                .anyMatch(a -> a.getAuthority().equals("ROLE_ADMIN"));

        if (!isAdmin && authentication != null) {
            User currentUser = userRepository.findByUsername(authentication.getName()).orElse(null);
            if (currentUser != null) {
                if ("ROLE_RECEPTIONIST".equals(currentUser.getRole().getName())) {
                    throw new AccessDeniedException("Receptionists are not permitted to update doctor profiles.");
                }
                if ("ROLE_DOCTOR".equals(currentUser.getRole().getName())) {
                    boolean matchesEmail = currentUser.getEmail() != null && currentUser.getEmail().equalsIgnoreCase(doctor.getEmail());
                    boolean matchesName = currentUser.getFullName() != null && currentUser.getFullName().equalsIgnoreCase(doctor.getFullName());
                    boolean matchesProfile = doctor.getUserProfile() != null && currentUser.getUserProfile() != null && currentUser.getUserProfile().getId().equals(doctor.getUserProfile().getId());
                    if (!matchesEmail && !matchesName && !matchesProfile) {
                        throw new AccessDeniedException("Doctors are only permitted to update their own profile.");
                    }
                }
            }
        }

        if (updatedDoctor.getQualification() == null || updatedDoctor.getQualification().trim().isBlank()) {
            throw new IllegalArgumentException("Qualification is required.");
        }
        if (updatedDoctor.getPhone() == null || updatedDoctor.getPhone().trim().isBlank()) {
            throw new IllegalArgumentException("Phone number is required.");
        }

        doctor.setFullName(updatedDoctor.getFullName());
        doctor.setSpecialization(updatedDoctor.getSpecialization());
        doctor.setQualification(updatedDoctor.getQualification());
        doctor.setPhone(updatedDoctor.getPhone());
        doctor.setEmail(updatedDoctor.getEmail());
        doctor.setRoomNo(updatedDoctor.getRoomNo());
        doctor.setConsultationFee(updatedDoctor.getConsultationFee());
        if (isAdmin) {
            if (updatedDoctor.getMaxDiscountPercent() != null) {
                doctor.setMaxDiscountPercent(updatedDoctor.getMaxDiscountPercent());
            }
            if (updatedDoctor.getMaxDiscountFixed() != null) {
                doctor.setMaxDiscountFixed(updatedDoctor.getMaxDiscountFixed());
            }
        }
        doctor.setWorkingHours(updatedDoctor.getWorkingHours());
        doctor.setProfileImage(updatedDoctor.getProfileImage());
        doctor.setActive(updatedDoctor.isActive());

        return doctorRepository.save(doctor);
    }

    @Transactional
    public void deleteDoctor(Long id) {
        Doctor doctor = doctorRepository.findById(id).orElse(null);
        if (doctor == null) {
            return;
        }

        UserProfile userProfile = doctor.getUserProfile();

        // 1. Delete corresponding User login account(s) automatically
        if (userProfile != null && userProfile.getId() != null) {
            List<User> users = userRepository.findAllByUserProfileId(userProfile.getId());
            if (!users.isEmpty()) {
                userRepository.deleteAll(users);
            }
        } else {
            List<User> usersToDelete = userRepository.findAll().stream()
                    .filter(u -> (doctor.getEmail() != null && !doctor.getEmail().isBlank() && doctor.getEmail().equalsIgnoreCase(u.getEmail())) ||
                            (doctor.getPhone() != null && !doctor.getPhone().isBlank() && doctor.getPhone().equals(u.getPhone())) ||
                            (doctor.getFullName() != null && !doctor.getFullName().isBlank() && doctor.getFullName().equalsIgnoreCase(u.getFullName())))
                    .toList();
            if (!usersToDelete.isEmpty()) {
                userRepository.deleteAll(usersToDelete);
            }
        }

        // 2. Delete Doctor record
        doctorRepository.delete(doctor);

        // 3. Delete associated UserProfile
        if (userProfile != null && userProfile.getId() != null) {
            userProfileRepository.delete(userProfile);
        }
    }
}
