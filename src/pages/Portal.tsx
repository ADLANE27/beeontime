import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";

const Portal = () => {
  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8">
      <Card className="w-full max-w-md space-y-8 p-8">
        <div>
          <h2 className="mt-6 text-center text-3xl font-bold tracking-tight text-gray-900">
            Portail AFTraduction
          </h2>
          <p className="mt-2 text-center text-sm text-gray-600">
            Choisissez votre portail de connexion
          </p>
        </div>
        <div className="flex flex-col space-y-4">
          <Link to="/hr-portal">
            <Button className="w-full" variant="outline">
              Portail RH
            </Button>
          </Link>
          <Link to="/portal">
            <Button className="w-full">
              Portail Employé
            </Button>
          </Link>
        </div>
      </Card>
    </div>
  );
};

export default Portal;