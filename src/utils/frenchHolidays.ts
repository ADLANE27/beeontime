/**
 * Calcul des jours fériés français
 * Inclut les jours fériés fixes et mobiles (Pâques, Ascension, Pentecôte)
 */

// Calcul de la date de Pâques selon l'algorithme de Meeus/Jones/Butcher
export const getEasterDate = (year: number): Date => {
  const a = year % 19;
  const b = Math.floor(year / 100);
  const c = year % 100;
  const d = Math.floor(b / 4);
  const e = b % 4;
  const f = Math.floor((b + 8) / 25);
  const g = Math.floor((b - f + 1) / 3);
  const h = (19 * a + b - d - g + 15) % 30;
  const i = Math.floor(c / 4);
  const k = c % 4;
  const l = (32 + 2 * e + 2 * i - h - k) % 7;
  const m = Math.floor((a + 11 * h + 22 * l) / 451);
  const month = Math.floor((h + l - 7 * m + 114) / 31);
  const day = ((h + l - 7 * m + 114) % 31) + 1;
  
  return new Date(year, month - 1, day);
};

// Ajoute des jours à une date
const addDays = (date: Date, days: number): Date => {
  const result = new Date(date);
  result.setDate(result.getDate() + days);
  return result;
};

// Format date as YYYY-MM-DD for comparison
const formatDateKey = (date: Date): string => {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
};

export interface FrenchHoliday {
  date: Date;
  name: string;
  dateKey: string;
}

/**
 * Retourne tous les jours fériés français pour une année donnée
 */
export const getFrenchHolidays = (year: number): FrenchHoliday[] => {
  const easter = getEasterDate(year);
  
  const holidays: { date: Date; name: string }[] = [
    // Jours fériés fixes
    { date: new Date(year, 0, 1), name: "Jour de l'an" },
    { date: new Date(year, 4, 1), name: "Fête du Travail" },
    { date: new Date(year, 4, 8), name: "Victoire 1945" },
    { date: new Date(year, 6, 14), name: "Fête nationale" },
    { date: new Date(year, 7, 15), name: "Assomption" },
    { date: new Date(year, 10, 1), name: "Toussaint" },
    { date: new Date(year, 10, 11), name: "Armistice 1918" },
    { date: new Date(year, 11, 25), name: "Noël" },
    
    // Jours fériés mobiles (basés sur Pâques)
    { date: addDays(easter, 1), name: "Lundi de Pâques" },
    { date: addDays(easter, 39), name: "Ascension" },
    { date: addDays(easter, 50), name: "Lundi de Pentecôte" },
  ];
  
  return holidays.map(h => ({
    ...h,
    dateKey: formatDateKey(h.date)
  }));
};

/**
 * Crée un Set de dates de jours fériés pour une vérification rapide
 */
export const getFrenchHolidaysSet = (year: number): Set<string> => {
  const holidays = getFrenchHolidays(year);
  return new Set(holidays.map(h => h.dateKey));
};

/**
 * Vérifie si une date est un jour férié français
 */
export const isFrenchHoliday = (date: Date): boolean => {
  const year = date.getFullYear();
  const holidaysSet = getFrenchHolidaysSet(year);
  return holidaysSet.has(formatDateKey(date));
};

/**
 * Vérifie si une date est un week-end
 */
export const isWeekend = (date: Date): boolean => {
  const day = date.getDay();
  return day === 0 || day === 6;
};

/**
 * Calcule le nombre de jours ouvrés entre deux dates
 * Exclut les week-ends ET les jours fériés français
 */
export const calculateWorkingDaysExcludingHolidays = (
  startDate: Date,
  endDate: Date
): number => {
  let workingDays = 0;
  const currentDate = new Date(startDate);
  
  // Obtenir les jours fériés pour toutes les années concernées
  const startYear = startDate.getFullYear();
  const endYear = endDate.getFullYear();
  const holidaysSet = new Set<string>();
  
  for (let year = startYear; year <= endYear; year++) {
    getFrenchHolidays(year).forEach(h => holidaysSet.add(h.dateKey));
  }
  
  while (currentDate <= endDate) {
    const dateKey = formatDateKey(currentDate);
    const dayOfWeek = currentDate.getDay();
    
    // Exclure les week-ends et jours fériés
    if (dayOfWeek !== 0 && dayOfWeek !== 6 && !holidaysSet.has(dateKey)) {
      workingDays++;
    }
    
    currentDate.setDate(currentDate.getDate() + 1);
  }
  
  return workingDays;
};

/**
 * Retourne les jours fériés pour un mois donné
 */
export const getHolidaysForMonth = (year: number, month: number): FrenchHoliday[] => {
  const allHolidays = getFrenchHolidays(year);
  return allHolidays.filter(h => h.date.getMonth() === month);
};

/**
 * Compte les jours fériés dans une période
 */
export const countHolidaysInPeriod = (startDate: Date, endDate: Date): number => {
  const startYear = startDate.getFullYear();
  const endYear = endDate.getFullYear();
  let count = 0;
  
  for (let year = startYear; year <= endYear; year++) {
    const holidays = getFrenchHolidays(year);
    holidays.forEach(h => {
      if (h.date >= startDate && h.date <= endDate) {
        // Ne compter que si ce n'est pas un week-end
        if (!isWeekend(h.date)) {
          count++;
        }
      }
    });
  }
  
  return count;
};
