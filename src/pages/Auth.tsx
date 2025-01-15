import { Card } from "@/components/ui/card";
import { AlertCircle } from "lucide-react";

const Auth = () => {
  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8">
      <Card className="w-full max-w-md space-y-8 p-8">
        <div className="text-center">
          <AlertCircle className="mx-auto h-12 w-12 text-yellow-500" />
          <h2 className="mt-6 text-center text-3xl font-bold tracking-tight text-gray-900">
            Maintenance en cours
          </h2>
          <p className="mt-4 text-center text-base text-gray-600">
            Le portail est temporairement indisponible pour maintenance.
            <br />
            Veuillez réessayer ultérieurement.
          </p>
        </div>
      </Card>
    </div>
  );
};

export default Auth;