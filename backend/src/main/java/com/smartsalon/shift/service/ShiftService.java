package com.smartsalon.shift.service;

import com.smartsalon.shift.dto.*;

import java.time.LocalDate;
import java.util.List;

public interface ShiftService {
    List<ShiftTemplateResponse> getTemplates(Long branchId);
    ShiftTemplateResponse createTemplate(ShiftTemplateRequest request);
    ShiftTemplateResponse updateTemplate(Long id, ShiftTemplateRequest request);

    WeeklyRosterResponse getWeeklyRoster(Long branchId, LocalDate startDate, LocalDate endDate);
    List<DailyScheduleCellResponse> updateRoster(UpdateRosterRequest request);
    int copyWeekRoster(CopyWeekRosterRequest request);
}
