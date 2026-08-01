package com.clinic.management.entity;

import jakarta.persistence.*;
import lombok.*;

@Entity
@Table(name = "prescription_diagnoses")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class PrescriptionDiagnosis {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @com.fasterxml.jackson.annotation.JsonIgnore
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "prescription_id", nullable = false)
    private Prescription prescription;

    @ManyToOne(fetch = FetchType.EAGER)
    @JoinColumn(name = "diagnosis_id")
    private Diagnosis diagnosis; // nullable — may be free-text

    @Column(length = 255)
    private String customName; // used when diagnosis is null (free-text entry)

    @Builder.Default
    @Column(nullable = false)
    private Double diagnosisPrice = 0.0; // snapshot of price at prescription time

    @Enumerated(EnumType.STRING)
    @Builder.Default
    @Column(nullable = false, length = 10)
    private DiscountType discountType = DiscountType.NONE;

    @Builder.Default
    @Column(nullable = false)
    private Double discountValue = 0.0; // percent (0-100) or fixed taka amount

    @Builder.Default
    @Column(nullable = false)
    private Double netPrice = 0.0; // computed: price after discount

    @Builder.Default
    @Column(nullable = false)
    private Integer sortOrder = 0;

    public enum DiscountType {
        NONE, PERCENT, FIXED
    }

    /**
     * Returns a display name for this diagnosis line (custom or from master).
     */
    public String getDisplayName() {
        if (diagnosis != null) {
            return diagnosis.getName() + (diagnosis.getCode() != null ? " (" + diagnosis.getCode() + ")" : "");
        }
        return customName != null ? customName : "Unknown";
    }

    /**
     * Computes net price from diagnosisPrice and discount.
     */
    public void computeNetPrice() {
        if (discountType == DiscountType.PERCENT) {
            double discounted = diagnosisPrice * (discountValue / 100.0);
            netPrice = Math.max(0.0, diagnosisPrice - discounted);
        } else if (discountType == DiscountType.FIXED) {
            netPrice = Math.max(0.0, diagnosisPrice - discountValue);
        } else {
            netPrice = diagnosisPrice;
        }
    }
}
