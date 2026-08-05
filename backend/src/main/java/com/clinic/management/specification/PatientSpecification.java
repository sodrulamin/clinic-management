package com.clinic.management.specification;

import com.clinic.management.entity.Patient;
import jakarta.persistence.criteria.Path;
import jakarta.persistence.criteria.Predicate;
import org.springframework.data.jpa.domain.Specification;

import java.time.LocalDate;
import java.util.ArrayList;
import java.util.List;

public class PatientSpecification {

    public static Specification<Patient> filterPatients(
            String search,
            String name,
            String phone,
            Integer minAge,
            Integer maxAge,
            LocalDate startDate,
            LocalDate endDate,
            String bloodGroup
    ) {
        return (root, query, cb) -> {
            List<Predicate> predicates = new ArrayList<>();
            Path<?> profile = root.get("userProfile");

            // General search term
            if (search != null && !search.isBlank()) {
                String term = "%" + search.trim().toLowerCase() + "%";
                Predicate nameMatch = cb.like(cb.lower(profile.get("fullName")), term);
                Predicate phoneMatch = cb.like(profile.get("phone"), term);
                predicates.add(cb.or(nameMatch, phoneMatch));
            }

            // Specific Patient Name
            if (name != null && !name.isBlank()) {
                predicates.add(cb.like(cb.lower(profile.get("fullName")), "%" + name.trim().toLowerCase() + "%"));
            }

            // Specific Patient Mobile Number
            if (phone != null && !phone.isBlank()) {
                predicates.add(cb.like(profile.get("phone"), "%" + phone.trim() + "%"));
            }

            // Age Range
            if (minAge != null) {
                predicates.add(cb.greaterThanOrEqualTo(profile.get("age"), minAge));
            }
            if (maxAge != null) {
                predicates.add(cb.lessThanOrEqualTo(profile.get("age"), maxAge));
            }

            // Served Date Range
            if (startDate != null) {
                predicates.add(cb.greaterThanOrEqualTo(root.get("lastServedDate"), startDate));
            }
            if (endDate != null) {
                predicates.add(cb.lessThanOrEqualTo(root.get("lastServedDate"), endDate));
            }

            // Blood Group
            if (bloodGroup != null && !bloodGroup.isBlank() && !"ALL".equalsIgnoreCase(bloodGroup)) {
                predicates.add(cb.equal(root.get("bloodGroup"), bloodGroup.trim()));
            }

            return cb.and(predicates.toArray(new Predicate[0]));
        };
    }
}
