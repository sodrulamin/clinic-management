package com.clinic.management.dto;

import lombok.Data;

@Data
public class PrescriptionMedicineDto {
    private String type;        // Tab., Syr., Cap., etc.
    private String name;        // Medicine Name with weight/size
    private String instruction; // e.g. After meal, Before meal
    private String doses;       // e.g. 1+0+1
    private String duration;    // Prescribed Till
    private Integer sortOrder;
}
