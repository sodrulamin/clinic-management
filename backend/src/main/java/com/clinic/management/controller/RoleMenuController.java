package com.clinic.management.controller;

import com.clinic.management.dto.RoleMenuUpdateRequest;
import com.clinic.management.entity.Menu;
import com.clinic.management.entity.Role;
import com.clinic.management.service.RoleMenuService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/v1/role-menus")
@RequiredArgsConstructor
public class RoleMenuController {

    private final RoleMenuService roleMenuService;

    @GetMapping("/roles")
    @PreAuthorize("@securityService.hasAccess('/role-menus')")
    public ResponseEntity<List<Role>> getAllRoles() {
        return ResponseEntity.ok(roleMenuService.getAllRoles());
    }

    @GetMapping("/menus")
    @PreAuthorize("@securityService.hasAccess('/role-menus')")
    public ResponseEntity<List<Menu>> getAllMenus() {
        return ResponseEntity.ok(roleMenuService.getAllMenus());
    }

    @GetMapping("/role/{roleId}")
    @PreAuthorize("isAuthenticated()")
    public ResponseEntity<List<Menu>> getMenusByRole(@PathVariable Long roleId) {
        return ResponseEntity.ok(roleMenuService.getMenusByRole(roleId));
    }

    @PostMapping("/update")
    @PreAuthorize("@securityService.hasAccess('/role-menus')")
    public ResponseEntity<?> updateRoleMenus(@RequestBody RoleMenuUpdateRequest request) {
        try {
            roleMenuService.updateRoleMenus(request);
            return ResponseEntity.ok("Role menus updated successfully");
        } catch (Exception e) {
            return ResponseEntity.badRequest().body("Error updating role menus: " + e.getMessage());
        }
    }
}
