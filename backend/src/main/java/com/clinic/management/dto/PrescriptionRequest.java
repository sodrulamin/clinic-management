package com.clinic.management.dto;

import lombok.Data;
import java.util.List;

@Data
public class PrescriptionRequest {
    private Long appointmentId;
    private List<PrescriptionDiagnosisDto> diagnoses; // structured multi-diagnosis list
    private String medicines;
    private String advice;
    private String reason;   // reason for visit
    private Double discount; // visiting-fee discount (legacy field, still supported)
}
