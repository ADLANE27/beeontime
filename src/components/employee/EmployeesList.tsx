import { useState } from "react";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { NewEmployeeForm } from "./NewEmployeeForm";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Loader2, Mail, Phone, Building, Calendar } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { format } from "date-fns";
import { fr } from "date-fns/locale";

const EmployeeCard = ({ employee }: { employee: Employee }) => {
  const currentYearBalance = Number(employee.current_year_vacation_days || 0) - Number(employee.current_year_used_days || 0);
  const previousYearBalance = Number(employee.previous_year_vacation_days || 0) - Number(employee.previous_year_used_days || 0);
  const totalBalance = currentYearBalance + previousYearBalance;

  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);

  return (
    <Card className="w-full">
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <div className="space-y-1">
          <h3 className="text-xl font-semibold tracking-tight">
            {employee.first_name} {employee.last_name}
          </h3>
          <p className="text-sm text-muted-foreground">{employee.position}</p>
        </div>
        <Badge variant={employee.contract_type === 'CDI' ? 'default' : 'secondary'}>
          {employee.contract_type}
        </Badge>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="space-y-2">
          <div className="flex items-center space-x-2 text-sm">
            <Mail className="h-4 w-4 text-muted-foreground" />
            <span>{employee.email}</span>
          </div>
          {employee.phone && (
            <div className="flex items-center space-x-2 text-sm">
              <Phone className="h-4 w-4 text-muted-foreground" />
              <span>{employee.phone}</span>
            </div>
          )}
          {employee.start_date && (
            <div className="flex items-center space-x-2 text-sm">
              <Calendar className="h-4 w-4 text-muted-foreground" />
              <span>Depuis le {format(new Date(employee.start_date), 'dd MMMM yyyy', { locale: fr })}</span>
            </div>
          )}
          {employee.position && (
            <div className="flex items-center space-x-2 text-sm">
              <Building className="h-4 w-4 text-muted-foreground" />
              <span>{employee.position}</span>
            </div>
          )}
        </div>

        <div className="space-y-2">
          <p className="text-sm font-medium">Solde congés</p>
          <div className="flex gap-4">
            <div>
              <p className="text-sm text-muted-foreground">Année en cours</p>
              <p className="font-medium">{currentYearBalance} jours</p>
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Année précédente</p>
              <p className="font-medium">{previousYearBalance} jours</p>
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Total</p>
              <p className="font-medium">{totalBalance} jours</p>
            </div>
          </div>
        </div>

        <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
          <DialogTrigger asChild>
            <Button variant="outline" className="w-full">
              Modifier
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>Modifier l'employé</DialogTitle>
            </DialogHeader>
            <NewEmployeeForm
              initialData={{
                firstName: employee.first_name,
                lastName: employee.last_name,
                email: employee.email,
                phone: employee.phone || '',
                birthDate: employee.birth_date || '',
                birthPlace: employee.birth_place || '',
                birthCountry: employee.birth_country || '',
                socialSecurityNumber: employee.social_security_number || '',
                contractType: employee.contract_type as ContractType,
                startDate: employee.start_date || '',
                position: employee.position as Position,
                workSchedule: employee.work_schedule as WorkSchedule,
                currentYearVacationDays: employee.current_year_vacation_days || 0,
                currentYearUsedDays: employee.current_year_used_days || 0,
                previousYearVacationDays: employee.previous_year_vacation_days || 0,
                previousYearUsedDays: employee.previous_year_used_days || 0,
                initialPassword: '',
                streetAddress: employee.street_address || '',
                city: employee.city || '',
                postalCode: employee.postal_code || '',
                country: employee.country || ''
              }}
              onSuccess={() => setIsEditDialogOpen(false)}
              isEditing={true}
            />
          </DialogContent>
        </Dialog>
      </CardContent>
    </Card>
  );
};

export const EmployeesList = () => {
  const [isNewEmployeeDialogOpen, setIsNewEmployeeDialogOpen] = useState(false);

  const { data: employees, isLoading } = useQuery({
    queryKey: ['employees'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('employees')
        .select('*')
        .order('last_name', { ascending: true });

      if (error) {
        console.error('Error fetching employees:', error);
        throw error;
      }

      return data;
    }
  });

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold">Liste des employés</h2>
        <Dialog open={isNewEmployeeDialogOpen} onOpenChange={setIsNewEmployeeDialogOpen}>
          <DialogTrigger asChild>
            <Button>Ajouter un employé</Button>
          </DialogTrigger>
          <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>Nouvel employé</DialogTitle>
            </DialogHeader>
            <NewEmployeeForm onSuccess={() => setIsNewEmployeeDialogOpen(false)} />
          </DialogContent>
        </Dialog>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {employees?.map((employee) => (
          <EmployeeCard key={employee.id} employee={employee} />
        ))}
      </div>
    </div>
  );
};