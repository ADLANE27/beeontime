import { ScrollArea } from "@/components/ui/scroll-area";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { format, getDaysInMonth, startOfMonth, addMonths, subMonths, isToday, isWeekend } from "date-fns";
import { fr } from "date-fns/locale";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { useState } from "react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { cn } from "@/lib/utils";
import { CompanyStats } from "@/components/stats/CompanyStats";

interface Employee {
  id: number;
  name: string;
  poste: string;
}

const employees: Employee[] = [
  { id: 1, name: "Adlane DEBASSI", poste: "Traducteur" }
];

export const AdminPlanning = () => {
  const [currentDate, setCurrentDate] = useState(new Date());

  const daysInMonth = getDaysInMonth(currentDate);
  const firstDayOfMonth = startOfMonth(currentDate);

  const nextMonth = () => setCurrentDate(addMonths(currentDate, 1));
  const previousMonth = () => setCurrentDate(subMonths(currentDate, 1));

  const getDaysToShow = () => {
    return Array.from({ length: daysInMonth }, (_, i) => 
      new Date(firstDayOfMonth.getFullYear(), firstDayOfMonth.getMonth(), i + 1)
    );
  };

  return (
    <Tabs defaultValue="planning" className="space-y-4">
      <TabsList>
        <TabsTrigger value="planning">Planning</TabsTrigger>
        <TabsTrigger value="stats">Statistiques</TabsTrigger>
      </TabsList>

      <TabsContent value="planning">
        <Card className="p-4">
          <div className="space-y-4">
            <div className="flex justify-between items-center">
              <div className="flex items-center space-x-4">
                <Button variant="outline" size="icon" onClick={previousMonth}>
                  <ChevronLeft className="h-4 w-4" />
                </Button>
                <h2 className="text-xl font-semibold">
                  {format(currentDate, 'MMMM yyyy', { locale: fr })}
                </h2>
                <Button variant="outline" size="icon" onClick={nextMonth}>
                  <ChevronRight className="h-4 w-4" />
                </Button>
              </div>
            </div>
            
            <ScrollArea className="h-[500px] border rounded-lg">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="sticky left-0 bg-white z-10">Employé</TableHead>
                    {getDaysToShow().map((date, i) => (
                      <TableHead 
                        key={i} 
                        className={cn(
                          "text-center min-w-[100px]",
                          {
                            "bg-blue-50": isToday(date),
                            "bg-gray-100": isWeekend(date)
                          }
                        )}
                      >
                        {format(date, 'dd/MM')}
                      </TableHead>
                    ))}
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {employees.map((employee) => (
                    <TableRow key={employee.id}>
                      <TableCell className="sticky left-0 bg-white font-medium">
                        {employee.name}
                      </TableCell>
                      {getDaysToShow().map((date, i) => (
                        <TableCell
                          key={i}
                          className={cn(
                            "text-center p-2",
                            {
                              "bg-blue-50": isToday(date),
                              "bg-gray-100": isWeekend(date)
                            }
                          )}
                        >
                          {/* Empty cell - time tracking will be handled in employee dashboard */}
                        </TableCell>
                      ))}
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </ScrollArea>
          </div>
        </Card>
      </TabsContent>

      <TabsContent value="stats">
        <Card className="p-6">
          <div className="space-y-6">
            <h2 className="text-2xl font-bold">Statistiques</h2>
            <CompanyStats />
          </div>
        </Card>
      </TabsContent>
    </Tabs>
  );
};
