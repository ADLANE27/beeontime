import { Card } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, PieChart, Pie, Cell, ResponsiveContainer } from 'recharts';
import { useState } from "react";
import { Position } from "@/types/hr";

export const CompanyStats = () => {
  const [selectedMonth, setSelectedMonth] = useState(new Date().getMonth().toString());
  const [selectedYear, setSelectedYear] = useState(new Date().getFullYear().toString());

  const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884d8', '#82ca9d', '#ffc658', '#ff7300', '#666'];

  // Updated data to use positions instead of departments
  const positionData = [
    { name: 'Traducteur/Traductrice', value: 35 },
    { name: 'Interprète', value: 25 },
    { name: 'Chef(fe) de projets', value: 15 },
    { name: 'Coordinateur/Coordinatrice', value: 10 },
    { name: 'Directeur', value: 5 },
    { name: 'Assistante de direction', value: 5 },
    { name: 'Alternant(e)', value: 3 },
    { name: 'Stagiaire', value: 2 },
  ];

  const monthlyStats = [
    { month: 'Jan', presence: 97, absences: 3 },
    { month: 'Fév', presence: 95, absences: 5 },
    { month: 'Mar', presence: 96, absences: 4 },
  ];

  const RADIAN = Math.PI / 180;
  const renderCustomizedLabel = ({ cx, cy, midAngle, innerRadius, outerRadius, percent, index, name }: any) => {
    const radius = outerRadius * 1.4;
    const x = cx + radius * Math.cos(-midAngle * RADIAN);
    const y = cy + radius * Math.sin(-midAngle * RADIAN);

    return (
      <text
        x={x}
        y={y}
        fill="#000"
        textAnchor={x > cx ? 'start' : 'end'}
        dominantBaseline="central"
        fontSize={12}
      >
        {`${name} (${(percent * 100).toFixed(0)}%)`}
      </text>
    );
  };

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
          <h3 className="text-xl font-semibold mb-4">Répartition par poste</h3>
          <div className="w-full h-[400px] flex justify-center items-center">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={positionData}
                  cx="50%"
                  cy="50%"
                  labelLine={true}
                  label={renderCustomizedLabel}
                  outerRadius={100}
                  fill="#8884d8"
                  dataKey="value"
                >
                  {positionData.map((_, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </Card>

        <Card className="p-6">
          <h3 className="text-xl font-semibold mb-4">Évolution mensuelle présence/absence</h3>
          <div className="w-full h-[300px]">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={monthlyStats}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="month" />
                <YAxis />
                <Tooltip />
                <Legend />
                <Bar dataKey="presence" fill="#4F46E5" name="Présence %" />
                <Bar dataKey="absences" fill="#EF4444" name="Absence %" />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </Card>
      </div>
    </div>
  );
};