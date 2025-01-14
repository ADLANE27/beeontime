import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { OvertimeRequest } from "@/types/hr";

export const OvertimeList = () => {
  // Exemple de données
  const overtimeRequests: OvertimeRequest[] = [
    {
      id: 1,
      employeeId: 1,
      date: "2024-03-20",
      hours: 2,
      reason: "Projet urgent",
      status: "pending"
    }
  ];

  return (
    <Card className="p-6">
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-2xl font-bold">Heures supplémentaires</h2>
        <Button>Nouvelle demande</Button>
      </div>
      <div className="space-y-4">
        {overtimeRequests.map((request) => (
          <div
            key={request.id}
            className="flex items-center justify-between p-4 border rounded-lg"
          >
            <div>
              <p className="font-semibold">{request.date}</p>
              <p className="text-sm text-gray-600">{request.hours} heures</p>
              <p className="text-sm text-gray-600">{request.reason}</p>
            </div>
            <Badge
              variant={
                request.status === "approved"
                  ? "success"
                  : request.status === "rejected"
                  ? "destructive"
                  : "secondary"
              }
            >
              {request.status}
            </Badge>
          </div>
        ))}
      </div>
    </Card>
  );
};