import { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Auth } from "@supabase/auth-ui-react";
import { ThemeSupa } from "@supabase/auth-ui-shared";
import { Card } from "@/components/ui/card";

const Portal = () => {
  const navigate = useNavigate();

  useEffect(() => {
    const checkUser = async () => {
      console.log("Checking employee access...");
      const { data: { session } } = await supabase.auth.getSession();
      if (session) {
        const { data: profile } = await supabase
          .from('profiles')
          .select('role')
          .eq('id', session.user.id)
          .single();

        if (profile?.role === 'employee') {
          navigate('/employee');
        } else {
          // Si ce n'est pas un employé, rediriger vers la page d'accueil
          navigate('/');
        }
      }
    };

    checkUser();

    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, session) => {
      if (event === 'SIGNED_IN') {
        console.log("User signed in, checking role...");
        const { data: profile } = await supabase
          .from('profiles')
          .select('role')
          .eq('id', session?.user.id)
          .single();

        if (profile?.role === 'employee') {
          navigate('/employee');
        } else {
          navigate('/');
        }
      }
    });

    return () => subscription.unsubscribe();
  }, [navigate]);

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
      <Card className="w-full max-w-md p-8">
        <h1 className="text-2xl font-bold text-center mb-8">Portail Employé</h1>
        <Auth
          supabaseClient={supabase}
          appearance={{ theme: ThemeSupa }}
          theme="light"
          providers={[]}
          redirectTo={`${window.location.origin}/employee`}
        />
      </Card>
    </div>
  );
};

export default Portal;