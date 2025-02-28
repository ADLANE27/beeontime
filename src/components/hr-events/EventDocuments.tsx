
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Trash, Download } from "lucide-react";
import { downloadDocument, deleteDocument, uploadDocument } from "./utils";

interface EventDocumentsProps {
  documents: Array<{
    id: string;
    file_name: string;
    file_path: string;
  }>;
  eventId: string;
}

export const EventDocuments = ({ documents, eventId }: EventDocumentsProps) => {
  return (
    <div className="space-y-2">
      <Label>Documents</Label>
      <div className="space-y-2">
        {documents?.map((doc) => (
          <div
            key={doc.id}
            className="flex items-center justify-between p-2 border rounded"
          >
            <span>{doc.file_name}</span>
            <div className="flex gap-2">
              <Button
                type="button"
                variant="outline"
                size="icon"
                onClick={() => downloadDocument(doc.file_path, doc.file_name)}
              >
                <Download className="h-4 w-4" />
              </Button>
              <Button
                type="button"
                variant="destructive"
                size="icon"
                onClick={() => deleteDocument(doc.id)}
              >
                <Trash className="h-4 w-4" />
              </Button>
            </div>
          </div>
        ))}
        <Input
          type="file"
          onChange={(e) => {
            const file = e.target.files?.[0];
            if (file) {
              uploadDocument(file, eventId);
            }
          }}
        />
      </div>
    </div>
  );
};
