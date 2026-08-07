package com.clinic.management.dto;

import lombok.*;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class DoctorShiftDto {
    private int shiftIndex;
    private String startTime;
    private String endTime;
    private String displayLabel;
}
