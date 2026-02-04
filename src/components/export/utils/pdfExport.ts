/**
 * Génération du PDF récapitulatif pour le comptable
 */

import jsPDF from "jspdf";
import { format } from "date-fns";
import { fr } from "date-fns/locale";
import { ValidationReport } from "./validationHelpers";

const COLORS = {
  primary: [68, 114, 196] as [number, number, number],
  accent: [47, 117, 181] as [number, number, number],
  success: [76, 175, 80] as [number, number, number],
  warning: [255, 152, 0] as [number, number, number],
  error: [244, 67, 54] as [number, number, number],
  gray: [128, 128, 128] as [number, number, number],
  lightGray: [240, 240, 240] as [number, number, number],
  white: [255, 255, 255] as [number, number, number],
  black: [0, 0, 0] as [number, number, number],
};

/**
 * Génère un PDF récapitulatif des éléments de salaires
 */
export const generateSalaryPDF = (report: ValidationReport, companyName: string = "Votre Entreprise"): void => {
  const doc = new jsPDF({
    orientation: "portrait",
    unit: "mm",
    format: "a4"
  });

  const pageWidth = doc.internal.pageSize.getWidth();
  const pageHeight = doc.internal.pageSize.getHeight();
  const margin = 20;
  const contentWidth = pageWidth - (margin * 2);
  let currentY = margin;

  // Helper pour dessiner un rectangle arrondi
  const drawRoundedRect = (x: number, y: number, w: number, h: number, r: number, color: [number, number, number]) => {
    doc.setFillColor(...color);
    doc.roundedRect(x, y, w, h, r, r, 'F');
  };

  // ===== EN-TÊTE =====
  drawRoundedRect(0, 0, pageWidth, 45, 0, COLORS.primary);
  
  doc.setTextColor(...COLORS.white);
  doc.setFontSize(24);
  doc.setFont("helvetica", "bold");
  doc.text("RÉCAPITULATIF PAIE", margin, 22);
  
  doc.setFontSize(14);
  doc.setFont("helvetica", "normal");
  doc.text(report.period.toUpperCase(), margin, 32);
  
  doc.setFontSize(10);
  doc.text(`Généré le ${format(report.generatedAt, 'dd MMMM yyyy à HH:mm', { locale: fr })}`, margin, 40);

  currentY = 55;

  // ===== RÉSUMÉ PRINCIPAL =====
  doc.setTextColor(...COLORS.black);
  doc.setFontSize(12);
  doc.setFont("helvetica", "bold");
  doc.text("📊 RÉSUMÉ DU MOIS", margin, currentY);
  currentY += 8;

  // Cartes de résumé
  const cardWidth = (contentWidth - 10) / 3;
  const cardHeight = 30;

  const summaryCards = [
    { label: "Jours ouvrés", value: String(report.workingDaysInMonth), subtitle: `${report.holidaysInMonth} férié(s) exclu(s)` },
    { label: "Employés", value: String(report.totals.totalEmployees), subtitle: "actifs ce mois" },
    { label: "Titres restaurant", value: String(report.totals.totalMealVouchers), subtitle: "à distribuer" },
  ];

  summaryCards.forEach((card, index) => {
    const x = margin + (index * (cardWidth + 5));
    
    drawRoundedRect(x, currentY, cardWidth, cardHeight, 3, COLORS.lightGray);
    
    doc.setFontSize(9);
    doc.setFont("helvetica", "normal");
    doc.setTextColor(...COLORS.gray);
    doc.text(card.label, x + 5, currentY + 8);
    
    doc.setFontSize(18);
    doc.setFont("helvetica", "bold");
    doc.setTextColor(...COLORS.primary);
    doc.text(card.value, x + 5, currentY + 18);
    
    doc.setFontSize(8);
    doc.setFont("helvetica", "normal");
    doc.setTextColor(...COLORS.gray);
    doc.text(card.subtitle, x + 5, currentY + 25);
  });

  currentY += cardHeight + 15;

  // ===== TABLEAU DES TOTAUX =====
  doc.setTextColor(...COLORS.black);
  doc.setFontSize(12);
  doc.setFont("helvetica", "bold");
  doc.text("📈 TOTAUX PAR CATÉGORIE", margin, currentY);
  currentY += 8;

  // En-tête du tableau
  drawRoundedRect(margin, currentY, contentWidth, 10, 2, COLORS.primary);
  doc.setTextColor(...COLORS.white);
  doc.setFontSize(10);
  doc.setFont("helvetica", "bold");
  doc.text("Catégorie", margin + 5, currentY + 7);
  doc.text("Total", margin + 80, currentY + 7);
  doc.text("Employés concernés", margin + 120, currentY + 7);
  currentY += 10;

  // Lignes du tableau
  const tableRows = [
    { category: "Absences (jours)", total: report.totals.totalAbsenceDays.toFixed(1), employees: String(report.totals.employeesWithAbsences) },
    { category: "Retards cumulés", total: `${Math.floor(report.totals.totalDelayMinutes / 60)}h${String(report.totals.totalDelayMinutes % 60).padStart(2, '0')}min`, employees: String(report.totals.employeesWithDelays) },
    { category: "Heures supplémentaires", total: report.totals.totalOvertimeHours.toFixed(1) + "h", employees: String(report.totals.employeesWithOvertime) },
  ];

  tableRows.forEach((row, index) => {
    const bgColor = index % 2 === 0 ? COLORS.lightGray : COLORS.white;
    drawRoundedRect(margin, currentY, contentWidth, 8, 0, bgColor);
    
    doc.setTextColor(...COLORS.black);
    doc.setFontSize(9);
    doc.setFont("helvetica", "normal");
    doc.text(row.category, margin + 5, currentY + 5.5);
    doc.setFont("helvetica", "bold");
    doc.text(row.total, margin + 80, currentY + 5.5);
    doc.setFont("helvetica", "normal");
    doc.text(row.employees, margin + 120, currentY + 5.5);
    currentY += 8;
  });

  currentY += 15;

  // ===== ALERTES =====
  doc.setTextColor(...COLORS.black);
  doc.setFontSize(12);
  doc.setFont("helvetica", "bold");
  
  if (report.alerts.length > 0) {
    doc.text("⚠️ POINTS D'ATTENTION", margin, currentY);
    currentY += 8;

    const errorCount = report.alerts.filter(a => a.type === 'error').length;
    const warningCount = report.alerts.filter(a => a.type === 'warning').length;
    const infoCount = report.alerts.filter(a => a.type === 'info').length;

    // Résumé des alertes
    const alertSummary = [];
    if (errorCount > 0) alertSummary.push(`${errorCount} erreur(s)`);
    if (warningCount > 0) alertSummary.push(`${warningCount} avertissement(s)`);
    if (infoCount > 0) alertSummary.push(`${infoCount} information(s)`);

    doc.setFontSize(9);
    doc.setFont("helvetica", "normal");
    doc.setTextColor(...COLORS.gray);
    doc.text(alertSummary.join(' • '), margin, currentY);
    currentY += 6;

    // Afficher les alertes critiques et avertissements (max 8)
    const priorityAlerts = [...report.alerts.filter(a => a.type === 'error'), ...report.alerts.filter(a => a.type === 'warning')].slice(0, 8);

    priorityAlerts.forEach(alert => {
      if (currentY > pageHeight - 30) return; // Éviter le débordement

      const alertColor = alert.type === 'error' ? COLORS.error : COLORS.warning;
      const icon = alert.type === 'error' ? '❌' : '⚠️';
      
      doc.setFillColor(...alertColor);
      doc.circle(margin + 2, currentY + 2, 1.5, 'F');
      
      doc.setFontSize(9);
      doc.setFont("helvetica", "bold");
      doc.setTextColor(...alertColor);
      doc.text(alert.employee, margin + 6, currentY + 3);
      
      doc.setFont("helvetica", "normal");
      doc.setTextColor(...COLORS.black);
      doc.text(` - ${alert.message}`, margin + 6 + doc.getTextWidth(alert.employee), currentY + 3);
      
      currentY += 6;
    });

    if (report.alerts.length > 8) {
      doc.setFontSize(8);
      doc.setTextColor(...COLORS.gray);
      doc.text(`... et ${report.alerts.length - 8} autre(s) alerte(s). Voir le fichier Excel pour le détail complet.`, margin, currentY);
      currentY += 6;
    }
  } else {
    doc.text("✅ VALIDATION", margin, currentY);
    currentY += 8;
    
    drawRoundedRect(margin, currentY, contentWidth, 15, 3, [232, 245, 233]); // Light green
    doc.setFontSize(10);
    doc.setTextColor(...COLORS.success);
    doc.setFont("helvetica", "normal");
    doc.text("Toutes les données sont cohérentes. Aucune alerte détectée.", margin + 5, currentY + 9);
    currentY += 20;
  }

  currentY += 10;

  // ===== DÉTAIL PAR EMPLOYÉ (TOP 10) =====
  if (currentY < pageHeight - 60 && report.employeeSummaries.length > 0) {
    doc.setTextColor(...COLORS.black);
    doc.setFontSize(12);
    doc.setFont("helvetica", "bold");
    doc.text("👥 DÉTAIL PAR EMPLOYÉ", margin, currentY);
    currentY += 8;

    // En-tête mini tableau
    doc.setFillColor(...COLORS.primary);
    doc.rect(margin, currentY, contentWidth, 7, 'F');
    
    doc.setTextColor(...COLORS.white);
    doc.setFontSize(7);
    doc.setFont("helvetica", "bold");
    
    const cols = [
      { x: margin + 2, text: "Employé" },
      { x: margin + 50, text: "Abs." },
      { x: margin + 70, text: "Trav." },
      { x: margin + 90, text: "TR" },
      { x: margin + 105, text: "Retards" },
      { x: margin + 130, text: "HS" },
    ];
    
    cols.forEach(col => doc.text(col.text, col.x, currentY + 5));
    currentY += 7;

    // Lignes (max 10 employés)
    const displayEmployees = report.employeeSummaries.slice(0, 10);
    
    displayEmployees.forEach((emp, index) => {
      if (currentY > pageHeight - 25) return;

      const bgColor = index % 2 === 0 ? COLORS.lightGray : COLORS.white;
      doc.setFillColor(...bgColor);
      doc.rect(margin, currentY, contentWidth, 6, 'F');
      
      doc.setTextColor(...COLORS.black);
      doc.setFontSize(7);
      doc.setFont("helvetica", "normal");
      
      const truncatedName = emp.name.length > 25 ? emp.name.substring(0, 22) + '...' : emp.name;
      doc.text(truncatedName, margin + 2, currentY + 4);
      doc.text(emp.absenceDays.toFixed(1), margin + 50, currentY + 4);
      doc.text(emp.workedDays.toFixed(1), margin + 70, currentY + 4);
      doc.text(String(emp.mealVouchers), margin + 90, currentY + 4);
      
      const delayText = emp.delayMinutes > 0 ? `${Math.floor(emp.delayMinutes / 60)}h${emp.delayMinutes % 60}` : '-';
      doc.text(delayText, margin + 105, currentY + 4);
      
      const hsText = emp.overtimeHours > 0 ? emp.overtimeHours.toFixed(1) + 'h' : '-';
      doc.text(hsText, margin + 130, currentY + 4);
      
      currentY += 6;
    });

    if (report.employeeSummaries.length > 10) {
      doc.setFontSize(7);
      doc.setTextColor(...COLORS.gray);
      doc.text(`... et ${report.employeeSummaries.length - 10} autre(s) employé(s). Voir le fichier Excel pour le détail complet.`, margin, currentY + 3);
    }
  }

  // ===== PIED DE PAGE =====
  doc.setFontSize(8);
  doc.setTextColor(...COLORS.gray);
  doc.setFont("helvetica", "normal");
  doc.text(
    `Document généré automatiquement - ${companyName} - Page 1/1`,
    pageWidth / 2,
    pageHeight - 10,
    { align: 'center' }
  );

  // Ligne de séparation du pied de page
  doc.setDrawColor(...COLORS.lightGray);
  doc.line(margin, pageHeight - 15, pageWidth - margin, pageHeight - 15);

  // Sauvegarder le PDF
  const fileName = `recap_paie_${format(new Date(report.period), 'yyyy-MM')}.pdf`;
  doc.save(fileName);
};
