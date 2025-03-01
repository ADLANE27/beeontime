
import { useState, useEffect } from "react";
import { toast } from "sonner";
import { format } from "date-fns";
import { fr } from "date-fns/locale";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Table,
  TableBody,
  TableCaption,
  TableCell,
  TableFooter,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Calendar } from "@/components/ui/calendar";
import { CalendarIcon, Download, Plus, Upload } from "lucide-react";
import { DateRange } from "react-day-picker";
import { cn } from "@/lib/utils";
import { addMonths, subMonths } from "date-fns";
import { Payslip } from "@/types/hr";
import { LoadingScreen } from "@/components/ui/loading-screen";

interface Employee {
  id: string;
  first_name: string;
  last_name: string;
}

// Define the Document type to match the documents table structure
interface Document {
  id: string;
  employee_id: string;
  title: string;
  type: string;
  file_path: string;
  created_at: string;
  uploaded_by: string;
}

const today = new Date();
const currentYear = today.getFullYear();
const years = Array.from({ length: 10 }, (_, i) => currentYear - i);

export function PayslipList() {
  const [payslips, setPayslips] = useState<Payslip[]>([]);
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [selectedEmployee, setSelectedEmployee] = useState<string | null>(null);
  const [selectedMonth, setSelectedMonth] = useState<string | null>(null);
  const [selectedYear, setSelectedYear] = useState<string | null>(
    String(currentYear)
  );
  const [file, setFile] = useState<File | null>(null);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [date, setDate] = useState<DateRange | undefined>({
    from: subMonths(new Date(), 2),
    to: today,
  });

  useEffect(() => {
    const fetchPayslips = async () => {
      setIsLoading(true);
      try {
        let query = supabase
          .from("documents")
          .select("*")
          .eq("type", "payslip")
          .order("created_at", { ascending: false });

        if (selectedEmployee) {
          query = query.eq("employee_id", selectedEmployee);
        }

        if (date?.from && date?.to) {
          const fromDate = format(date.from, "yyyy-MM-dd");
          const toDate = format(date.to, "yyyy-MM-dd");

          query = query.gte("created_at", fromDate);
          query = query.lte("created_at", toDate);
        }

        const { data, error } = await query;

        if (error) {
          console.error("Error fetching payslips:", error);
          toast.error("Erreur lors du chargement des fiches de paie");
        } else {
          // Transform documents to payslips
          const transformedPayslips: Payslip[] = data
            ? data.map((doc: Document) => {
                // Extract month and year from the title or filename
                const titleParts = doc.title ? doc.title.split('_') : [];
                const month = titleParts.length > 1 ? titleParts[1].substring(5, 7) : '';
                const year = titleParts.length > 1 ? titleParts[1].substring(0, 4) : '';
                
                return {
                  id: doc.id,
                  employee_id: doc.employee_id,
                  month: month,
                  year: year,
                  file_url: doc.file_path,
                  created_at: doc.created_at
                };
              })
            : [];
          
          setPayslips(transformedPayslips);
        }
      } catch (error) {
        console.error("Unexpected error fetching payslips:", error);
        toast.error("Une erreur inattendue s'est produite");
      } finally {
        setIsLoading(false);
      }
    };

    fetchPayslips();
  }, [selectedEmployee, date]);

  useEffect(() => {
    const fetchEmployees = async () => {
      try {
        const { data: employeesData, error: employeesError } = await supabase
          .from("employees")
          .select("id, first_name, last_name");

        if (employeesError) {
          console.error("Error fetching employees:", employeesError);
          toast.error("Erreur lors du chargement des employés");
        } else {
          setEmployees(employeesData || []);
        }
      } catch (error) {
        console.error("Unexpected error fetching employees:", error);
        toast.error("Une erreur inattendue s'est produite");
      }
    };

    fetchEmployees();
  }, []);

  const handleSubmit = async () => {
    if (!selectedEmployee || !selectedMonth || !selectedYear || !file) {
      toast.error("Veuillez remplir tous les champs");
      return;
    }

    setIsUploading(true);

    try {
      const fileExt = file.name.split(".").pop();
      const fileName = `payslip_${selectedYear}-${selectedMonth}_${selectedEmployee}.${fileExt}`;
      const filePath = `payslips/${fileName}`;

      // Upload the payslip file to Supabase storage
      const { data: uploadData, error: uploadError } = await supabase.storage
        .from("hr-management")
        .upload(filePath, file, {
          cacheControl: "3600",
          upsert: false,
        });

      if (uploadError) {
        console.error("Error uploading file:", uploadError);
        toast.error("Erreur lors du téléversement du fichier");
        setIsUploading(false);
        return;
      }

      // Get the public URL of the uploaded file
      const { data: fileData } = supabase.storage
        .from("hr-management")
        .getPublicUrl(filePath);
      const fileURL = fileData.publicUrl;

      // Create a new payslip record in the documents table
      const { data: insertData, error: insertError } = await supabase
        .from("documents")
        .insert([
          {
            employee_id: selectedEmployee,
            title: fileName,
            type: "payslip",
            file_path: fileURL,
            uploaded_by: selectedEmployee // Assuming the employee uploads their own payslip
          }
        ])
        .select();

      if (insertError) {
        console.error("Error inserting payslip:", insertError);
        toast.error("Erreur lors de l'enregistrement de la fiche de paie");
      } else {
        toast.success("Fiche de paie enregistrée avec succès");
        
        if (insertData && insertData.length > 0) {
          // Extract month and year from the filename
          const filenameParts = fileName.split('_');
          const dateInfo = filenameParts.length > 1 ? filenameParts[1].split('-') : [];
          const year = dateInfo.length > 0 ? dateInfo[0] : '';
          const month = dateInfo.length > 1 ? dateInfo[1] : '';
          
          const newPayslip: Payslip = {
            id: insertData[0].id,
            employee_id: selectedEmployee,
            month: month,
            year: year,
            file_url: fileURL,
            created_at: insertData[0].created_at
          };
          
          setPayslips((prevPayslips) => [...prevPayslips, newPayslip]);
        }
      }
    } catch (error) {
      console.error("Unexpected error:", error);
      toast.error("Une erreur inattendue s'est produite");
    } finally {
      setIsUploading(false);
      setIsDialogOpen(false);
      setFile(null);
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      setFile(e.target.files[0]);
    }
  };

  const handleDownload = (fileUrl: string) => {
    window.open(fileUrl, "_blank");
  };

  const filteredPayslips = payslips.filter((payslip) => {
    if (selectedEmployee && payslip.employee_id !== selectedEmployee) {
      return false;
    }
    return true;
  });

  return (
    <Card className="bg-white/90 shadow-lg rounded-xl border border-gray-100 overflow-hidden backdrop-blur-sm">
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <CardTitle className="text-2xl font-bold">Fiches de paie</CardTitle>
        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogTrigger asChild>
            <Button variant="outline" className="gap-2">
              <Plus className="h-4 w-4" />
              Ajouter
            </Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-[425px]">
            <DialogHeader>
              <DialogTitle>Ajouter une fiche de paie</DialogTitle>
              <DialogDescription>
                Sélectionnez l'employé, le mois, l'année et le fichier PDF à
                télécharger.
              </DialogDescription>
            </DialogHeader>
            <div className="grid gap-4 py-4">
              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="employee" className="text-right">
                  Employé
                </Label>
                <Select
                  onValueChange={setSelectedEmployee}
                  defaultValue={selectedEmployee || ""}
                >
                  <SelectTrigger className="col-span-3">
                    <SelectValue placeholder="Sélectionner un employé" />
                  </SelectTrigger>
                  <SelectContent>
                    {employees.map((employee) => (
                      <SelectItem key={employee.id} value={employee.id}>
                        {employee.first_name} {employee.last_name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="month" className="text-right">
                  Mois
                </Label>
                <Select
                  onValueChange={setSelectedMonth}
                  defaultValue={selectedMonth || ""}
                >
                  <SelectTrigger className="col-span-3">
                    <SelectValue placeholder="Sélectionner un mois" />
                  </SelectTrigger>
                  <SelectContent>
                    {Array.from({ length: 12 }, (_, i) => {
                      const month = format(new Date(2023, i, 1), "MMMM", {
                        locale: fr,
                      });
                      const monthNumber = String(i + 1).padStart(2, "0");
                      return (
                        <SelectItem key={monthNumber} value={monthNumber}>
                          {month}
                        </SelectItem>
                      );
                    })}
                  </SelectContent>
                </Select>
              </div>
              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="year" className="text-right">
                  Année
                </Label>
                <Select
                  onValueChange={setSelectedYear}
                  defaultValue={selectedYear || String(currentYear)}
                >
                  <SelectTrigger className="col-span-3">
                    <SelectValue placeholder="Sélectionner une année" />
                  </SelectTrigger>
                  <SelectContent>
                    {years.map((year) => (
                      <SelectItem key={year} value={String(year)}>
                        {year}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="pdf" className="text-right">
                  Fichier PDF
                </Label>
                <Input
                  type="file"
                  id="pdf"
                  className="col-span-3"
                  onChange={handleFileChange}
                  accept=".pdf"
                />
              </div>
            </div>
            <Button
              type="submit"
              onClick={handleSubmit}
              disabled={isUploading}
              className="w-full"
            >
              {isUploading ? "Téléchargement..." : "Télécharger"}
            </Button>
          </DialogContent>
        </Dialog>
      </CardHeader>
      <CardDescription className="px-4">
        Sélectionnez une période et un employé pour filtrer les fiches de paie.
      </CardDescription>
      <CardContent className="grid gap-4">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          <Popover>
            <PopoverTrigger asChild>
              <Button
                variant={"outline"}
                className={cn(
                  "w-full justify-start text-left font-normal",
                  !date?.from && !date?.to
                    ? "text-muted-foreground"
                    : "font-semibold"
                )}
              >
                <CalendarIcon className="mr-2 h-4 w-4" />
                {date?.from ? (
                  date.to ? (
                    <>
                      {format(date.from, "dd MMMM yyyy", { locale: fr })} -{" "}
                      {format(date.to, "dd MMMM yyyy", { locale: fr })}
                    </>
                  ) : (
                    format(date.from, "dd MMMM yyyy", { locale: fr })
                  )
                ) : (
                  <span>Choisir une date</span>
                )}
              </Button>
            </PopoverTrigger>
            <PopoverContent
              className="w-auto p-0"
              align="start"
              side="bottom"
            >
              <Calendar
                mode="range"
                defaultMonth={date?.from ? date.from : new Date()}
                selected={date}
                onSelect={setDate}
                numberOfMonths={2}
                fromMonth={subMonths(new Date(), 12)}
                toMonth={addMonths(new Date(), 12)}
                initialFocus
                locale={fr}
              />
            </PopoverContent>
          </Popover>
          <Select
            onValueChange={setSelectedEmployee}
            defaultValue={selectedEmployee || ""}
          >
            <SelectTrigger className="w-full">
              <SelectValue placeholder="Filtrer par employé" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="">Tous les employés</SelectItem>
              {employees.map((employee) => (
                <SelectItem key={employee.id} value={employee.id}>
                  {employee.first_name} {employee.last_name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Employé</TableHead>
              <TableHead>Mois</TableHead>
              <TableHead>Année</TableHead>
              <TableHead className="text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {isLoading ? (
              <TableRow>
                <TableCell colSpan={4} className="text-center">
                  <div className="flex justify-center p-4">
                    <span>Chargement des fiches de paie...</span>
                  </div>
                </TableCell>
              </TableRow>
            ) : filteredPayslips.length === 0 ? (
              <TableRow>
                <TableCell colSpan={4} className="text-center">
                  Aucune fiche de paie trouvée.
                </TableCell>
              </TableRow>
            ) : (
              filteredPayslips.map((payslip) => {
                const employee = employees.find(
                  (emp) => emp.id === payslip.employee_id
                );
                const monthNumber = parseInt(payslip.month);
                const monthName = !isNaN(monthNumber) 
                  ? format(new Date(2023, monthNumber - 1, 1), "MMMM", { locale: fr })
                  : "N/A";

                return (
                  <TableRow key={payslip.id}>
                    <TableCell>
                      {employee
                        ? `${employee.first_name} ${employee.last_name}`
                        : "N/A"}
                    </TableCell>
                    <TableCell>{monthName}</TableCell>
                    <TableCell>{payslip.year}</TableCell>
                    <TableCell className="text-right">
                      <Button
                        variant="secondary"
                        onClick={() => handleDownload(payslip.file_url)}
                      >
                        <Download className="mr-2 h-4 w-4" />
                        Télécharger
                      </Button>
                    </TableCell>
                  </TableRow>
                );
              })
            )}
          </TableBody>
        </Table>
      </CardContent>
    </Card>
  );
}
