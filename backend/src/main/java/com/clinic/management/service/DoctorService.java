package com.clinic.management.service;

import com.clinic.management.entity.Doctor;
import com.clinic.management.entity.User;
import com.clinic.management.repository.DoctorRepository;
import com.clinic.management.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.security.access.AccessDeniedException;
import org.springframework.security.core.Authentication;
import org.springframework.stereotype.Service;

import java.util.List;
import java.util.Optional;

@Service
@RequiredArgsConstructor
public class DoctorService {

    private final DoctorRepository doctorRepository;
    private final UserRepository userRepository;

    public List<Doctor> getAllDoctors(Boolean activeOnly) {
        if (Boolean.TRUE.equals(activeOnly)) {
            return doctorRepository.findByActiveTrue();
        }
        return doctorRepository.findAll();
    }

    public Optional<Doctor> getDoctorById(Long id) {
        return doctorRepository.findById(id);
    }

    private void resolveUserLink(Doctor doctor) {
        if (doctor.getUser() != null && doctor.getUser().getId() != null) {
            userRepository.findById(doctor.getUser().getId()).ifPresent(doctor::setUser);
        } else if (doctor.getUser() == null) {
            if (doctor.getEmail() != null && !doctor.getEmail().isBlank()) {
                userRepository.findByEmail(doctor.getEmail()).ifPresent(doctor::setUser);
            }
            if (doctor.getUser() == null && doctor.getPhone() != null && !doctor.getPhone().isBlank()) {
                userRepository.findAll().stream()
                        .filter(u -> doctor.getPhone().equals(u.getPhone()))
                        .findFirst()
                        .ifPresent(doctor::setUser);
            }
        }
    }

    public Doctor createDoctor(Doctor doctor) {
        resolveUserLink(doctor);
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
                    boolean matchesUser = doctor.getUser() != null && currentUser.getId().equals(doctor.getUser().getId());
                    if (!matchesEmail && !matchesName && !matchesUser) {
                        throw new AccessDeniedException("Doctors are only permitted to update their own profile.");
                    }
                }
            }
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
            if (updatedDoctor.getUser() != null && updatedDoctor.getUser().getId() != null) {
                userRepository.findById(updatedDoctor.getUser().getId()).ifPresent(doctor::setUser);
            }
        }
        doctor.setWorkingHours(updatedDoctor.getWorkingHours());
        doctor.setProfileImage(updatedDoctor.getProfileImage());
        doctor.setActive(updatedDoctor.isActive());

        if (doctor.getUser() == null) {
            resolveUserLink(doctor);
        }

        return doctorRepository.save(doctor);
    }

    public void deleteDoctor(Long id) {
        doctorRepository.deleteById(id);
    }
}
