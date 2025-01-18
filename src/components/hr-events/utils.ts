import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

type SubcategoryMap = {
  [key: string]: [string, string][];
};

const subcategories: SubcategoryMap = {
  disciplinary: [
    ["warning", "Avertissement"],
    ["misconduct", "Faute"],
    ["absence", "Absence non justifiée"],
    ["performance", "Performance insuffisante"],
  ],
  evaluation: [
    ["annual", "Évaluation annuelle"],
    ["probation", "Période d'essai"],
    ["objectives", "Fixation d'objectifs"],
    ["review", "Revue de performance"],
  ],
  administrative: [
    ["contract", "Modification de contrat"],
    ["schedule", "Changement d'horaires"],
    ["position", "Changement de poste"],
    ["salary", "Révision salariale"],
  ],
  other: [
    ["meeting", "Entretien"],
    ["training", "Formation"],
    ["note", "Note"],
    ["misc", "Divers"],
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