package com.clinic.management.entity;

import jakarta.persistence.*;
import lombok.*;

@Entity
@Table(name = "doctors")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class Doctor {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false, length = 100)
    private String fullName;

    @Column(nullable = false, length = 100)
    private String specialization;

    @Column(length = 150)
    private String qualification;

    @Column(length = 20)
    private String phone;

    @Column(length = 100)
    private String email;

    @Column(length = 50)
    private String roomNo;

    private Double consultationFee;

    @Column(length = 100)
    private String workingHours; // e.g. Mon-Fri 09:00 - 17:00

    @Column(columnDefinition = "LONGTEXT")
    private String profileImage;

    @Builder.Default
    private boolean active = true;
}
