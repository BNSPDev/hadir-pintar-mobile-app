export const WorkHours = {
  MONDAY_TO_THURSDAY: {
    start: { hour: 8, minute: 0 },
    end: { hour: 16, minute: 0 }
  },
  FRIDAY: {
    start: { hour: 8, minute: 0 },
    end: { hour: 16, minute: 30 }
  }
};

export function isWorkingHours(date: Date): boolean {
  const day = date.getDay(); // 0 = Sunday, 1 = Monday, etc.
  const hour = date.getHours();
  const minute = date.getMinutes();
  const totalMinutes = hour * 60 + minute;

  // Weekend (Saturday = 6, Sunday = 0)
  if (day === 0 || day === 6) {
    return false;
  }

  // Monday to Thursday (1-4)
  if (day >= 1 && day <= 4) {
    const startMinutes = WorkHours.MONDAY_TO_THURSDAY.start.hour * 60 + WorkHours.MONDAY_TO_THURSDAY.start.minute;
    const endMinutes = WorkHours.MONDAY_TO_THURSDAY.end.hour * 60 + WorkHours.MONDAY_TO_THURSDAY.end.minute;
    return totalMinutes >= startMinutes && totalMinutes <= endMinutes;
  }

  // Friday (5)
  if (day === 5) {
    const startMinutes = WorkHours.FRIDAY.start.hour * 60 + WorkHours.FRIDAY.start.minute;
    const endMinutes = WorkHours.FRIDAY.end.hour * 60 + WorkHours.FRIDAY.end.minute;
    return totalMinutes >= startMinutes && totalMinutes <= endMinutes;
  }

  return false;
}

export function isLateArrival(date: Date): boolean {
  const day = date.getDay();
  const hour = date.getHours();
  const minute = date.getMinutes();
  const totalMinutes = hour * 60 + minute;

  // Weekend
  if (day === 0 || day === 6) {
    return false;
  }

  // Work start time is 08:00 for all working days
  const workStartMinutes = 8 * 60; // 08:00 in minutes
  return totalMinutes > workStartMinutes;
}

export function getWorkHoursMessage(date: Date): string {
  const day = date.getDay();
  
  if (day === 0 || day === 6) {
    return "Hari ini adalah hari libur (Sabtu/Minggu)";
  }
  
  if (day >= 1 && day <= 4) {
    return "Jam kerja hari ini: 08:00 - 16:00 WIB";
  }
  
  if (day === 5) {
    return "Jam kerja hari ini: 08:00 - 16:30 WIB";
  }
  
  return "";
}

export function getAttendanceMessage(date: Date, isClockIn: boolean): string {
  const isWorking = isWorkingHours(date);
  const isLate = isLateArrival(date);
  const day = date.getDay();

  if (day === 0 || day === 6) {
    return "⚠️ Hari ini adalah hari libur. Apakah Anda yakin ingin melakukan absensi?";
  }

  if (isClockIn) {
    if (isLate) {
      return "⚠️ Anda terlambat dari jam kerja normal. Pastikan untuk datang tepat waktu di hari berikutnya.";
    }
    if (!isWorking) {
      return "ℹ️ Anda melakukan absensi di luar jam kerja normal.";
    }
    return "✅ Absensi masuk berhasil dicatat.";
  } else {
    if (!isWorking) {
      return "ℹ️ Anda melakukan absensi pulang di luar jam kerja normal.";
    }
    return "✅ Absensi pulang berhasil dicatat.";
  }
}