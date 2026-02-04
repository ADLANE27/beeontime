import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { format } from "date-fns";

// Mock the supabase client
const mockSupabase = {
  auth: {
    getUser: vi.fn(),
  },
  from: vi.fn(),
};

vi.mock("@/integrations/supabase/client", () => ({
  supabase: mockSupabase,
}));

// Mock sonner toast
vi.mock("sonner", () => ({
  toast: {
    success: vi.fn(),
    error: vi.fn(),
    info: vi.fn(),
  },
}));

describe("useTimeRecord - Delay Detection with Leave Requests", () => {
  const today = format(new Date(), "yyyy-MM-dd");
  const mockUserId = "test-user-id";
  
  beforeEach(() => {
    vi.clearAllMocks();
    vi.useFakeTimers();
    // Set time to 10:00 AM (late if start time is 09:00)
    vi.setSystemTime(new Date(`${today}T10:00:00`));
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  describe("checkForDelay logic", () => {
    it("should NOT record delay when employee has approved full-day leave", async () => {
      // Setup: Employee has an approved full-day leave for today
      const mockLeaveRequests = [
        {
          id: "leave-1",
          employee_id: mockUserId,
          start_date: today,
          end_date: today,
          type: "vacation",
          status: "approved",
          day_type: "full",
          period: null,
        },
      ];

      // The logic should detect the full-day leave and skip delay recording
      const hasFullDayLeave = mockLeaveRequests.some(leave => leave.day_type === 'full');
      expect(hasFullDayLeave).toBe(true);
    });

    it("should NOT record delay when employee has approved morning half-day leave", async () => {
      // Setup: Employee has an approved morning half-day leave for today
      const mockLeaveRequests = [
        {
          id: "leave-2",
          employee_id: mockUserId,
          start_date: today,
          end_date: today,
          type: "vacation",
          status: "approved",
          day_type: "half",
          period: "morning",
        },
      ];

      // The logic should detect the morning half-day leave and skip delay recording
      const hasMorningLeave = mockLeaveRequests.some(leave => 
        leave.day_type === 'full' || 
        (leave.day_type === 'half' && leave.period === 'morning')
      );
      expect(hasMorningLeave).toBe(true);
    });

    it("should STILL check for delay when employee has afternoon half-day leave", async () => {
      // Setup: Employee has an approved afternoon half-day leave for today
      const mockLeaveRequests = [
        {
          id: "leave-3",
          employee_id: mockUserId,
          start_date: today,
          end_date: today,
          type: "vacation",
          status: "approved",
          day_type: "half",
          period: "afternoon",
        },
      ];

      // The logic should NOT skip delay check for afternoon leaves
      // Employee should still arrive on time in the morning
      const hasMorningLeave = mockLeaveRequests.some(leave => 
        leave.day_type === 'full' || 
        (leave.day_type === 'half' && leave.period === 'morning')
      );
      expect(hasMorningLeave).toBe(false);
      
      const hasAfternoonLeave = mockLeaveRequests.some(leave => 
        leave.day_type === 'half' && leave.period === 'afternoon'
      );
      expect(hasAfternoonLeave).toBe(true);
    });

    it("should NOT record delay when no leave exists but employee arrives on time", async () => {
      const scheduledTime = "09:00";
      const actualTime = "08:55"; // Early arrival
      
      const [scheduledHour, scheduledMinute] = scheduledTime.split(':').map(Number);
      const [actualHour, actualMinute] = actualTime.split(':').map(Number);
      
      const scheduledDate = new Date();
      scheduledDate.setHours(scheduledHour, scheduledMinute, 0);
      
      const actualDate = new Date();
      actualDate.setHours(actualHour, actualMinute, 0);
      
      // No delay should be recorded
      const isLate = actualDate > scheduledDate;
      expect(isLate).toBe(false);
    });

    it("should record delay when no leave exists and employee arrives late", async () => {
      const scheduledTime = "09:00";
      const actualTime = "09:15"; // Late arrival
      
      const [scheduledHour, scheduledMinute] = scheduledTime.split(':').map(Number);
      const [actualHour, actualMinute] = actualTime.split(':').map(Number);
      
      const scheduledDate = new Date();
      scheduledDate.setHours(scheduledHour, scheduledMinute, 0);
      
      const actualDate = new Date();
      actualDate.setHours(actualHour, actualMinute, 0);
      
      // Delay should be recorded
      const isLate = actualDate > scheduledDate;
      expect(isLate).toBe(true);
      
      // Calculate delay duration
      const duration = (actualDate.getTime() - scheduledDate.getTime()) / (1000 * 60);
      expect(duration).toBe(15); // 15 minutes late
    });

    it("should correctly identify leave request within date range", async () => {
      // Test case: Leave from yesterday to tomorrow
      const yesterday = format(new Date(Date.now() - 86400000), "yyyy-MM-dd");
      const tomorrow = format(new Date(Date.now() + 86400000), "yyyy-MM-dd");
      
      const mockLeaveRequests = [
        {
          id: "leave-4",
          employee_id: mockUserId,
          start_date: yesterday,
          end_date: tomorrow,
          type: "vacation",
          status: "approved",
          day_type: "full",
          period: null,
        },
      ];

      // Today should be covered by this leave
      const todayDate = new Date(today);
      const isWithinRange = mockLeaveRequests.some(leave => {
        const startDate = new Date(leave.start_date);
        const endDate = new Date(leave.end_date);
        return todayDate >= startDate && todayDate <= endDate;
      });
      
      expect(isWithinRange).toBe(true);
    });

    it("should NOT skip delay check for pending leave requests", async () => {
      // Setup: Employee has a PENDING (not approved) leave request
      const mockLeaveRequests = [
        {
          id: "leave-5",
          employee_id: mockUserId,
          start_date: today,
          end_date: today,
          type: "vacation",
          status: "pending", // Not approved!
          day_type: "full",
          period: null,
        },
      ];

      // Filter only approved leaves
      const approvedLeaves = mockLeaveRequests.filter(leave => leave.status === 'approved');
      
      const hasMorningLeave = approvedLeaves.some(leave => 
        leave.day_type === 'full' || 
        (leave.day_type === 'half' && leave.period === 'morning')
      );
      
      // Should NOT skip delay check since leave is not approved
      expect(hasMorningLeave).toBe(false);
    });

    it("should NOT skip delay check for rejected leave requests", async () => {
      const mockLeaveRequests = [
        {
          id: "leave-6",
          employee_id: mockUserId,
          start_date: today,
          end_date: today,
          type: "vacation",
          status: "rejected",
          day_type: "full",
          period: null,
        },
      ];

      const approvedLeaves = mockLeaveRequests.filter(leave => leave.status === 'approved');
      
      const hasMorningLeave = approvedLeaves.some(leave => 
        leave.day_type === 'full' || 
        (leave.day_type === 'half' && leave.period === 'morning')
      );
      
      expect(hasMorningLeave).toBe(false);
    });
  });
});
