package com.clinic.management.service;

import com.clinic.management.entity.User;
import com.clinic.management.repository.RoleMenuRepository;
import com.clinic.management.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.stereotype.Service;

@Service("securityService")
@RequiredArgsConstructor
public class SecurityService {

    private final UserRepository userRepository;
    private final RoleMenuRepository roleMenuRepository;

    /**
     * Dynamically verifies if the currently authenticated user's role is granted
     * permission for the specified menu path based on the database role_menus configuration.
     *
     * @param menuPath Path corresponding to menu, e.g. "/users", "/doctors", "/patients", "/appointments"
     * @return true if access is permitted; false otherwise
     */
    public boolean hasAccess(String menuPath) {
        Authentication auth = SecurityContextHolder.getContext().getAuthentication();
        if (auth == null || !auth.isAuthenticated() || "anonymousUser".equals(auth.getPrincipal())) {
            return false;
        }

        String username = auth.getName();
        User user = userRepository.findByUsername(username).orElse(null);
        if (user == null || user.getRole() == null) {
            return false;
        }

        // ROLE_ADMIN always has full administrative access
        if ("ROLE_ADMIN".equalsIgnoreCase(user.getRole().getName())) {
            return true;
        }

        // Check if the user's role is granted permission to access menuPath in database
        Long roleId = user.getRole().getId();
        return roleMenuRepository.findMenusByRoleId(roleId).stream()
                .anyMatch(menu -> menu.getPath() != null && menu.getPath().equalsIgnoreCase(menuPath));
    }
}
