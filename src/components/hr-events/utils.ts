import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import jsPDF from "jspdf";
import { Database } from "@/integrations/supabase/types";

type EventCategory = Database["public"]["Enums"]["event_category"];
type SortField = "event_date" | "severity" | "category";
type SortOrder = "asc" | "desc";

type SubcategoryMap = {
  [key: string]: [string, string][];
};

const subcategories: SubcategoryMap = {
  disciplinary: [
    ["verbal_warning", "Avertissement oral"],
    ["written_warning", "Avertissement écrit"],
    ["reminder", "Rappel"],
    ["suspension", "Mise à pied"],
    ["dismissal", "Licenciement"],
  ],
  evaluation: [
    ["annual_review", "Entretien annuel"],
    ["quarterly_review", "Évaluation trimestrielle"],
    ["pdp", "Plan de développement personnel"],
  ],
  administrative: [
    ["promotion", "Promotion"],
    ["position_change", "Changement de poste"],
    ["training", "Formation"],
    ["certification", "Certification"],
  ],
  other: [
    ["extended_leave", "Absence prolongée"],
    ["specific_meeting", "Réunion spécifique"],
    ["feedback", "Retour exceptionnel"],
  ],
};

export const getCategoryLabel = (category: string): string => {
  const labels: Record<string, string> = {
    disciplinary: "Disciplinaire",
    evaluation: "Évaluation",
    administrative: "Administratif",
    other: "Autre"
  };
  return labels[category] || category;
};

export const getSubcategoryLabel = (category: string, subcategory: string): string => {
  const subcategoryList = subcategories[category];
  if (!subcategoryList) return subcategory;
  
  const found = subcategoryList.find(([value]) => value === subcategory);
  return found ? found[1] : subcategory;
};

export const getSubcategories = (category: string): [string, string][] => {
  return subcategories[category] || [];
};

export const getSeverityColor = (severity: string) => {
  switch (severity) {
    case "critical":
      return "destructive";
    case "minor":
      return "secondary";
    default:
      return "default";
  }
};

export const getSeverityLabel = (severity: string) => {
  switch (severity) {
    case "critical":
      return "Critique";
    case "minor":
      return "Mineure";
    default:
      return "Standard";
  }
};

export const buildHREventQuery = (
  searchQuery: string,
  selectedCategory: EventCategory | "all",
  selectedPeriod: Date | null,
  sortField: SortField,
  sortOrder: SortOrder
) => {
  let query = supabase
    .from("hr_events")
    .select(`
      *,
      employees (
        first_name,
        last_name
      )
    `);

  if (searchQuery) {
    query = query.or(`title.ilike.%${searchQuery}%,description.ilike.%${searchQuery}%`);
  }

  if (selectedCategory && selectedCategory !== "all") {
    query = query.eq("category", selectedCategory);
  }

  if (selectedPeriod) {
    const startOfDay = new Date(selectedPeriod);
    startOfDay.setHours(0, 0, 0, 0);
    const endOfDay = new Date(selectedPeriod);
    endOfDay.setHours(23, 59, 59, 999);
    
    query = query.gte("event_date", startOfDay.toISOString())
                .lte("event_date", endOfDay.toISOString());
  }

  query = query.order(sortField, { ascending: sortOrder === "asc" });

  return query;
};

export const uploadDocument = async (file: File, eventId: string) => {
  try {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error("User not authenticated");

    const fileExt = file.name.split('.').pop();
    const filePath = `${eventId}/${crypto.randomUUID()}.${fileExt}`;

    const { error: uploadError } = await supabase.storage
      .from('hr-documents')
      .upload(filePath, file);

    if (uploadError) throw uploadError;

    const { error: dbError } = await supabase
      .from('hr_event_documents')
      .insert({
        event_id: eventId,
        file_path: filePath,
        file_name: file.name,
        file_type: file.type,
        uploaded_by: user.id,
      });

    if (dbError) throw dbError;

    toast.success("Document téléchargé avec succès");
  } catch (error) {
    console.error("Error uploading document:", error);
    toast.error("Erreur lors du téléchargement du document");
  }
};

export const deleteDocument = async (documentId: string) => {
  try {
    const { data: document, error: fetchError } = await supabase
      .from('hr_event_documents')
      .select('file_path')
      .eq('id', documentId)
      .single();

    if (fetchError) throw fetchError;

    const { error: storageError } = await supabase.storage
      .from('hr-documents')
      .remove([document.file_path]);

    if (storageError) throw storageError;

    const { error: dbError } = await supabase
      .from('hr_event_documents')
      .delete()
      .eq('id', documentId);

    if (dbError) throw dbError;

    toast.success("Document supprimé avec succès");
  } catch (error) {
    console.error("Error deleting document:", error);
    toast.error("Erreur lors de la suppression du document");
  }
};

export const downloadDocument = async (filePath: string, fileName: string) => {
  try {
    const { data } = await supabase.storage
      .from('hr-documents')
      .getPublicUrl(filePath);

    const response = await fetch(data.publicUrl);
    if (!response.ok) throw new Error('Failed to download file');

    const blob = await response.blob();
    
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = fileName;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    
    URL.revokeObjectURL(url);
  } catch (error) {
    console.error("Error downloading document:", error);
    toast.error("Erreur lors du téléchargement du document");
  }
};

export const generateEventPDF = async (event: any) => {
  try {
    const doc = new jsPDF({
      orientation: "portrait",
      unit: "mm",
      format: "a4"
    });

    const headerImage = "/lovable-uploads/d06996cb-5e7c-4b6d-9272-9bf8de33b774.png";
    doc.addImage(headerImage, "PNG", 0, 0, 210, 297);

    doc.setFontSize(16);
    doc.text("Détails de l'événement", 20, 70);

    doc.setFontSize(12);
    doc.text(`Employé: ${event.employees?.first_name} ${event.employees?.last_name}`, 20, 90);
    doc.text(`Date: ${new Date(event.event_date).toLocaleDateString('fr-FR')}`, 20, 100);
    doc.text(`Titre: ${event.title}`, 20, 110);
    
    const splitDescription = doc.splitTextToSize(`Description: ${event.description || 'Aucune description'}`, 170);
    doc.text(splitDescription, 20, 120);
    
    let yPos = 120 + (splitDescription.length * 7);
    
    doc.text(`Catégorie: ${getCategoryLabel(event.category)}`, 20, yPos);
    yPos += 10;
    doc.text(`Sous-catégorie: ${getSubcategoryLabel(event.category, event.subcategory)}`, 20, yPos);
    yPos += 10;
    doc.text(`Gravité: ${event.severity === 'critical' ? 'Critique' : event.severity === 'minor' ? 'Mineure' : 'Standard'}`, 20, yPos);
    yPos += 10;
    doc.text(`Statut: ${event.status === 'open' ? 'Ouvert' : 'Clôturé'}`, 20, yPos);
    yPos += 20;

    if (event.documents && event.documents.length > 0) {
      doc.text("Documents attachés:", 20, yPos);
      yPos += 10;
      event.documents.forEach((doc: any) => {
        doc.text(`- ${doc.file_name}`, 20, yPos);
        yPos += 7;
      });
    }

    doc.save(`evenement-rh-${event.id}.pdf`);
    toast.success("PDF généré avec succès");
  } catch (error) {
    console.error("Error generating PDF:", error);
    toast.error("Erreur lors de la génération du PDF");
  }
};
