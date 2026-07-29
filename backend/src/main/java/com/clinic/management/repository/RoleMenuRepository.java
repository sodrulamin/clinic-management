package com.clinic.management.repository;

import com.clinic.management.entity.Menu;
import com.clinic.management.entity.RoleMenu;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.util.List;

public interface RoleMenuRepository extends JpaRepository<RoleMenu, Long> {
    List<RoleMenu> findByRoleId(Long roleId);
    
    @Query("SELECT rm.menu FROM RoleMenu rm WHERE rm.role.id = :roleId ORDER BY rm.menu.sortOrder ASC")
    List<Menu> findMenusByRoleId(@Param("roleId") Long roleId);

    @Modifying
    @Query("DELETE FROM RoleMenu rm WHERE rm.role.id = :roleId")
    void deleteByRoleId(@Param("roleId") Long roleId);
}
