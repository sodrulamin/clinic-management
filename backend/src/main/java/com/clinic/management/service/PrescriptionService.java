package com.clinic.management.service;

import com.clinic.management.dto.PrescriptionDiagnosisDto;
import com.clinic.management.dto.PrescriptionMedicineDto;
import com.clinic.management.dto.PrescriptionRequest;
import com.clinic.management.entity.*;
import com.clinic.management.entity.PrescriptionDiagnosis.DiscountType;
import com.clinic.management.repository.*;
import lombok.RequiredArgsConstructor;
import org.springframework.security.core.Authentication;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.*;

@Service
@RequiredArgsConstructor
public class PrescriptionService {

    private final PrescriptionRepository prescriptionRepository;
    private final AppointmentRepository appointmentRepository;
    private final UserRepository userRepository;
    private final DiagnosisRepository diagnosisRepository;
    private final PrescriptionDiagnosisRepository prescriptionDiagnosisRepository;
    private final PrescriptionMedicineRepository prescriptionMedicineRepository;

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

        // --- Build PrescriptionMedicine list ---
        List<PrescriptionMedicine> medicineList = new ArrayList<>();
        if (request.getMedicinesList() != null && !request.getMedicinesList().isEmpty()) {
            int order = 0;
            for (PrescriptionMedicineDto dto : request.getMedicinesList()) {
                if (dto.getName() != null && !dto.getName().isBlank()) {
                    PrescriptionMedicine pm = PrescriptionMedicine.builder()
                            .type(dto.getType() != null && !dto.getType().isBlank() ? dto.getType() : "Tab.")
                            .name(dto.getName().trim())
                            .instruction(dto.getInstruction())
                            .doses(dto.getDoses())
                            .duration(dto.getDuration())
                            .sortOrder(order++)
                            .build();
                    medicineList.add(pm);
                }
            }
        }

        // Legacy summary text string check / generation
        String medicinesSummary = request.getMedicines();
        if ((medicinesSummary == null || medicinesSummary.isBlank()) && !medicineList.isEmpty()) {
            StringBuilder sb = new StringBuilder();
            for (PrescriptionMedicine pm : medicineList) {
                sb.append(pm.getType()).append(" ").append(pm.getName());
                if (pm.getDoses() != null && !pm.getDoses().isBlank()) {
                    sb.append(" - ").append(pm.getDoses());
                }
                if (pm.getDuration() != null && !pm.getDuration().isBlank()) {
                    sb.append(" (").append(pm.getDuration()).append(")");
                }
                if (pm.getInstruction() != null && !pm.getInstruction().isBlank()) {
                    sb.append(" [").append(pm.getInstruction()).append("]");
                }
                sb.append("\n");
            }
            medicinesSummary = sb.toString().trim();
        }
        if (medicinesSummary == null || medicinesSummary.isBlank()) {
            medicinesSummary = "No medicines specified";
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
                        .instructions(dto.getInstructions())
                        .sortOrder(order++)
                        .build();
                pd.computeNetPrice();
                diagnosisList.add(pd);
            }
        }

        // --- Apply reason & visiting-fee discount ---
        if (request.getReason() != null) {
            appointment.setReason(request.getReason());
        }
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
            prescription.setMedicines(medicinesSummary);
            prescription.setAdvice(request.getAdvice());
            
            // Delete old diagnosis and medicine items from DB first to ensure clean replacement
            prescriptionDiagnosisRepository.deleteByPrescriptionId(prescription.getId());
            prescription.getPrescriptionDiagnoses().clear();

            prescriptionMedicineRepository.deleteByPrescriptionId(prescription.getId());
            prescription.getPrescriptionMedicines().clear();
        } else {
            prescription = Prescription.builder()
                    .appointment(appointment)
                    .doctor(doctor)
                    .patient(appointment.getPatient())
                    .medicines(medicinesSummary)
                    .advice(request.getAdvice())
                    .build();
        }

        prescription = prescriptionRepository.saveAndFlush(prescription);

        // Link each PrescriptionDiagnosis to the prescription
        for (PrescriptionDiagnosis pd : diagnosisList) {
            pd.setPrescription(prescription);
            prescription.getPrescriptionDiagnoses().add(pd);
        }

        // Link each PrescriptionMedicine to the prescription
        for (PrescriptionMedicine pm : medicineList) {
            pm.setPrescription(prescription);
            prescription.getPrescriptionMedicines().add(pm);
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

    public List<String> getMedicineSuggestions(String query) {
        String q = query != null ? query.trim() : "";
        List<String> dbResults = prescriptionMedicineRepository.findDistinctNamesByQuery(q);
        Set<String> set = new LinkedHashSet<>(dbResults);

        List<String> defaults = List.of(
            "Napa 500mg", "Napa Extra 500mg/65mg", "Paracetamol 500mg", "Ace 500mg", "Ace Plus 500mg/65mg",
            "Seclo 20mg", "Sergel 20mg", "Maxpro 20mg", "Pantonix 20mg", "Esomeprazole 20mg",
            "Alatrol 10mg", "Fexo 120mg", "Fexo 180mg", "Ceevit 250mg", "Bextram Gold",
            "Tylace 100mg", "Azithrocin 500mg", "Ciprocin 500mg", "Flexi 50mg", "Monas 10mg",
            "Clofenac 50mg", "Entacyd 200ml", "Tofen 1mg/5ml", "Histacin 4mg", "Tavegyl 1mg"
        );

        for (String def : defaults) {
            if (q.isBlank() || def.toLowerCase().contains(q.toLowerCase())) {
                set.add(def);
            }
        }

        return new ArrayList<>(set);
    }

    public List<String> getInstructionSuggestions(String query) {
        String q = query != null ? query.trim() : "";
        List<String> dbResults = prescriptionMedicineRepository.findDistinctInstructionsByQuery(q);
        Set<String> set = new LinkedHashSet<>(dbResults);

        List<String> defaults = List.of(
            "After meal", "Before meal", "At bedtime", "Empty stomach in the morning",
            "With water", "In the morning", "Twice daily after meal", "Three times daily after meal",
            "As needed for pain", "Before sleeping", "After breakfast", "After dinner"
        );

        for (String def : defaults) {
            if (q.isBlank() || def.toLowerCase().contains(q.toLowerCase())) {
                set.add(def);
            }
        }

        return new ArrayList<>(set);
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
