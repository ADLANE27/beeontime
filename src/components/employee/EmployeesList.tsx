import { useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Edit, Key, Plus, Trash2, Calendar, Clock, Briefcase, PalmtreeIcon, Phone } from "lucide-react";
import { useState } from "react";
import { NewEmployee } from "@/types/hr";
import NewEmployeeForm from "./NewEmployeeForm";
import { toast } from "sonner";
import { format } from "date-fns";
import { fr } from "date-fns/locale";

interface Employee {
  id: string;
  first_name: string;
  last_name: string;
  email: string;
  phone: string | null;
  birth_date: string | null;
  birth_place: string | null;
  birth_country: string | null;
  social_security_number: string | null;
  contract_type: string | null;
  start_date: string | null;
  position: string | null;
  work_schedule: {
    startTime: string;
    endTime: string;
    breakStartTime: string;
    breakEndTime: string;
  } | null;
  previous_year_vacation_days: number | null;
  used_vacation_days: number | null;
  remaining_vacation_days: number | null;
  profiles: {
    active: boolean | null;
  } | null;
}

export const EmployeesList = () => {
  const [editingEmployee, setEditingEmployee] = useState<NewEmployee | null>(null);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [isNewEmployeeModalOpen, setIsNewEmployeeModalOpen] = useState(false);
  const queryClient = useQueryClient();

  const { data: employees, isLoading } = useQuery({
    queryKey: ['employees'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('employees')
        .select('*, profiles(active)');
      
      if (error) throw error;
      console.log('Fetched employees:', data);
      
      // Transform the data to match our Employee interface
      const transformedData = data.map((employee: any) => ({
        ...employee,
        work_schedule: employee.work_schedule as Employee['work_schedule']
      }));
      
      return transformedData as Employee[];
    }
  });

  const handleEdit = (employee: any) => {
    const mappedEmployee: NewEmployee = {
      id: employee.id,
      firstName: employee.first_name,
      lastName: employee.last_name,
      email: employee.email,
      phone: employee.phone || '',
      birthDate: employee.birth_date || '',
      birthPlace: employee.birth_place || '',
      birthCountry: employee.birth_country || '',
      socialSecurityNumber: employee.social_security_number || '',
      contractType: employee.contract_type || 'CDI',
      startDate: employee.start_date || '',
      position: employee.position || 'Traducteur',
      workSchedule: employee.work_schedule || {
        startTime: '09:00',
        endTime: '17:00',
        breakStartTime: '12:00',
        breakEndTime: '13:00'
      },
      previousYearVacationDays: employee.previous_year_vacation_days || 0,
      usedVacationDays: employee.used_vacation_days || 0,
      remainingVacationDays: employee.remaining_vacation_days || 0,
      initialPassword: employee.initial_password || ''
    };
    setEditingEmployee(mappedEmployee);
    setIsEditModalOpen(true);
  };

  const handleDelete = async (id: string) => {
    const { error } = await supabase
      .from('employees')
      .delete()
      .eq('id', id);

    if (error) {
      console.error('Error deleting employee:', error);
      toast.error("Erreur lors de la suppression de l'employé");
      return;
    }

    queryClient.invalidateQueries({ queryKey: ['employees'] });
    toast.success("Employé supprimé avec succès");
  };

  const handleUpdate = async (updatedEmployee: NewEmployee) => {
    if (!updatedEmployee.id) {
      console.error('No employee ID provided for update');
      toast.error("Erreur lors de la mise à jour de l'employé: ID manquant");
      return;
    }

    console.log('Updated employee:', updatedEmployee);
    
    // Si le mot de passe a été modifié, on le met à jour via l'Edge Function
    if (updatedEmployee.initialPassword && updatedEmployee.initialPassword !== '') {
      try {
        const { data, error } = await supabase.functions.invoke('update-user-password', {
          body: {
            userId: updatedEmployee.id,
            password: updatedEmployee.initialPassword
          }
        });

        if (error) {
          console.error('Error updating password:', error);
          toast.error("Erreur lors de la mise à jour du mot de passe");
          return;
        }

        console.log('Password update response:', data);
      } catch (err) {
        console.error('Error calling update-user-password function:', err);
        toast.error("Erreur lors de la mise à jour du mot de passe");
        return;
      }
    }

    const { error } = await supabase
      .from('employees')
      .update({
        first_name: updatedEmployee.firstName,
        last_name: updatedEmployee.lastName,
        email: updatedEmployee.email,
        phone: updatedEmployee.phone,
        birth_date: updatedEmployee.birthDate,
        birth_place: updatedEmployee.birthPlace,
        birth_country: updatedEmployee.birthCountry,
        social_security_number: updatedEmployee.socialSecurityNumber,
        contract_type: updatedEmployee.contractType,
        start_date: updatedEmployee.startDate,
        position: updatedEmployee.position,
        work_schedule: updatedEmployee.workSchedule,
        previous_year_vacation_days: updatedEmployee.previousYearVacationDays,
        used_vacation_days: updatedEmployee.usedVacationDays,
        remaining_vacation_days: updatedEmployee.remainingVacationDays,
        initial_password: updatedEmployee.initialPassword
      })
      .eq('id', updatedEmployee.id);

    if (error) {
      console.error('Error updating employee:', error);
      toast.error("Erreur lors de la mise à jour de l'employé");
      return;
    }

    queryClient.invalidateQueries({ queryKey: ['employees'] });
    toast.success("Employé mis à jour avec succès");
    setIsEditModalOpen(false);
    setEditingEmployee(null);
  };

  const handleCreateEmployee = async (newEmployee: NewEmployee) => {
    const { error } = await supabase.auth.signUp({
      email: newEmployee.email,
      password: 'Welcome123!', // Temporary password
      options: {
        data: {
          first_name: newEmployee.firstName,
          last_name: newEmployee.lastName,
        }
      }
    });

    if (error) {
      console.error('Error creating user:', error);
      toast.error("Erreur lors de la création de l'utilisateur");
      return;
    }

    queryClient.invalidateQueries({ queryKey: ['employees'] });
    toast.success("Employé créé avec succès");
    setIsNewEmployeeModalOpen(false);
  };

  const handleResetPassword = async (email: string) => {
    toast.loading("Envoi de l'email de réinitialisation...");
    
    const { error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: `${window.location.origin}/reset-password`,
    });

    if (error) {
      console.error('Error resetting password:', error);
      toast.error("Erreur lors de la réinitialisation du mot de passe");
      return;
    }

    toast.success("Email de réinitialisation du mot de passe envoyé");
  };

  if (isLoading) return <div>Chargement...</div>;

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold">Liste des employés</h2>
        <Button onClick={() => setIsNewEmployeeModalOpen(true)}>
          <Plus className="mr-2 h-4 w-4" />
          Ajouter un employé
        </Button>
      </div>

      <div className="grid gap-4">
        {employees?.map((employee) => (
          <Card key={employee.id} className="p-4">
            <div className="flex justify-between items-center">
              <div className="grid gap-3 w-full">
                <div className="flex justify-between items-start">
                  <div>
                    <h3 className="text-lg font-semibold">
                      {employee.first_name} {employee.last_name}
                    </h3>
                    <p className="text-sm text-muted-foreground">{employee.email}</p>
                    {employee.phone && (
                      <p className="text-sm text-muted-foreground flex items-center gap-1">
                        <Phone className="h-3 w-3" />
                        {employee.phone}
                      </p>
                    )}
                    <p className="text-sm text-muted-foreground">
                      {employee.profiles?.active ? 'Actif' : ''}
                    </p>
                  </div>
                  <div className="flex gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleEdit(employee)}
                    >
                      <Edit className="h-4 w-4" />
                      Modifier
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleResetPassword(employee.email)}
                    >
                      <Key className="h-4 w-4" />
                      Réinitialiser MDP
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleDelete(employee.id)}
                    >
                      <Trash2 className="h-4 w-4" />
                      Supprimer
                    </Button>
                  </div>
                </div>

                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-2">
                  <div>
                    <div className="text-sm font-medium text-muted-foreground mb-1">
                      <Briefcase className="h-4 w-4 inline-block mr-1" />
                      Poste
                    </div>
                    <span className="text-sm">
                      {employee.position || 'Non spécifié'}
                    </span>
                  </div>
                  
                  <div>
                    <div className="text-sm font-medium text-muted-foreground mb-1">
                      <Calendar className="h-4 w-4 inline-block mr-1" />
                      Date d'arrivée
                    </div>
                    <span className="text-sm">
                      {employee.start_date 
                        ? format(new Date(employee.start_date), 'dd MMMM yyyy', { locale: fr })
                        : 'Non spécifié'}
                    </span>
                  </div>

                  <div>
                    <div className="text-sm font-medium text-muted-foreground mb-1">
                      <Clock className="h-4 w-4 inline-block mr-1" />
                      Horaires de travail
                    </div>
                    <span className="text-sm">
                      {employee.work_schedule 
                        ? <>
                            {employee.work_schedule.startTime} - {employee.work_schedule.endTime}
                            <br />
                            <span className="text-muted-foreground">
                              Pause: {employee.work_schedule.breakStartTime} - {employee.work_schedule.breakEndTime}
                            </span>
                          </>
                        : 'Non spécifié'}
                    </span>
                  </div>

                  <div>
                    <div className="text-sm font-medium text-muted-foreground mb-1">
                      <PalmtreeIcon className="h-4 w-4 inline-block mr-1" />
                      Congés restants
                    </div>
                    <span className="text-sm">
                      {`${employee.remaining_vacation_days || 0} jours`}
                    </span>
                  </div>
                </div>
              </div>
            </div>
          </Card>
        ))}
      </div>

      {editingEmployee && (
        <NewEmployeeForm
          isOpen={isEditModalOpen}
          onClose={() => {
            setIsEditModalOpen(false);
            setEditingEmployee(null);
          }}
          onSubmit={handleUpdate}
          employeeToEdit={editingEmployee}
          mode="edit"
        />
      )}

      <NewEmployeeForm
        isOpen={isNewEmployeeModalOpen}
        onClose={() => setIsNewEmployeeModalOpen(false)}
        onSubmit={handleCreateEmployee}
        mode="create"
      />
    </div>
  );
};