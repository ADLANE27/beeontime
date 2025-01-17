import jsPDF from "jspdf";
import { format } from "date-fns";
import { fr } from "date-fns/locale";
import { Database } from "@/integrations/supabase/types";

type LeaveRequest = Database["public"]["Tables"]["leave_requests"]["Row"];

interface Employee {
  id: string;
  first_name: string;
  last_name: string;
}

export const generatePlanningPDF = (
  employees: Employee[],
  currentDate: Date,
  leaveRequests: LeaveRequest[]
) => {
  const doc = new jsPDF({
    orientation: "landscape",
    unit: "mm",
    format: "a4",
  });

  // Set font
  doc.setFont("helvetica");
  
  // Add title
  doc.setFontSize(16);
  const title = `Planning des congés - ${format(currentDate, 'MMMM yyyy', { locale: fr })}`;
  doc.text(title, 15, 15);

  // Calculate table dimensions
  const startY = 30;
  const cellHeight = 10;
  const nameWidth = 50;
  const dayWidth = 7;
  
  // Get days in month
  const daysInMonth = new Date(
    currentDate.getFullYear(),
    currentDate.getMonth() + 1,
    0
  ).getDate();

  // Draw header
  doc.setFontSize(10);
  doc.text("Employés", 15, startY);
  
  // Draw days
  for (let day = 1; day <= daysInMonth; day++) {
    doc.text(
      day.toString(),
      15 + nameWidth + (day - 1) * dayWidth,
      startY
    );
  }

  // Draw employee rows
  employees.forEach((employee, index) => {
    const y = startY + (index + 1) * cellHeight;
    
    // Draw employee name
    doc.text(
      `${employee.first_name} ${employee.last_name}`,
      15,
      y
    );

    // Draw leave requests
    for (let day = 1; day <= daysInMonth; day++) {
      const date = new Date(currentDate.getFullYear(), currentDate.getMonth(), day);
      const formattedDate = format(date, 'yyyy-MM-dd');
      
      const hasLeave = leaveRequests.some(request => 
        request.employee_id === employee.id &&
        formattedDate >= request.start_date &&
        formattedDate <= request.end_date &&
        request.status === 'approved'
      );

      if (hasLeave) {
        doc.text(
          "✓",
          15 + nameWidth + (day - 1) * dayWidth,
          y
        );
      }
    }
  });

  // Save the PDF
  doc.save(`planning-${format(currentDate, 'yyyy-MM')}.pdf`);
};