import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Edit, Trash2 } from "lucide-react";
import { useState } from "react";
import { NewEmployee } from "@/types/hr";
import NewEmployeeForm from "./NewEmployeeForm";

export const EmployeesList = () => {
  const [editingEmployee, setEditingEmployee] = useState<NewEmployee | null>(null);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);

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

  const handleEdit = (employee: NewEmployee) => {
    setEditingEmployee(employee);
    setIsEditModalOpen(true);
  };

  const handleDelete = async (id: string) => {
    const { error } = await supabase
      .from('employees')
      .delete()
      .eq('id', id);

    if (error) {
      console.error('Error deleting employee:', error);
      return;
    }
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
          onSubmit={(updatedEmployee) => {
            // Handle employee update
            console.log('Updated employee:', updatedEmployee);
          }}
          employeeToEdit={editingEmployee}
          mode="edit"
        />
      )}
    </div>
  );
};