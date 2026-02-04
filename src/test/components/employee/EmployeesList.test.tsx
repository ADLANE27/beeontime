import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, waitFor } from "@testing-library/react";
import { screen } from "@testing-library/dom";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { MemoryRouter } from "react-router-dom";
import { EmployeesList } from "@/components/employee/EmployeesList";
import { supabase } from "@/integrations/supabase/client";

// Mock data
const mockEmployees = [
  {
    id: "1",
    first_name: "Jean",
    last_name: "Dupont",
    email: "jean.dupont@test.com",
    phone: "0123456789",
    position: "Traducteur",
    contract_type: "CDI",
    start_date: "2023-01-01",
    current_year_vacation_days: 25,
    current_year_used_days: 5,
    previous_year_vacation_days: 10,
    previous_year_used_days: 2,
    work_schedule: {
      startTime: "09:00",
      endTime: "17:00",
      breakStartTime: "12:00",
      breakEndTime: "13:00",
    },
    birth_date: "1990-01-01",
    birth_place: "Paris",
    birth_country: "France",
    social_security_number_encrypted: null,
    street_address: "123 Rue Test",
    city: "Paris",
    postal_code: "75001",
    country: "France",
  },
];

describe("EmployeesList", () => {
  let queryClient: QueryClient;

  beforeEach(() => {
    queryClient = new QueryClient({
      defaultOptions: {
        queries: {
          retry: false,
        },
      },
    });

    // Setup supabase mock
    vi.mocked(supabase.from).mockReturnValue({
      select: vi.fn().mockReturnValue({
        order: vi.fn().mockResolvedValue({ data: mockEmployees, error: null }),
      }),
    } as any);
  });

  const renderComponent = () => {
    return render(
      <QueryClientProvider client={queryClient}>
        <MemoryRouter>
          <EmployeesList />
        </MemoryRouter>
      </QueryClientProvider>
    );
  };

  it("shows loading state initially", () => {
    renderComponent();
    expect(screen.getByText("Chargement des employés...")).toBeInTheDocument();
  });

  it("renders employees list after loading", async () => {
    renderComponent();

    await waitFor(() => {
      expect(screen.getByText("Liste des employés")).toBeInTheDocument();
    });
  });

  it("displays add employee button", async () => {
    renderComponent();

    await waitFor(() => {
      expect(screen.getByText("Ajouter un employé")).toBeInTheDocument();
    });
  });

  it("renders employee cards with correct data", async () => {
    renderComponent();

    await waitFor(() => {
      expect(screen.getByText("Jean Dupont")).toBeInTheDocument();
      expect(screen.getByText("jean.dupont@test.com")).toBeInTheDocument();
      // Use getAllByText for position which appears multiple times
      expect(screen.getAllByText("Traducteur").length).toBeGreaterThan(0);
    });
  });

  it("shows contract type badge", async () => {
    renderComponent();

    await waitFor(() => {
      expect(screen.getByText("CDI")).toBeInTheDocument();
    });
  });

  it("displays vacation balance", async () => {
    renderComponent();

    await waitFor(() => {
      // Current year balance: 25 - 5 = 20
      expect(screen.getByText("20.0 jours")).toBeInTheDocument();
    });
  });

  it("shows employee action buttons", async () => {
    renderComponent();

    await waitFor(() => {
      expect(screen.getByText("Modifier")).toBeInTheDocument();
    });
  });
});
