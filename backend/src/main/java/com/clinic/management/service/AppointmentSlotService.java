package com.clinic.management.service;

import com.clinic.management.entity.Appointment;
import com.clinic.management.entity.AppointmentRequest;
import com.clinic.management.entity.Doctor;
import com.clinic.management.repository.AppointmentRepository;
import com.clinic.management.repository.AppointmentRequestRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

import java.time.LocalDate;
import java.time.LocalTime;
import java.time.format.DateTimeFormatter;
import java.util.List;
import java.util.regex.Matcher;
import java.util.regex.Pattern;

@Service
@RequiredArgsConstructor
public class AppointmentSlotService {

    private final AppointmentRepository appointmentRepository;
    private final AppointmentRequestRepository requestRepository;

    public String determineNextAvailableSlot(Doctor doctor, LocalDate date) {
        LocalTime startTime = LocalTime.of(9, 0);
        LocalTime endTime = LocalTime.of(17, 0);

        if (doctor.getWorkingHours() != null && !doctor.getWorkingHours().isBlank()) {
            try {
                Pattern pattern = Pattern.compile("(\\d{1,2}:\\d{2})\\s*-\\s*(\\d{1,2}:\\d{2})");
                Matcher matcher = pattern.matcher(doctor.getWorkingHours());
                if (matcher.find()) {
                    startTime = LocalTime.parse(matcher.group(1));
                    endTime = LocalTime.parse(matcher.group(2));
                }
            } catch (Exception ignored) {
            }
        }

        List<Appointment> existingAppointments = appointmentRepository.findByDoctorIdAndAppointmentDate(doctor.getId(), date)
                .stream()
                .filter(a -> a.getStatus() != Appointment.AppointmentStatus.CANCELLED)
                .toList();

        List<AppointmentRequest> existingRequests = requestRepository.findByDoctorIdAndPreferredDate(doctor.getId(), date)
                .stream()
                .filter(r -> r.getStatus() != AppointmentRequest.RequestStatus.REJECTED)
                .toList();

        int duration = (doctor.getAppointmentDurationMinutes() != null && doctor.getAppointmentDurationMinutes() > 0)
                ? doctor.getAppointmentDurationMinutes()
                : 20;

        LocalTime lastEndTime = startTime;

        for (Appointment app : existingAppointments) {
            LocalTime end = extractEndTime(app.getTimeSlot(), duration);
            if (end != null && end.isAfter(lastEndTime)) {
                lastEndTime = end;
            }
        }

        for (AppointmentRequest req : existingRequests) {
            LocalTime end = extractEndTime(req.getPreferredTime(), duration);
            if (end != null && end.isAfter(lastEndTime)) {
                lastEndTime = end;
            }
        }

        LocalTime newSlotStart = lastEndTime;
        LocalTime newSlotEnd = newSlotStart.plusMinutes(duration);

        String workingHoursDisplay = doctor.getWorkingHours() != null && !doctor.getWorkingHours().isBlank()
                ? doctor.getWorkingHours()
                : "09:00 - 17:00";

        if (newSlotEnd.isAfter(endTime)) {
            throw new RuntimeException("No available appointment slots remaining for " + doctor.getFullName() + " on " + date + ". Doctor working hours: " + workingHoursDisplay + ".");
        }

        DateTimeFormatter timeFormatter = DateTimeFormatter.ofPattern("hh:mm a");
        return newSlotStart.format(timeFormatter) + " - " + newSlotEnd.format(timeFormatter);
    }

    private LocalTime extractEndTime(String timeSlotStr, int defaultDuration) {
        if (timeSlotStr == null || timeSlotStr.isBlank()) return null;
        try {
            String[] parts = timeSlotStr.split("-");
            if (parts.length == 2) {
                return parseTimeQuietly(parts[1].trim());
            } else if (parts.length == 1) {
                LocalTime start = parseTimeQuietly(parts[0].trim());
                return start != null ? start.plusMinutes(defaultDuration) : null;
            }
        } catch (Exception ignored) {
        }
        return null;
    }

    private boolean isSlotOccupied(LocalTime slotStart, LocalTime slotEnd, List<Appointment> appointments, List<AppointmentRequest> requests) {
        for (Appointment app : appointments) {
            if (doesSlotOverlap(slotStart, slotEnd, app.getTimeSlot())) {
                return true;
            }
        }

        for (AppointmentRequest req : requests) {
            if (doesSlotOverlap(slotStart, slotEnd, req.getPreferredTime())) {
                return true;
            }
        }

        return false;
    }

    private boolean doesSlotOverlap(LocalTime slotStart, LocalTime slotEnd, String existingTimeSlotStr) {
        if (existingTimeSlotStr == null || existingTimeSlotStr.isBlank()) return false;

        DateTimeFormatter amPmFormatter = DateTimeFormatter.ofPattern("hh:mm a");
        String formattedStart = slotStart.format(amPmFormatter);

        if (existingTimeSlotStr.equalsIgnoreCase(formattedStart)) {
            return true;
        }

        try {
            String[] parts = existingTimeSlotStr.split("-");
            if (parts.length == 2) {
                LocalTime exStart = parseTimeQuietly(parts[0].trim());
                LocalTime exEnd = parseTimeQuietly(parts[1].trim());
                if (exStart != null && exEnd != null) {
                    return slotStart.isBefore(exEnd) && slotEnd.isAfter(exStart);
                }
            } else if (parts.length == 1) {
                LocalTime exStart = parseTimeQuietly(parts[0].trim());
                if (exStart != null) {
                    LocalTime exEnd = exStart.plusMinutes(20);
                    return slotStart.isBefore(exEnd) && slotEnd.isAfter(exStart);
                }
            }
        } catch (Exception ignored) {
        }

        return false;
    }

    private LocalTime parseTimeQuietly(String timeStr) {
        try {
            return LocalTime.parse(timeStr, DateTimeFormatter.ofPattern("hh:mm a"));
        } catch (Exception e1) {
            try {
                return LocalTime.parse(timeStr, DateTimeFormatter.ofPattern("h:mm a"));
            } catch (Exception e2) {
                try {
                    return LocalTime.parse(timeStr, DateTimeFormatter.ofPattern("HH:mm"));
                } catch (Exception e3) {
                    try {
                        return LocalTime.parse(timeStr, DateTimeFormatter.ofPattern("H:mm"));
                    } catch (Exception e4) {
                        return null;
                    }
                }
            }
        }
    }
}
