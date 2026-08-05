package com.clinic.management.scheduler;

import com.clinic.management.entity.Appointment;
import com.clinic.management.repository.AppointmentRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import net.javacrumbs.shedlock.spring.annotation.SchedulerLock;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Component;

import java.time.LocalDate;
import java.util.List;

@Slf4j
@Component
@RequiredArgsConstructor
public class AppointmentScheduler {

    private final AppointmentRepository appointmentRepository;

    /**
     * Executes every minute.
     * ShedLock ensures this task only executes once across clustered nodes.
     */
    @Scheduled(cron = "0 * * * * ?")
    @SchedulerLock(
        name = "AutoCancelUnservedAppointments", 
        lockAtLeastFor = "10s", 
        lockAtMostFor = "50s"
    )
    public void autoCancelUnservedAppointments() {
        log.info("ShedLock Scheduler: Executing auto-cancellation check for past unserved appointments...");
        LocalDate today = LocalDate.now();

        List<Appointment> pastUnserved = appointmentRepository.findByAppointmentDateBeforeAndStatus(
                today, Appointment.AppointmentStatus.SCHEDULED);

        if (!pastUnserved.isEmpty()) {
            for (Appointment app : pastUnserved) {
                app.setStatus(Appointment.AppointmentStatus.CANCELLED);
            }
            appointmentRepository.saveAll(pastUnserved);
            log.info("ShedLock Scheduler [AutoCancelUnservedAppointments]: Successfully auto-cancelled {} past unserved appointments.", pastUnserved.size());
        } else {
            log.info("ShedLock Scheduler [AutoCancelUnservedAppointments]: No past unserved appointments found.");
        }
    }
}
