
import { format, startOfMonth, endOfMonth, parseISO, subMonths, isWeekend } from "date-fns";
import { fr } from "date-fns/locale";
import * as XLSX from 'xlsx';

export const leaveTypeTranslations: { [key: string]: string } = {
  "vacation": "Congés payés",
  "annual": "Congé annuel",
  "rtt": "RTT",
  "paternity": "Congé paternité",
  "maternity": "Congé maternité",
  "sickChild": "Congé enfant malade",
  "unpaidUnexcused": "Absence injustifiée non rémunérée",
  "unpaidExcused": "Absence justifiée non rémunérée",
  "unpaid": "Absence non rémunérée",
  "familyEvent": "Absences pour événements familiaux",
  "sickLeave": "Arrêt maladie"
};

export const getLastTwelveMonths = () => {
  const months = [];
  for (let i = 0; i < 12; i++) {
    const date = subMonths(new Date(), i);
    months.push({
      value: format(date, 'yyyy-MM'),
      label: format(date, 'MMMM yyyy', { locale: fr })
    });
  }
  return months;
};

export const formatDuration = (minutes: number) => {
  const hours = Math.floor(minutes / 60);
  const remainingMinutes = minutes % 60;
  return `${hours}h${String(remainingMinutes).padStart(2, '0')}`;
};

export const calculateWorkingDays = (startDate: Date, endDate: Date) => {
  let workingDays = 0;
  let currentDate = new Date(startDate);
  
  while (currentDate <= endDate) {
    if (!isWeekend(currentDate)) {
      workingDays++;
    }
    
    currentDate.setDate(currentDate.getDate() + 1);
  }
  
  return workingDays;
};

export const applyExcelStyling = (worksheet: XLSX.WorkSheet, data: any[]) => {
  const HEADER_FILL = "4472C4";
  const HEADER_FONT = "FFFFFF";
  const EVEN_ROW_FILL = "E9EFF8";
  const ODD_ROW_FILL = "FFFFFF";
  const ACCENT_FONT = "2F75B5";
  const WARNING_FONT = "C00000";
  const BORDER_COLOR = "D0D7E5";

  const range = XLSX.utils.decode_range(worksheet['!ref'] || 'A1');
  
  for (let col = range.s.c; col <= range.e.c; col++) {
    const cellRef = XLSX.utils.encode_cell({ r: 0, c: col });
    if (!worksheet[cellRef]) continue;
    
    worksheet[cellRef].s = {
      font: { bold: true, color: { rgb: HEADER_FONT }, sz: 12 },
      fill: { fgColor: { rgb: HEADER_FILL } },
      alignment: { horizontal: "center", vertical: "center", wrapText: true },
      border: {
        top: { style: "thin", color: { rgb: BORDER_COLOR } },
        bottom: { style: "thin", color: { rgb: BORDER_COLOR } },
        left: { style: "thin", color: { rgb: BORDER_COLOR } },
        right: { style: "thin", color: { rgb: BORDER_COLOR } }
      }
    };
  }

  worksheet['!freeze'] = { xSplit: 0, ySplit: 1 };

  for (let row = 1; row <= data.length; row++) {
    const isEvenRow = row % 2 === 0;
    const fillColor = isEvenRow ? EVEN_ROW_FILL : ODD_ROW_FILL;

    for (let col = range.s.c; col <= range.e.c; col++) {
      const cellRef = XLSX.utils.encode_cell({ r: row, c: col });
      if (!worksheet[cellRef]) continue;
      
      worksheet[cellRef].s = {
        fill: { fgColor: { rgb: fillColor } },
        border: {
          top: { style: "thin", color: { rgb: BORDER_COLOR } },
          bottom: { style: "thin", color: { rgb: BORDER_COLOR } },
          left: { style: "thin", color: { rgb: BORDER_COLOR } },
          right: { style: "thin", color: { rgb: BORDER_COLOR } }
        },
        alignment: { horizontal: "left", vertical: "center", wrapText: true }
      };
      
      const colHeader = Object.keys(data[0])[col];
      if (
        colHeader.includes("Jours") || 
        colHeader.includes("Titres") || 
        colHeader.includes("Heures") ||
        colHeader.includes("Retards") ||
        colHeader.includes("minutes")
      ) {
        worksheet[cellRef].s.alignment = { 
          horizontal: "center", 
          vertical: "center" 
        };
        
        if (
          colHeader === "Titres restaurant" || 
          colHeader === "Heures supplémentaires" ||
          colHeader === "Jours travaillés"
        ) {
          worksheet[cellRef].s.font = { 
            color: { rgb: ACCENT_FONT },
            bold: true
          };
        }
      }

      if (colHeader === "Nom" || colHeader === "Prénom") {
        worksheet[cellRef].s.font = { bold: true };
      }
    }
  }
  
  for (let row = 1; row <= data.length; row++) {
    const absenceCellRef = XLSX.utils.encode_cell({ 
      r: row, 
      c: Object.keys(data[0]).findIndex(key => key === "Jours d'absence") 
    });
    
    if (
      worksheet[absenceCellRef] && 
      parseFloat(String(worksheet[absenceCellRef].v)) > 0
    ) {
      worksheet[absenceCellRef].s = {
        ...worksheet[absenceCellRef].s,
        font: { bold: true, color: { rgb: WARNING_FONT } }
      };
    }
    
    const delayCellRef = XLSX.utils.encode_cell({ 
      r: row, 
      c: Object.keys(data[0]).findIndex(key => key === "Retards cumulés (minutes)") 
    });
    
    if (
      worksheet[delayCellRef] && 
      parseFloat(String(worksheet[delayCellRef].v)) > 0
    ) {
      worksheet[delayCellRef].s = {
        ...worksheet[delayCellRef].s,
        font: { bold: true, color: { rgb: WARNING_FONT } }
      };
    }
  }
};
