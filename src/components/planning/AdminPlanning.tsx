import { ScrollArea } from "@/components/ui/scroll-area";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { format, getDaysInMonth, startOfMonth, addMonths, subMonths, isToday, isWeekend } from "date-fns";
import { fr } from "date-fns/locale";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { useState, useEffect } from "react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { cn } from "@/lib/utils";
import { CompanyStats } from "@/components/stats/CompanyStats";
import { supabase } from "@/integrations/supabase/client";

interface TimeRecord {
  morning_in: string | null;
  lunch_out: string | null;
  lunch_in: string | null;
  evening_out: string | null;
}

interface Employee {
  id: string;
  first_name: string;
  last_name: string;
  position: string;
}

interface DailyRecord {
  [key: string]: TimeRecord;
}

interface EmployeeRecords {
  [key: string]: DailyRecord;
}

export const AdminPlanning = () => {
  const [currentDate, setCurrentDate] = useState(new Date());
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [timeRecords, setTimeRecords] = useState<EmployeeRecords>({});

  const daysInMonth = getDaysInMonth(currentDate);
  const firstDayOfMonth = startOfMonth(currentDate);

  useEffect(() => {
    const fetchEmployees = async () => {
      const { data: employeesData, error: employeesError } = await supabase
        .from('employees')
        .select('id, first_name, last_name, position');

      if (employeesError) {
        console.error('Error fetching employees:', employeesError);
        return;
      }

      setEmployees(employeesData || []);

      // Fetch time records for the current month
      const startDate = format(firstDayOfMonth, 'yyyy-MM-dd');
      const endDate = format(
        new Date(firstDayOfMonth.getFullYear(), firstDayOfMonth.getMonth() + 1, 0),
        'yyyy-MM-dd'
      );

      const { data: recordsData, error: recordsError } = await supabase
        .from('time_records')
        .select('*')
        .gte('date', startDate)
        .lte('date', endDate);

      if (recordsError) {
        console.error('Error fetching time records:', recordsError);
        return;
      }

      // Organize records by employee and date
      const organizedRecords: EmployeeRecords = {};
      recordsData?.forEach(record => {
        if (!organizedRecords[record.employee_id]) {
          organizedRecords[record.employee_id] = {};
        }
        organizedRecords[record.employee_id][record.date] = {
          morning_in: record.morning_in,
          lunch_out: record.lunch_out,
          lunch_in: record.lunch_in,
          evening_out: record.evening_out
        };
      });

      setTimeRecords(organizedRecords);
    };

    fetchEmployees();
  }, [currentDate]);

  const nextMonth = () => setCurrentDate(addMonths(currentDate, 1));
  const previousMonth = () => setCurrentDate(subMonths(currentDate, 1));

  const getDaysToShow = () => {
    const days: Date[] = [];
    const lastDayOfMonth = new Date(firstDayOfMonth.getFullYear(), firstDayOfMonth.getMonth() + 1, 0);
    
    for (let i = 1; i <= lastDayOfMonth.getDate(); i++) {
      const date = new Date(firstDayOfMonth.getFullYear(), firstDayOfMonth.getMonth(), i);
      days.push(date);
    }
    return days;
  };

  const formatTimeRecord = (record?: TimeRecord) => {
    if (!record) return '';
    const times = [];
    if (record.morning_in) times.push(`A:${record.morning_in}`);
    if (record.lunch_out) times.push(`P↑:${record.lunch_out}`);
    if (record.lunch_in) times.push(`P↓:${record.lunch_in}`);
    if (record.evening_out) times.push(`D:${record.evening_out}`);
    return times.join('\n');
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
            
            <ScrollArea className="h-[500px]">
              <div className="border rounded-lg overflow-hidden">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead className="sticky left-0 bg-white z-10 w-[200px]">Employé</TableHead>
                      {getDaysToShow().map((date, i) => (
                        <TableHead 
                          key={i} 
                          className={cn(
                            "text-center min-w-[100px] p-2 whitespace-pre-line",
                            {
                              "bg-blue-50": isToday(date),
                              "bg-gray-100": isWeekend(date)
                            }
                          )}
                        >
                          <div className="text-xs font-medium">
                            {format(date, 'dd')}
                          </div>
                        </TableHead>
                      ))}
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {employees.map((employee) => (
                      <TableRow key={employee.id}>
                        <TableCell className="sticky left-0 bg-white font-medium w-[200px]">
                          {`${employee.first_name} ${employee.last_name}`}
                        </TableCell>
                        {getDaysToShow().map((date, i) => {
                          const dateStr = format(date, 'yyyy-MM-dd');
                          const record = timeRecords[employee.id]?.[dateStr];
                          return (
                            <TableCell
                              key={i}
                              className={cn(
                                "text-center p-2 min-w-[100px] whitespace-pre-line text-xs",
                                {
                                  "bg-blue-50": isToday(date),
                                  "bg-gray-100": isWeekend(date)
                                }
                              )}
                            >
                              {formatTimeRecord(record)}
                            </TableCell>
                          );
                        })}
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
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