package com.clinic.management.repository;

import com.clinic.management.entity.AppointmentRequest;
import org.springframework.data.jpa.repository.JpaRepository;
import java.time.LocalDate;
import java.util.List;

public interface AppointmentRequestRepository extends JpaRepository<AppointmentRequest, Long> {
    List<AppointmentRequest> findByStatus(AppointmentRequest.RequestStatus status);
    List<AppointmentRequest> findByDoctorIdAndPreferredDate(Long doctorId, LocalDate preferredDate);
    long countByStatus(AppointmentRequest.RequestStatus status);
}
