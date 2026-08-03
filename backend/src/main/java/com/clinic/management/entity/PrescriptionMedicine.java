package com.clinic.management.entity;

import com.fasterxml.jackson.annotation.JsonIgnore;
import jakarta.persistence.*;
import lombok.*;

@Entity
@Table(name = "prescription_medicines")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class PrescriptionMedicine {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @JsonIgnore
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "prescription_id", nullable = false)
    private Prescription prescription;

    @Column(length = 50)
    private String type; // e.g. Tab., Syr., Cap., Inj., Drop, Ointment, etc.

    @Column(nullable = false, length = 255)
    private String name; // Medicine Name + weight/size (e.g. Napa 500mg)

    @Column(length = 255)
    private String instruction; // e.g. After meal, Before meal

    @Column(length = 100)
    private String doses; // e.g. 1+0+1, 1+1+1

    @Column(length = 100)
    private String duration; // Prescribed Till / Duration (e.g. 7 Days, 1 Month)

    @Column(name = "sort_order", nullable = false)
    private Integer sortOrder;
}
