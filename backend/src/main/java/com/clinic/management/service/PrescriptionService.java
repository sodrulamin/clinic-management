package com.clinic.management.service;

import com.clinic.management.dto.PrescriptionDiagnosisDto;
import com.clinic.management.dto.PrescriptionRequest;
import com.clinic.management.entity.*;
import com.clinic.management.entity.PrescriptionDiagnosis.DiscountType;
import com.clinic.management.repository.*;
import lombok.RequiredArgsConstructor;
import org.springframework.security.core.Authentication;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.ArrayList;
import java.util.List;
import java.util.Optional;

@Service
@RequiredArgsConstructor
public class PrescriptionService {

    private final PrescriptionRepository prescriptionRepository;
    private final AppointmentRepository appointmentRepository;
    private final UserRepository userRepository;
    private final DiagnosisRepository diagnosisRepository;
    private final PrescriptionDiagnosisRepository prescriptionDiagnosisRepository;

    @Transactional
    public Prescription createOrUpdatePrescription(PrescriptionRequest request, Authentication authentication) {
        // --- Auth check ---
        if (authentication != null) {
            User user = userRepository.findByUsername(authentication.getName()).orElse(null);
            if (user == null || user.getRole() == null || !"ROLE_DOCTOR".equals(user.getRole().getName())) {
                throw new RuntimeException("Only doctors are allowed to write prescriptions.");
            }
        }

        // --- Load appointment ---
        Appointment appointment = appointmentRepository.findById(request.getAppointmentId())
                .orElseThrow(() -> new RuntimeException("Appointment not found"));

        Doctor doctor = appointment.getDoctor();

        if (request.getMedicines() == null || request.getMedicines().isBlank()) {
            throw new RuntimeException("Prescription medicines list cannot be empty.");
        }

        // --- Validate & build PrescriptionDiagnosis list ---
        List<PrescriptionDiagnosis> diagnosisList = new ArrayList<>();
        if (request.getDiagnoses() != null && !request.getDiagnoses().isEmpty()) {
            int order = 0;
            for (PrescriptionDiagnosisDto dto : request.getDiagnoses()) {
                DiscountType dtype = parseDiscountType(dto.getDiscountType());
                double dvalue = dto.getDiscountValue() != null ? dto.getDiscountValue() : 0.0;

                // Resolve diagnosis master record
                Diagnosis diagnosisEntity = null;
                String customName = null;
                double price = 0.0;

                if (dto.getDiagnosisId() != null) {
                    diagnosisEntity = diagnosisRepository.findById(dto.getDiagnosisId()).orElse(null);
                    if (diagnosisEntity != null) {
                        price = diagnosisEntity.getPrice() != null ? diagnosisEntity.getPrice() : 0.0;
                    }
                } else {
                    customName = dto.getCustomName();
                }

                // Enforce effective max discount limits (Min of Doctor & Diagnosis cap if configured)
                if (dtype == DiscountType.PERCENT) {
                    double effMaxPct = doctor.getMaxDiscountPercent() != null ? doctor.getMaxDiscountPercent() : 0.0;
                    if (diagnosisEntity != null && diagnosisEntity.getMaxDiscountPercent() != null && diagnosisEntity.getMaxDiscountPercent() > 0) {
                        effMaxPct = Math.min(effMaxPct, diagnosisEntity.getMaxDiscountPercent());
                    }
                    if (dvalue > effMaxPct) {
                        throw new RuntimeException(
                            "Discount " + dvalue + "% exceeds applicable maximum allowed percentage discount of " + effMaxPct + "%.");
                    }
                } else if (dtype == DiscountType.FIXED) {
                    double effMaxFixed = doctor.getMaxDiscountFixed() != null ? doctor.getMaxDiscountFixed() : 0.0;
                    if (diagnosisEntity != null && diagnosisEntity.getMaxDiscountFixed() != null && diagnosisEntity.getMaxDiscountFixed() > 0) {
                        effMaxFixed = Math.min(effMaxFixed, diagnosisEntity.getMaxDiscountFixed());
                    }
                    if (dvalue > effMaxFixed) {
                        throw new RuntimeException(
                            "Discount ৳" + dvalue + " exceeds applicable maximum allowed fixed discount of ৳" + effMaxFixed + ".");
                    }
                }

                PrescriptionDiagnosis pd = PrescriptionDiagnosis.builder()
                        .diagnosis(diagnosisEntity)
                        .customName(customName)
                        .diagnosisPrice(price)
                        .discountType(dtype)
                        .discountValue(dvalue)
                        .sortOrder(order++)
                        .build();
                pd.computeNetPrice();
                diagnosisList.add(pd);
            }
        }

        // --- Apply visiting-fee discount ---
        if (request.getDiscount() != null && request.getDiscount() >= 0) {
            appointment.setDiscount(request.getDiscount());
        }

        // Update appointment status to VISITED
        appointment.setStatus(Appointment.AppointmentStatus.VISITED);
        appointmentRepository.save(appointment);

        // --- Upsert prescription ---
        Optional<Prescription> existing = prescriptionRepository.findByAppointmentId(appointment.getId());
        Prescription prescription;
        if (existing.isPresent()) {
            prescription = existing.get();
            prescription.setDiagnosis(null); // clear legacy field on update
            prescription.setMedicines(request.getMedicines());
            prescription.setAdvice(request.getAdvice());
            
            // Delete old diagnosis items from DB first to ensure clean replacement
            prescriptionDiagnosisRepository.deleteByPrescriptionId(prescription.getId());
            prescription.getPrescriptionDiagnoses().clear();
        } else {
            prescription = Prescription.builder()
                    .appointment(appointment)
                    .doctor(doctor)
                    .patient(appointment.getPatient())
                    .medicines(request.getMedicines())
                    .advice(request.getAdvice())
                    .build();
        }

        prescription = prescriptionRepository.saveAndFlush(prescription);

        // Link each PrescriptionDiagnosis to the prescription
        for (PrescriptionDiagnosis pd : diagnosisList) {
            pd.setPrescription(prescription);
            prescription.getPrescriptionDiagnoses().add(pd);
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

    private DiscountType parseDiscountType(String type) {
        if (type == null) return DiscountType.NONE;
        return switch (type.toUpperCase()) {
            case "PERCENT" -> DiscountType.PERCENT;
            case "FIXED"   -> DiscountType.FIXED;
            default        -> DiscountType.NONE;
        };
    }
}
