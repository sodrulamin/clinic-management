package com.clinic.management.dto;

import lombok.*;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class CreateDoctorRequest {
    private String fullName;
    private String specialization;
    private String qualification;
    private String phone;
    private String email;
    private String roomNo;
    private Double consultationFee;
    private Double maxDiscountPercent;
    private Double maxDiscountFixed;
    private String workingHours;
    private String profileImage;
    private Integer appointmentDurationMinutes;
    private Boolean active;

    // Doctor user login credentials
    private String username;
    private String password;
}
