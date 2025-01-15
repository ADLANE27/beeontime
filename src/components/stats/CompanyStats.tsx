import { Card } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, PieChart, Pie, Cell } from 'recharts';
import { useState } from "react";

export const CompanyStats = () => {
  const [selectedMonth, setSelectedMonth] = useState(new Date().getMonth().toString());
  const [selectedYear, setSelectedYear] = useState(new Date().getFullYear().toString());

  const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042'];

  // Example data - In a real app, this would come from your backend
  const departmentData = [
    { name: 'Traduction', value: 45 },
    { name: 'Interprétation', value: 25 },
    { name: 'Administration', value: 15 },
    { name: 'Direction', value: 15 },
  ];

  const monthlyStats = [
    { month: 'Jan', presence: 97, absences: 3 },
    { month: 'Fév', presence: 95, absences: 5 },
    { month: 'Mar', presence: 96, absences: 4 },
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
          <h3 className="text-lg font-semibold mb-2">Effectif total</h3>
          <p className="text-3xl font-bold text-primary">42</p>
        </Card>
        
        <Card className="p-4">
          <h3 className="text-lg font-semibold mb-2">Taux de présence moyen</h3>
          <p className="text-3xl font-bold text-green-600">96%</p>
        </Card>
        
        <Card className="p-4">
          <h3 className="text-lg font-semibold mb-2">Congés en cours</h3>
          <p className="text-3xl font-bold text-blue-600">5</p>
        </Card>
        
        <Card className="p-4">
          <h3 className="text-lg font-semibold mb-2">Total heures supp.</h3>
          <p className="text-3xl font-bold text-purple-600">127h</p>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card className="p-6">
          <h3 className="text-xl font-semibold mb-4">Répartition par service</h3>
          <div className="w-full h-[300px] flex justify-center">
            <PieChart width={400} height={300}>
              <Pie
                data={departmentData}
                cx={200}
                cy={150}
                labelLine={false}
                label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                outerRadius={80}
                fill="#8884d8"
                dataKey="value"
              >
                {departmentData.map((_, index) => (
                  <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                ))}
              </Pie>
              <Tooltip />
              <Legend />
            </PieChart>
          </div>
        </Card>

        <Card className="p-6">
          <h3 className="text-xl font-semibold mb-4">Évolution mensuelle présence/absence</h3>
          <div className="w-full h-[300px]">
            <BarChart width={400} height={300} data={monthlyStats}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="month" />
              <YAxis />
              <Tooltip />
              <Legend />
              <Bar dataKey="presence" fill="#4F46E5" name="Présence %" />
              <Bar dataKey="absences" fill="#EF4444" name="Absence %" />
            </BarChart>
          </div>
        </Card>
      </div>
    </div>
  );
};