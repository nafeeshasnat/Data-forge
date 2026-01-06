'use client';

import { createContext, useContext, useState, ReactNode } from 'react';

interface AttendanceImpactContextType {
  attendanceImpact: number;
  setAttendanceImpact: (value: number) => void;
}

const AttendanceImpactContext = createContext<AttendanceImpactContextType | undefined>(undefined);

export const AttendanceImpactProvider = ({ children }: { children: ReactNode }) => {
  const [attendanceImpact, setAttendanceImpact] = useState(0.2);

  return (
    <AttendanceImpactContext.Provider value={{ attendanceImpact, setAttendanceImpact }}>
      {children}
    </AttendanceImpactContext.Provider>
  );
};

export const useAttendanceImpact = () => {
  const context = useContext(AttendanceImpactContext);
  if (context === undefined) {
    throw new Error('useAttendanceImpact must be used within an AttendanceImpactProvider');
  }
  return context;
};
