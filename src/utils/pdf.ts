import jsPDF from "jspdf";
import { format, getDaysInMonth, startOfMonth, startOfWeek, endOfWeek } from "date-fns";
import { fr } from "date-fns/locale";
import { Database } from "@/integrations/supabase/types";

type LeaveRequest = Database["public"]["Tables"]["leave_requests"]["Row"];

interface Employee {
  id: string;
  first_name: string;
  last_name: string;
  position: string;
}

export const generatePlanningPDF = (
  employees: Employee[],
  currentDate: Date,
  leaveRequests: LeaveRequest[],
  viewMode: 'month' | 'week' = 'month'
) => {
  const doc = new jsPDF({
    orientation: "landscape",
    unit: "mm",
    format: "a4"
  });

  const pageWidth = doc.internal.pageSize.getWidth();
  const pageHeight = doc.internal.pageSize.getHeight();
  const margin = 10;
  
  // Title
  doc.setFontSize(16);
  const title = `Planning des absences - ${format(currentDate, viewMode === 'month' ? 'MMMM yyyy' : "'Semaine du' dd MMMM yyyy", { locale: fr })}`;
  doc.text(title, pageWidth / 2, margin + 5, { align: "center" });

  // Calculate days to show
  const firstDay = viewMode === 'month' 
    ? startOfMonth(currentDate)
    : startOfWeek(currentDate, { locale: fr });
  const lastDay = viewMode === 'month'
    ? new Date(firstDay.getFullYear(), firstDay.getMonth() + 1, 0)
    : endOfWeek(currentDate, { locale: fr });
  
  const days = [];
  for (let i = firstDay.getDate(); i <= lastDay.getDate(); i++) {
    days.push(new Date(firstDay.getFullYear(), firstDay.getMonth(), i));
  }

  // Calculate dimensions
  const headerHeight = 20;
  const rowHeight = 10;
  const colWidth = (pageWidth - margin * 2 - 40) / days.length;
  const nameColWidth = 40;

  // Draw header
  doc.setFontSize(8);
  doc.setFont("helvetica", "bold");
  
  days.forEach((date, i) => {
    const x = margin + nameColWidth + (i * colWidth);
    doc.text(format(date, 'dd/MM', { locale: fr }), x + colWidth / 2, margin + headerHeight, { align: "center" });
  });

  // Draw grid and fill data
  doc.setFont("helvetica", "normal");
  employees.forEach((employee, rowIndex) => {
    const y = margin + headerHeight + (rowIndex * rowHeight);
    
    // Draw employee name
    doc.text(`${employee.first_name} ${employee.last_name}`, margin, y + rowHeight / 2);
    
    // Draw cells
    days.forEach((date, colIndex) => {
      const x = margin + nameColWidth + (colIndex * colWidth);
      
      // Draw cell border
      doc.rect(x, y, colWidth, rowHeight);
      
      // Check for leave request
      const leaveRequest = leaveRequests.find(request => {
        const currentDate = format(date, 'yyyy-MM-dd');
        return (
          request.employee_id === employee.id &&
          currentDate >= request.start_date &&
          currentDate <= request.end_date &&
          request.status === 'approved'
        );
      });
      
      if (leaveRequest) {
        const symbol = leaveRequest.day_type === 'half' ? '½' : '✓';
        doc.text(symbol, x + colWidth / 2, y + rowHeight / 2, { align: "center" });
      }
    });
  });

  // Add legend
  const legendY = margin + headerHeight + (employees.length * rowHeight) + 10;
  doc.setFont("helvetica", "bold");
  doc.text("Légende:", margin, legendY);
  doc.setFont("helvetica", "normal");
  doc.text("✓ : Journée complète", margin, legendY + 5);
  doc.text("½ : Demi-journée", margin, legendY + 10);

  // Save the PDF
  doc.save(`planning-${format(currentDate, 'yyyy-MM')}.pdf`);
};