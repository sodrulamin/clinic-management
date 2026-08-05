package com.clinic.management.entity;

import jakarta.persistence.*;
import lombok.*;
import java.time.LocalDate;
import java.time.LocalDateTime;

@Entity
@Table(name = "patients")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class Patient {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false, length = 100)
    private String fullName;

    private Integer age;

    @Column(length = 20)
    private String gender;

    @Column(nullable = false, length = 20)
    private String phone;

    @Column(length = 100)
    private String email;

    @Column(length = 255)
    private String address;

    @Column(length = 10)
    private String bloodGroup;

    @Column(columnDefinition = "TEXT")
    private String medicalHistory;

    private LocalDate lastServedDate;

    private LocalDateTime createdAt;

    @PrePersist
    protected void onCreate() {
        this.createdAt = LocalDateTime.now();
    }
}
