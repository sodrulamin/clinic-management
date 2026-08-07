package com.clinic.management.service;

import com.clinic.management.dto.DoctorShiftDto;
import com.clinic.management.entity.Appointment;
import com.clinic.management.entity.AppointmentRequest;
import com.clinic.management.entity.Doctor;
import com.clinic.management.repository.AppointmentRepository;
import com.clinic.management.repository.AppointmentRequestRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

import java.time.DayOfWeek;
import java.time.LocalDate;
import java.time.LocalTime;
import java.time.format.DateTimeFormatter;
import java.util.ArrayList;
import java.util.List;
import java.util.regex.Matcher;
import java.util.regex.Pattern;

@Service
@RequiredArgsConstructor
public class AppointmentSlotService {

    private final AppointmentRepository appointmentRepository;
    private final AppointmentRequestRepository requestRepository;

    private static final String[] DAY_SHORTS = {"SUN", "MON", "TUE", "WED", "THU", "FRI", "SAT"};
    private static final String[] DAY_FULLS = {"SUNDAY", "MONDAY", "TUESDAY", "WEDNESDAY", "THURSDAY", "FRIDAY", "SATURDAY"};

    public List<DoctorShiftDto> getDoctorShiftsForDate(Doctor doctor, LocalDate date) {
        List<DoctorShiftDto> shifts = new ArrayList<>();
        if (doctor == null || doctor.getWorkingHours() == null || doctor.getWorkingHours().isBlank()) {
            shifts.add(createShiftDto(1, LocalTime.of(9, 0), LocalTime.of(17, 0)));
            return shifts;
        }

        String scheduleStr = doctor.getWorkingHours().trim();
        DayOfWeek targetDay = date.getDayOfWeek();
        int dayIndex = targetDay.getValue() % 7; // 0=Sunday, 1=Monday, ..., 6=Saturday
        String targetShort = DAY_SHORTS[dayIndex];
        String targetFull = DAY_FULLS[dayIndex];

        String[] groups = scheduleStr.split(";");
        boolean matchedGroup = false;

        for (String group : groups) {
            group = group.trim();
            if (group.isEmpty()) continue;

            String daysPart = "";
            String timesPart = group;

            if (group.contains(":")) {
                String[] parts = group.split(":", 2);
                daysPart = parts[0].trim();
                timesPart = parts[1].trim();
            }

            if (daysPart.isEmpty() || matchesDayOfWeek(daysPart, dayIndex, targetShort, targetFull)) {
                matchedGroup = true;
                List<LocalTime[]> timeRanges = parseTimeRanges(timesPart);
                int idx = 1;
                for (LocalTime[] range : timeRanges) {
                    shifts.add(createShiftDto(idx++, range[0], range[1]));
                }
                break;
            }
        }

        if (!matchedGroup && shifts.isEmpty()) {
            if (!scheduleStr.contains(":")) {
                List<LocalTime[]> timeRanges = parseTimeRanges(scheduleStr);
                int idx = 1;
                for (LocalTime[] range : timeRanges) {
                    shifts.add(createShiftDto(idx++, range[0], range[1]));
                }
            }
        }

        return shifts;
    }

    private DoctorShiftDto createShiftDto(int index, LocalTime start, LocalTime end) {
        DateTimeFormatter formatter = DateTimeFormatter.ofPattern("hh:mm a");
        String periodName;
        int hour = start.getHour();
        if (hour < 12) {
            periodName = "Morning Shift";
        } else if (hour < 17) {
            periodName = "Afternoon Shift";
        } else {
            periodName = "Evening Shift";
        }

        String label = periodName + " (" + start.format(formatter) + " - " + end.format(formatter) + ")";
        return DoctorShiftDto.builder()
                .shiftIndex(index)
                .startTime(start.toString())
                .endTime(end.toString())
                .displayLabel(label)
                .build();
    }

