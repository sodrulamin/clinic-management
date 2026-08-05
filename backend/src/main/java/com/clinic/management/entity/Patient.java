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

    @OneToOne(cascade = CascadeType.ALL, fetch = FetchType.EAGER)
    @JoinColumn(name = "profile_id")
    private UserProfile userProfile;

    @Column(length = 10)
    private String bloodGroup;

    @Column(columnDefinition = "TEXT")
    private String medicalHistory;

    private LocalDate lastServedDate;

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

    public Integer getAge() {
        return userProfile != null ? userProfile.getAge() : null;
    }

    public void setAge(Integer age) {
        ensureProfile().setAge(age);
    }

    public String getGender() {
        return userProfile != null ? userProfile.getGender() : null;
    }

    public void setGender(String gender) {
        ensureProfile().setGender(gender);
    }

    public String getPhone() {
        return userProfile != null ? userProfile.getPhone() : null;
    }

    public void setPhone(String phone) {
        ensureProfile().setPhone(phone);
    }

    public String getEmail() {
        return userProfile != null ? userProfile.getEmail() : null;
    }

    public void setEmail(String email) {
        ensureProfile().setEmail(email);
    }

    public String getAddress() {
        return userProfile != null ? userProfile.getAddress() : null;
    }

    public void setAddress(String address) {
        ensureProfile().setAddress(address);
    }

    public LocalDateTime getCreatedAt() {
        return userProfile != null ? userProfile.getCreatedAt() : null;
    }

    public void setCreatedAt(LocalDateTime createdAt) {
        ensureProfile().setCreatedAt(createdAt);
    }
}
