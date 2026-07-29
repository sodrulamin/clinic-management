package com.clinic.management.entity;

import jakarta.persistence.*;
import lombok.*;

@Entity
@Table(name = "role_menus", uniqueConstraints = {
    @UniqueConstraint(columnNames = {"role_id", "menu_id"})
})
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class RoleMenu {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.EAGER)
    @JoinColumn(name = "role_id", nullable = false)
    private Role role;

    @ManyToOne(fetch = FetchType.EAGER)
    @JoinColumn(name = "menu_id", nullable = false)
    private Menu menu;
}
