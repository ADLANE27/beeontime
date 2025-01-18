import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

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
    // First, get a signed URL for the file
    const { data: { publicUrl }, error: urlError } = await supabase.storage
      .from('hr-documents')
      .getPublicUrl(filePath);

    if (urlError) throw urlError;

    // Fetch the file using the signed URL
    const response = await fetch(publicUrl);
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