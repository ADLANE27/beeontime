import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Download } from "lucide-react";
import { Payslip } from "@/types/hr";

export const PayslipList = () => {
  // Exemple de données
  const payslips: Payslip[] = [
    {
      id: 1,
      employeeId: 1,
      month: "Mars",
      year: 2024,
      fileUrl: "#"
    }
  ];

  return (
    <Card className="p-6">
      <h2 className="text-2xl font-bold mb-6">Bulletins de paie</h2>
      <div className="space-y-4">
        {payslips.map((payslip) => (
          <div
            key={payslip.id}
            className="flex items-center justify-between p-4 border rounded-lg"
          >
            <div>
              <p className="font-semibold">
                {payslip.month} {payslip.year}
              </p>
            </div>
            <Button variant="outline" size="sm">
              <Download className="mr-2 h-4 w-4" />
              Télécharger
            </Button>
          </div>
        ))}
      </div>
    </Card>
  );
};