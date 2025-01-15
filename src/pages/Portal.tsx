import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { useNavigate } from "react-router-dom";
import { User, Users } from "lucide-react";

const Portal = () => {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center">
      <div className="container max-w-4xl mx-auto px-4">
        <h1 className="text-3xl font-bold text-center mb-8">
          Portail AFTraduction
        </h1>
        <div className="flex justify-center">
          <Card className="p-6 hover:shadow-lg transition-shadow max-w-md w-full">
            <div className="space-y-4 text-center">
              <User className="w-12 h-12 mx-auto text-primary" />
              <h2 className="text-2xl font-semibold">Espace Employé</h2>
              <p className="text-gray-600">
                Accédez à vos documents, gérez vos congés et heures supplémentaires
              </p>
              <Button
                className="w-full"
                onClick={() => navigate("/employee")}
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

export default Portal;