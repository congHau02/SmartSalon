package com.smartsalon.pos.service;

import com.smartsalon.pos.dto.PosAttendanceActionRequest;
import com.smartsalon.pos.dto.PosStaffAttendanceDto;

import java.util.List;

public interface PosAttendanceService {

    List<PosStaffAttendanceDto> getTodayAttendance(Long branchId);

    PosStaffAttendanceDto executeAttendanceAction(PosAttendanceActionRequest request);
}
