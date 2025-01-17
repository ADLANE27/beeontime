import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import { format } from 'date-fns';
import { fr } from 'date-fns/locale';

export const generatePlanningPDF = (
  employees: { first_name: string; last_name: string }[],
  days: Date[],
  leaveRequests: any[]
) => {
  // Create new PDF document
  const doc = new jsPDF();
  
  // Add title
  doc.setFontSize(16);
  doc.text('Planning des congés', 14, 15);
  
  // Add month and year
  doc.setFontSize(12);
  doc.text(format(days[0], 'MMMM yyyy', { locale: fr }), 14, 25);

  // Prepare table headers (days of the month)
  const headers = ['Employé', ...days.map(day => format(day, 'dd'))];

  // Prepare table body
  const body = employees.map(employee => {
    const row = [
      `${employee.first_name} ${employee.last_name}`,
      ...days.map(date => {
        const leave = leaveRequests.find(request => 
          request.employee_id === employee.id &&
          format(new Date(request.start_date), 'yyyy-MM-dd') <= format(date, 'yyyy-MM-dd') &&
          format(new Date(request.end_date), 'yyyy-MM-dd') >= format(date, 'yyyy-MM-dd') &&
          request.status === 'approved'
        );
        return leave ? '✓' : '';
      })
    ];
    return row;
  });

  // Generate table
  autoTable(doc, {
    head: [headers],
    body: body,
    startY: 35,
    styles: {
      fontSize: 8,
      cellPadding: 1,
    },
    headStyles: {
      fillColor: [41, 128, 185],
      textColor: 255,
      fontSize: 8,
    },
    theme: 'grid',
  });

  // Save PDF
  doc.save(`planning-${format(days[0], 'MMMM-yyyy', { locale: fr })}.pdf`);
};