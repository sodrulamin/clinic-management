package com.clinic.management.dto;

import lombok.Data;

@Data
public class PrescriptionRequest {
    private Long appointmentId;
    private String diagnosis;
    private String medicines;
    private String advice;
    private Double discount;
}
