import { useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Edit, Key, Plus, Power, Trash2 } from "lucide-react";
import { useState } from "react";
import { NewEmployee } from "@/types/hr";
import NewEmployeeForm from "./NewEmployeeForm";
import { toast } from "sonner";

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
      return data;
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
        remaining_vacation_days: updatedEmployee.remainingVacationDays
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

  const handleToggleActive = async (employeeId: string, currentStatus: boolean) => {
    const { error } = await supabase
      .from('profiles')
      .update({ active: !currentStatus })
      .eq('id', employeeId);

    if (error) {
      console.error('Error toggling user status:', error);
      toast.error("Erreur lors de la modification du statut de l'employé");
      return;
    }

    queryClient.invalidateQueries({ queryKey: ['employees'] });
    toast.success(`Employé ${currentStatus ? 'désactivé' : 'activé'} avec succès`);
  };

  const handleResetPassword = async (email: string) => {
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
              <div className="grid gap-1">
                <h3 className="text-lg font-semibold">
                  {employee.first_name} {employee.last_name}
                </h3>
                <p className="text-sm text-muted-foreground">{employee.email}</p>
                <p className="text-sm text-muted-foreground">
                  Statut: {employee.profiles?.active ? 'Actif' : 'Inactif'}
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
                  onClick={() => handleToggleActive(employee.id, employee.profiles?.active)}
                >
                  <Power className="h-4 w-4" />
                  {employee.profiles?.active ? 'Désactiver' : 'Activer'}
                </Button>
</lov-replace>

<lov-search>
  Statut: {employee.profiles?.active ? 'Actif' : 'Inactif'}
</lov-search>
<lov-replace>
  {employee.profiles?.active ? 'Actif' : ''}
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