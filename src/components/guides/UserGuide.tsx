
import { useState } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  ArrowRight,
  ArrowLeft,
  Clock,
  HelpCircle,
  X,
  CheckCircle2,
  AlertTriangle,
} from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogClose,
} from "@/components/ui/dialog";

export const UserGuide = () => {
  const [open, setOpen] = useState(false);

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="outline" size="sm" className="gap-2">
          <HelpCircle className="h-4 w-4" />
          Guide d'utilisation
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-3xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-2xl font-bold">Guide d'utilisation</DialogTitle>
        </DialogHeader>
        
        <Tabs defaultValue="pointage" className="mt-4">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="pointage">Système de pointage</TabsTrigger>
            <TabsTrigger value="conges">Demandes de congés</TabsTrigger>
            <TabsTrigger value="heures">Heures supplémentaires</TabsTrigger>
          </TabsList>
          
          <TabsContent value="pointage" className="space-y-6 mt-6">
            <h3 className="text-xl font-semibold flex items-center gap-2">
              <Clock className="h-5 w-5 text-primary" />
              Guide du système de pointage
            </h3>
            
            <div className="space-y-4">
              <p>Le système de pointage permet d'enregistrer votre présence au travail et vos temps de pause. Il est essentiel de l'utiliser correctement pour assurer la précision de vos heures travaillées.</p>
              
              <h4 className="font-medium text-lg">Les quatre pointages quotidiens :</h4>
              
              <div className="grid gap-4 md:grid-cols-2">
                <Card className="p-4 border-l-4 border-l-green-500">
                  <h5 className="font-semibold flex items-center gap-2">
                    <ArrowRight className="h-4 w-4 text-green-600" />
                    1. Pointer arrivée
                  </h5>
                  <p className="text-sm mt-2">À effectuer dès votre arrivée sur votre lieu de travail, avant de commencer vos tâches. Ce pointage marque le début de votre journée de travail.</p>
                  <div className="mt-3 p-2 bg-gray-50 rounded-md text-sm">
                    <span className="font-medium">Important :</span> Un retard par rapport à votre horaire prévu sera automatiquement détecté et signalé aux RH.
                  </div>
                </Card>
                
                <Card className="p-4 border-l-4 border-l-amber-500">
                  <h5 className="font-semibold flex items-center gap-2">
                    <ArrowLeft className="h-4 w-4 text-amber-600" />
                    2. Pointer départ pause
                  </h5>
                  <p className="text-sm mt-2">À effectuer lorsque vous quittez votre poste pour votre pause déjeuner. Ce pointage permet de calculer correctement votre temps de pause.</p>
                  <div className="mt-3 p-2 bg-gray-50 rounded-md text-sm">
                    <span className="font-medium">Conseil :</span> Ne pas oublier ce pointage, sinon votre temps de pause ne sera pas correctement comptabilisé.
                  </div>
                </Card>
                
                <Card className="p-4 border-l-4 border-l-amber-500">
                  <h5 className="font-semibold flex items-center gap-2">
                    <ArrowRight className="h-4 w-4 text-amber-600" />
                    3. Pointer retour pause
                  </h5>
                  <p className="text-sm mt-2">À effectuer dès votre retour de pause déjeuner, avant de reprendre vos tâches professionnelles.</p>
                  <div className="mt-3 p-2 bg-gray-50 rounded-md text-sm">
                    <span className="font-medium">Rappel :</span> Des pauses trop longues peuvent affecter votre temps de travail effectif.
                  </div>
                </Card>
                
                <Card className="p-4 border-l-4 border-l-red-500">
                  <h5 className="font-semibold flex items-center gap-2">
                    <ArrowLeft className="h-4 w-4 text-red-600" />
                    4. Pointer départ
                  </h5>
                  <p className="text-sm mt-2">À effectuer à la fin de votre journée de travail, avant de quitter votre lieu de travail.</p>
                  <div className="mt-3 p-2 bg-gray-50 rounded-md text-sm">
                    <span className="font-medium">Important :</span> Ne pas oublier ce dernier pointage, sinon vos heures de travail ne seront pas correctement enregistrées.
                  </div>
                </Card>
              </div>
              
              <h4 className="font-medium text-lg mt-6">Bonnes pratiques :</h4>
              
              <div className="space-y-3">
                <div className="flex gap-2">
                  <CheckCircle2 className="h-5 w-5 text-green-600 flex-shrink-0 mt-0.5" />
                  <p>Effectuez vos pointages à l'heure exacte d'arrivée et de départ, pas avant ni après.</p>
                </div>
                <div className="flex gap-2">
                  <CheckCircle2 className="h-5 w-5 text-green-600 flex-shrink-0 mt-0.5" />
                  <p>Vérifiez toujours le récapitulatif de vos pointages affiché sous le bouton de pointage.</p>
                </div>
                <div className="flex gap-2">
                  <CheckCircle2 className="h-5 w-5 text-green-600 flex-shrink-0 mt-0.5" />
                  <p>En cas d'oubli, contactez immédiatement votre responsable ou le service RH.</p>
                </div>
                <div className="flex gap-2">
                  <AlertTriangle className="h-5 w-5 text-amber-600 flex-shrink-0 mt-0.5" />
                  <p>Ne jamais demander à un collègue d'effectuer un pointage à votre place - cette pratique est strictement interdite.</p>
                </div>
              </div>
              
              <h4 className="font-medium text-lg mt-6">Résolution des problèmes courants :</h4>
              
              <Card className="p-4 space-y-3">
                <div>
                  <h5 className="font-medium">Oubli de pointage</h5>
                  <p className="text-sm">Si vous avez oublié d'effectuer un pointage, contactez les RH dès que possible avec l'horaire exact concerné.</p>
                </div>
                
                <div>
                  <h5 className="font-medium">Pointage erroné</h5>
                  <p className="text-sm">En cas d'erreur, signalez-la immédiatement à votre responsable qui pourra faire la correction nécessaire.</p>
                </div>
                
                <div>
                  <h5 className="font-medium">Retard détecté</h5>
                  <p className="text-sm">Si un retard est détecté, vous recevrez une notification. Vous pouvez fournir une justification aux RH si ce retard était prévu ou excusable.</p>
                </div>
              </Card>
            </div>
          </TabsContent>
          
          <TabsContent value="conges" className="space-y-4 mt-6">
            <h3 className="text-xl font-semibold">Guide des demandes de congés</h3>
            <p>Pour demander un congé, utilisez l'onglet "Congés" et suivez les instructions pour soumettre votre demande.</p>
            <p>Vous pouvez suivre l'état de vos demandes dans l'historique des congés.</p>
          </TabsContent>
          
          <TabsContent value="heures" className="space-y-4 mt-6">
            <h3 className="text-xl font-semibold">Guide des heures supplémentaires</h3>
            <p>Pour déclarer des heures supplémentaires, utilisez l'onglet "Heures Supp." et remplissez le formulaire avec la date et les heures travaillées.</p>
            <p>Les demandes doivent être approuvées par votre responsable avant d'être comptabilisées.</p>
          </TabsContent>
        </Tabs>
        
        <div className="flex justify-end mt-6">
          <DialogClose asChild>
            <Button variant="outline">Fermer le guide</Button>
          </DialogClose>
        </div>
      </DialogContent>
    </Dialog>
  );
};
