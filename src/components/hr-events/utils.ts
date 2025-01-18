import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import jsPDF from "jspdf";

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
    ["feedback", "Feedback exceptionnel"],
  ],
};

export const getSubcategories = (category: string): [string, string][] => {
  return subcategories[category] || [];
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
    // First, get a public URL for the file
    const { data } = await supabase.storage
      .from('hr-documents')
      .getPublicUrl(filePath);

    // Fetch the file using the public URL
    const response = await fetch(data.publicUrl);
    if (!response.ok) throw new Error('Failed to download file');

    // Create a blob from the response
    const blob = await response.blob();
    
    // Create a download link
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = fileName;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    
    // Clean up
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

    // Add header image
    const headerImage = "/lovable-uploads/d06996cb-5e7c-4b6d-9272-9bf8de33b774.png";
    doc.addImage(headerImage, "PNG", 0, 0, 210, 297);

    // Add event details
    doc.setFontSize(16);
    doc.text("Détails de l'événement", 20, 70);

    doc.setFontSize(12);
    doc.text(`Employé: ${event.employees?.first_name} ${event.employees?.last_name}`, 20, 90);
    doc.text(`Date: ${new Date(event.event_date).toLocaleDateString('fr-FR')}`, 20, 100);
    doc.text(`Titre: ${event.title}`, 20, 110);
    
    // Add description with word wrap
    const splitDescription = doc.splitTextToSize(`Description: ${event.description || 'Aucune description'}`, 170);
    doc.text(splitDescription, 20, 120);
    
    let yPos = 120 + (splitDescription.length * 7);
    
    doc.text(`Catégorie: ${event.category}`, 20, yPos);
    yPos += 10;
    doc.text(`Sous-catégorie: ${event.subcategory}`, 20, yPos);
    yPos += 10;
    doc.text(`Gravité: ${event.severity}`, 20, yPos);
    yPos += 10;
    doc.text(`Statut: ${event.status === 'open' ? 'Ouvert' : 'Clôturé'}`, 20, yPos);
    yPos += 20;

    // Add documents section if there are any
    if (event.documents && event.documents.length > 0) {
      doc.text("Documents attachés:", 20, yPos);
      yPos += 10;
      event.documents.forEach((doc: any) => {
        doc.text(`- ${doc.file_name}`, 20, yPos);
        yPos += 7;
      });
    }

    // Save the PDF
    doc.save(`evenement-rh-${event.id}.pdf`);
    toast.success("PDF généré avec succès");
  } catch (error) {
    console.error("Error generating PDF:", error);
    toast.error("Erreur lors de la génération du PDF");
  }
};
