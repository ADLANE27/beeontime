import { useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Edit, Trash2 } from "lucide-react";
import { useState } from "react";
import { NewEmployee } from "@/types/hr";
import NewEmployeeForm from "./NewEmployeeForm";
import { toast } from "sonner";

export const EmployeesList = () => {
  const [editingEmployee, setEditingEmployee] = useState<NewEmployee | null>(null);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const queryClient = useQueryClient();

  const { data: employees, isLoading } = useQuery({
    queryKey: ['employees'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('employees')
        .select('*');
      
      if (error) throw error;
      console.log('Fetched employees:', data);
      return data;
    }
  });

  const handleEdit = (employee: any) => {
    // Map database fields to NewEmployee type
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

  if (isLoading) return <div>Chargement...</div>;

  return (
    <div className="space-y-4">
      <h2 className="text-2xl font-bold">Liste des employés</h2>
      <div className="grid gap-4">
        {employees?.map((employee) => (
          <Card key={employee.id} className="p-4">
            <div className="flex justify-between items-center">
              <div>
                <h3 className="text-lg font-semibold">
                  {employee.first_name} {employee.last_name}
                </h3>
                <p className="text-sm text-muted-foreground">{employee.email}</p>
                <p className="text-sm text-muted-foreground">{employee.position}</p>
              </div>
              <div className="space-x-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => handleEdit(employee)}
                >
                  <Edit className="h-4 w-4" />
                </Button>
                <Button
                  variant="destructive"
                  size="sm"
                  onClick={() => handleDelete(employee.id)}
                >
                  <Trash2 className="h-4 w-4" />
                </Button>
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
    </div>
  );
};