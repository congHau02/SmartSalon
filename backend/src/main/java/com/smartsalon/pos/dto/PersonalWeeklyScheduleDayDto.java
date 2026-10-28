package com.smartsalon.pos.dto;

import com.fasterxml.jackson.annotation.JsonFormat;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDate;
import java.time.LocalTime;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class PersonalWeeklyScheduleDayDto {
    private LocalDate date;
    private String dayOfWeek; // T2, T3, T4, T5, T6, T7, CN
    private String shiftCode;
    private String shiftName;
    @JsonFormat(pattern = "HH:mm")
    private LocalTime shiftStartTime;
    @JsonFormat(pattern = "HH:mm")
    private LocalTime shiftEndTime;
    private Boolean isWorking;
    private String attendanceStatus;
}
