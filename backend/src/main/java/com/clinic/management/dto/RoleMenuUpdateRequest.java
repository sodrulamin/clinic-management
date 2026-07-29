package com.clinic.management.dto;

import lombok.*;
import java.util.List;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class RoleMenuUpdateRequest {
    private Long roleId;
    private List<Long> menuIds;
}
