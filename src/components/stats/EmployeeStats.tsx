import { Card } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend } from 'recharts';
import { useState } from "react";

interface StatsProps {
  employeeId?: number;
}

export const EmployeeStats = ({ employeeId }: StatsProps) => {
  const [selectedMonth, setSelectedMonth] = useState(new Date().getMonth().toString());
  const [selectedYear, setSelectedYear] = useState(new Date().getFullYear().toString());

  // Example data - In a real app, this would come from your backend
  const attendanceData = [
    { name: 'Présence', value: 95 },
    { name: 'Retards', value: 3 },
    { name: 'Absences', value: 2 },
  ];

  const overtimeData = [
    { month: 'Jan', hours: 5 },
    { month: 'Fév', hours: 3 },
    { month: 'Mar', hours: 7 },
  ];

  return (
    <div className="space-y-6">
      <div className="flex gap-4 mb-6">
        <div className="space-y-2">
          <Label>Mois</Label>
          <Select value={selectedMonth} onValueChange={setSelectedMonth}>
            <SelectTrigger className="w-32">
              <SelectValue placeholder="Mois" />
            </SelectTrigger>
            <SelectContent>
              {Array.from({ length: 12 }, (_, i) => (
                <SelectItem key={i} value={i.toString()}>
                  {new Date(2024, i).toLocaleString('fr-FR', { month: 'long' })}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <div className="space-y-2">
          <Label>Année</Label>
          <Select value={selectedYear} onValueChange={setSelectedYear}>
            <SelectTrigger className="w-32">
              <SelectValue placeholder="Année" />
            </SelectTrigger>
            <SelectContent>
              {Array.from({ length: 5 }, (_, i) => {
                const year = new Date().getFullYear() - i;
                return (
                  <SelectItem key={year} value={year.toString()}>
                    {year}
                  </SelectItem>
                );
              })}
            </SelectContent>
          </Select>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card className="p-4">
          <h3 className="text-lg font-semibold mb-2">Taux de présence</h3>
          <p className="text-3xl font-bold text-green-600">95%</p>
        </Card>
        
        <Card className="p-4">
          <h3 className="text-lg font-semibold mb-2">Retards</h3>
          <p className="text-3xl font-bold text-orange-600">3</p>
        </Card>
        
        <Card className="p-4">
          <h3 className="text-lg font-semibold mb-2">Congés pris</h3>
          <p className="text-3xl font-bold text-blue-600">12 jours</p>
        </Card>
        
        <Card className="p-4">
          <h3 className="text-lg font-semibold mb-2">Heures supp.</h3>
          <p className="text-3xl font-bold text-purple-600">15h</p>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card className="p-6">
          <h3 className="text-xl font-semibold mb-4">Répartition présence/absence</h3>
          <div className="w-full h-[300px]">
            <BarChart width={400} height={300} data={attendanceData}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="name" />
              <YAxis />
              <Tooltip />
              <Legend />
              <Bar dataKey="value" fill="#4F46E5" />
            </BarChart>
          </div>
        </Card>

        <Card className="p-6">
          <h3 className="text-xl font-semibold mb-4">Heures supplémentaires</h3>
          <div className="w-full h-[300px]">
            <BarChart width={400} height={300} data={overtimeData}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="month" />
              <YAxis />
              <Tooltip />
              <Legend />
              <Bar dataKey="hours" fill="#8B5CF6" />
            </BarChart>
          </div>
        </Card>
      </div>
    </div>
  );
};