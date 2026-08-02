package com.clinic.management.dto;

import lombok.Data;

@Data
public class PrescriptionDiagnosisDto {
    private Long diagnosisId;      // null for free-text custom entry
    private String customName;     // used when diagnosisId is null
    private String discountType;   // "NONE" | "PERCENT" | "FIXED"
    private Double discountValue;  // percent value (0-100) or fixed taka amount
    private String instructions;   // special instructions for diagnosis process
}