    private boolean matchesDayOfWeek(String daysPart, int targetDayIndex, String targetShort, String targetFull) {
        String str = daysPart.toLowerCase();
        if (str.contains("everyday") || str.contains("daily") || str.contains("all days") || str.contains("7 days")) {
            return true;
        }

        if (str.contains(targetShort.toLowerCase()) || str.contains(targetFull.toLowerCase())) {
            return true;
        }

        for (int startIdx = 0; startIdx < 7; startIdx++) {
            for (int endIdx = 0; endIdx < 7; endIdx++) {
                if (startIdx == endIdx) continue;
                String sShort = DAY_SHORTS[startIdx].toLowerCase();
                String sFull = DAY_FULLS[startIdx].toLowerCase();
                String eShort = DAY_SHORTS[endIdx].toLowerCase();
                String eFull = DAY_FULLS[endIdx].toLowerCase();

                Pattern rangePattern = Pattern.compile("(" + sShort + "|" + sFull + ")\\s*-\\s*(" + eShort + "|" + eFull + ")");
                if (rangePattern.matcher(str).find()) {
                    int i = startIdx;
                    while (true) {
                        if (i == targetDayIndex) return true;
                        if (i == endIdx) break;
                        i = (i + 1) % 7;
                    }
                }
            }
        }

        return false;
    }

    private List<LocalTime[]> parseTimeRanges(String timesStr) {
        List<LocalTime[]> ranges = new ArrayList<>();
        Pattern pattern = Pattern.compile("(\\d{1,2}:\\d{2})\\s*-\\s*(\\d{1,2}:\\d{2})");
        Matcher matcher = pattern.matcher(timesStr);
        while (matcher.find()) {
            try {
                LocalTime start = LocalTime.parse(matcher.group(1));
                LocalTime end = LocalTime.parse(matcher.group(2));
                ranges.add(new LocalTime[]{start, end});
            } catch (Exception ignored) {
            }
        }
        if (ranges.isEmpty()) {
            ranges.add(new LocalTime[]{LocalTime.of(9, 0), LocalTime.of(17, 0)});
        }
        return ranges;
    }

    public String determineNextAvailableSlot(Doctor doctor, LocalDate date) {
        return determineNextAvailableSlot(doctor, date, null);
    }

    public String determineNextAvailableSlot(Doctor doctor, LocalDate date, String targetShift) {
        List<DoctorShiftDto> shifts = getDoctorShiftsForDate(doctor, date);

        if (shifts.isEmpty()) {
            String workingHoursDisplay = doctor.getWorkingHours() != null && !doctor.getWorkingHours().isBlank()
                    ? doctor.getWorkingHours()
                    : "Not specified";
            throw new RuntimeException(doctor.getFullName() + " does not consult on " + date.getDayOfWeek() + " (" + date + "). Doctor schedule: " + workingHoursDisplay);
        }

        DoctorShiftDto selectedShift = shifts.get(0);
        if (targetShift != null && !targetShift.isBlank()) {
            String lowerTarget = targetShift.toLowerCase();
            for (DoctorShiftDto shift : shifts) {
                String lowerLabel = shift.getDisplayLabel().toLowerCase();
                if (shift.getDisplayLabel().equalsIgnoreCase(targetShift) ||
                    String.valueOf(shift.getShiftIndex()).equals(targetShift) ||
                    shift.getStartTime().equalsIgnoreCase(targetShift) ||
                    (lowerTarget.contains("morning") && lowerLabel.contains("morning")) ||
                    (lowerTarget.contains("afternoon") && lowerLabel.contains("afternoon")) ||
                    (lowerTarget.contains("evening") && lowerLabel.contains("evening")) ||
                    lowerTarget.contains("shift " + shift.getShiftIndex())) {
                    selectedShift = shift;
                    break;
                }
            }
        }

        LocalTime startTime = LocalTime.parse(selectedShift.getStartTime());
        LocalTime endTime = LocalTime.parse(selectedShift.getEndTime());

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

        LocalTime currentSlotStart = startTime;

        while (currentSlotStart.plusMinutes(duration).isBefore(endTime) || currentSlotStart.plusMinutes(duration).equals(endTime)) {
            LocalTime currentSlotEnd = currentSlotStart.plusMinutes(duration);

            if (!isSlotOccupied(currentSlotStart, currentSlotEnd, existingAppointments, existingRequests)) {
                DateTimeFormatter timeFormatter = DateTimeFormatter.ofPattern("hh:mm a");
                return currentSlotStart.format(timeFormatter) + " - " + currentSlotEnd.format(timeFormatter);
            }

            currentSlotStart = currentSlotEnd;
        }

        throw new RuntimeException("No available appointment slots remaining in " + selectedShift.getDisplayLabel() + " for " + doctor.getFullName() + " on " + date + ".");
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
