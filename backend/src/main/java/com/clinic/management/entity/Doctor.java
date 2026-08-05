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

    @OneToOne(cascade = CascadeType.ALL, fetch = FetchType.EAGER)
    @JoinColumn(name = "profile_id")
    private UserProfile userProfile;

    @Column(nullable = false, length = 100)
    private String specialization;

    @Column(length = 150)
    private String qualification;

    @Column(length = 50)
    private String roomNo;

    private Double consultationFee;

    @Builder.Default
    @Column(nullable = false)
    private Double maxDiscountPercent = 0.0;

    @Builder.Default
    @Column(nullable = false)
    private Double maxDiscountFixed = 0.0;

    @Column(length = 100)
    private String workingHours;

    @Builder.Default
    @Column(nullable = false)
    private Integer appointmentDurationMinutes = 20;

    @Builder.Default
    private boolean active = true;

    private UserProfile ensureProfile() {
        if (this.userProfile == null) {
            this.userProfile = new UserProfile();
        }
        return this.userProfile;
    }

    public String getFullName() {
        return userProfile != null ? userProfile.getFullName() : null;
    }

    public void setFullName(String fullName) {
        ensureProfile().setFullName(fullName);
    }

    public String getEmail() {
        return userProfile != null ? userProfile.getEmail() : null;
    }

    public void setEmail(String email) {
        ensureProfile().setEmail(email);
    }

    public String getPhone() {
        return userProfile != null ? userProfile.getPhone() : null;
    }

    public void setPhone(String phone) {
        ensureProfile().setPhone(phone);
    }

    public String getProfileImage() {
        return userProfile != null ? userProfile.getProfileImage() : null;
    }

    public void setProfileImage(String profileImage) {
        ensureProfile().setProfileImage(profileImage);
    }
}
