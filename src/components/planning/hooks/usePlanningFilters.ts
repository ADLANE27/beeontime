import { useState, useMemo } from "react";

interface Employee {
  id: string;
  first_name: string;
  last_name: string;
  position: string;
}

interface LeaveRequest {
  employee_id: string;
  type: string;
  status: string;
}

export const usePlanningFilters = (
  employees: Employee[],
  leaveRequests: LeaveRequest[]
) => {
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedDepartment, setSelectedDepartment] = useState("all");
  const [selectedLeaveType, setSelectedLeaveType] = useState("all");
  const [selectedStatus, setSelectedStatus] = useState("all");

  const filteredEmployees = useMemo(() => {
    return employees.filter((employee) => {
      // Search filter
      const searchLower = searchQuery.toLowerCase();
      const matchesSearch =
        searchQuery === "" ||
        employee.first_name.toLowerCase().includes(searchLower) ||
        employee.last_name.toLowerCase().includes(searchLower) ||
        employee.position?.toLowerCase().includes(searchLower);

      if (!matchesSearch) return false;

      // Department filter (based on position for now)
      if (selectedDepartment !== "all") {
        const positionLower = employee.position?.toLowerCase() || "";
        const matchesDepartment =
          (selectedDepartment === "rh" && positionLower.includes("rh")) ||
          (selectedDepartment === "it" && positionLower.includes("informatique")) ||
          (selectedDepartment === "sales" && positionLower.includes("commercial")) ||
          (selectedDepartment === "marketing" && positionLower.includes("marketing")) ||
          (selectedDepartment === "finance" && positionLower.includes("finance"));

        if (!matchesDepartment) return false;
      }

      // Leave type filter
      if (selectedLeaveType !== "all") {
        const hasLeaveOfType = leaveRequests.some(
          (request) =>
            request.employee_id === employee.id &&
            request.type === selectedLeaveType &&
            request.status === "approved"
        );
        if (!hasLeaveOfType) return false;
      }

      return true;
    });
  }, [
    employees,
    searchQuery,
    selectedDepartment,
    selectedLeaveType,
    leaveRequests,
  ]);

  const activeFiltersCount = [
    searchQuery !== "",
    selectedDepartment !== "all",
    selectedLeaveType !== "all",
    selectedStatus !== "all",
  ].filter(Boolean).length;

  const clearFilters = () => {
    setSearchQuery("");
    setSelectedDepartment("all");
    setSelectedLeaveType("all");
    setSelectedStatus("all");
  };

  return {
    searchQuery,
    setSearchQuery,
    selectedDepartment,
    setSelectedDepartment,
    selectedLeaveType,
    setSelectedLeaveType,
    selectedStatus,
    setSelectedStatus,
    filteredEmployees,
    activeFiltersCount,
    clearFilters,
  };
};
