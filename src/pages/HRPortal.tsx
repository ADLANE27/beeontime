import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { useNavigate } from "react-router-dom";
import { Users } from "lucide-react";

const HRPortal = () => {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center">
      <div className="container max-w-4xl mx-auto px-4">
        <h1 className="text-3xl font-bold text-center mb-8">
          Portail RH AFTraduction
        </h1>
        <div className="max-w-md mx-auto">
          <Card className="p-6 hover:shadow-lg transition-shadow">
            <div className="space-y-4 text-center">
              <Users className="w-12 h-12 mx-auto text-primary" />
              <h2 className="text-2xl font-semibold">Espace RH</h2>
              <p className="text-gray-600">
                Gérez les demandes et suivez les présences des employés
              </p>
              <Button
                className="w-full"
                onClick={() => navigate("/hr")}
              >
                Accéder
              </Button>
            </div>
          </Card>
        </div>
      </div>
    </div>
  );
};

export default HRPortal;