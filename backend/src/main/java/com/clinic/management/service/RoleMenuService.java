package com.clinic.management.service;

import com.clinic.management.dto.RoleMenuUpdateRequest;
import com.clinic.management.entity.Menu;
import com.clinic.management.entity.Role;
import com.clinic.management.entity.RoleMenu;
import com.clinic.management.repository.MenuRepository;
import com.clinic.management.repository.RoleMenuRepository;
import com.clinic.management.repository.RoleRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.ArrayList;
import java.util.List;

@Service
@RequiredArgsConstructor
public class RoleMenuService {

    private final RoleRepository roleRepository;
    private final MenuRepository menuRepository;
    private final RoleMenuRepository roleMenuRepository;

    public List<Role> getAllRoles() {
        return roleRepository.findAll();
    }

    public List<Menu> getAllMenus() {
        return menuRepository.findAllByOrderBySortOrderAsc();
    }

    public List<Menu> getMenusByRole(Long roleId) {
        return roleMenuRepository.findMenusByRoleId(roleId);
    }

    @Transactional
    public void updateRoleMenus(RoleMenuUpdateRequest request) {
        Role role = roleRepository.findById(request.getRoleId())
                .orElseThrow(() -> new RuntimeException("Role not found with ID: " + request.getRoleId()));

        roleMenuRepository.deleteByRoleId(role.getId());

        if (request.getMenuIds() != null && !request.getMenuIds().isEmpty()) {
            List<RoleMenu> newRoleMenus = new ArrayList<>();
            for (Long menuId : request.getMenuIds()) {
                Menu menu = menuRepository.findById(menuId).orElse(null);
                if (menu != null) {
                    newRoleMenus.add(RoleMenu.builder().role(role).menu(menu).build());
                }
            }
            if (!newRoleMenus.isEmpty()) {
                roleMenuRepository.saveAll(newRoleMenus);
            }
        }
    }
}
