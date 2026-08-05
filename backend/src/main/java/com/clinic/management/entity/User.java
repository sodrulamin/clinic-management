package com.clinic.management.entity;

import jakarta.persistence.*;
import lombok.*;

@Entity
@Table(name = "users")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class User {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(unique = true, nullable = false, length = 50)
    private String username;

    @Column(nullable = false)
    private String password;

    @OneToOne(cascade = CascadeType.ALL, fetch = FetchType.EAGER)
    @JoinColumn(name = "profile_id")
    private UserProfile userProfile;

    @ManyToOne(fetch = FetchType.EAGER)
    @JoinColumn(name = "role_id", nullable = false)
    private Role role;

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
}
