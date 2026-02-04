import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, waitFor, fireEvent } from "@testing-library/react";
import { screen } from "@testing-library/dom";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { LeaveRequestForm } from "@/components/leave/LeaveRequestForm";
import { supabase } from "@/integrations/supabase/client";

// Mock sonner toast
vi.mock("sonner", () => ({
  toast: {
    success: vi.fn(),
    error: vi.fn(),
    warning: vi.fn(),
    info: vi.fn(),
  },
}));

// Mock employees data
const mockEmployees = [
  { id: "emp-1", first_name: "Jean", last_name: "Dupont" },
  { id: "emp-2", first_name: "Marie", last_name: "Martin" },
];

describe("LeaveRequestForm", () => {
  let queryClient: QueryClient;

  beforeEach(() => {
    queryClient = new QueryClient({
      defaultOptions: {
        queries: {
          retry: false,
        },
      },
    });

    // Setup supabase mock for employees
    vi.mocked(supabase.from).mockReturnValue({
      select: vi.fn().mockReturnValue({
        order: vi.fn().mockResolvedValue({ data: mockEmployees, error: null }),
      }),
      insert: vi.fn().mockReturnValue({
        select: vi.fn().mockReturnValue({
          single: vi.fn().mockResolvedValue({ 
            data: { id: "leave-1" }, 
            error: null 
          }),
        }),
      }),
    } as any);
  });

  const renderComponent = (props = {}) => {
    return render(
      <QueryClientProvider client={queryClient}>
        <LeaveRequestForm {...props} />
      </QueryClientProvider>
    );
  };

  it("renders form with all fields", async () => {
    renderComponent();

    await waitFor(() => {
      expect(screen.getByText("Employé")).toBeInTheDocument();
      expect(screen.getByText("Type de congé")).toBeInTheDocument();
      expect(screen.getByText("Date de début")).toBeInTheDocument();
      expect(screen.getByText("Date de fin")).toBeInTheDocument();
      expect(screen.getByText("Type de journée")).toBeInTheDocument();
      expect(screen.getByText("Motif")).toBeInTheDocument();
      expect(screen.getByText("Pièce jointe")).toBeInTheDocument();
    });
  });

  it("renders day type toggle with full and half day options", async () => {
    renderComponent();

    await waitFor(() => {
      expect(screen.getByText("Journée complète")).toBeInTheDocument();
      expect(screen.getByText("Demi-journée")).toBeInTheDocument();
    });
  });

  it("shows period selector when half day is selected", async () => {
    renderComponent();

    await waitFor(() => {
      const halfDayButton = screen.getByText("Demi-journée");
      fireEvent.click(halfDayButton);
    });

    await waitFor(() => {
      expect(screen.getByText("Période")).toBeInTheDocument();
    });
  });

  it("renders submit button with correct text", async () => {
    renderComponent();

    await waitFor(() => {
      expect(screen.getByText("Soumettre la demande")).toBeInTheDocument();
    });
  });

  it("renders update button text when editing", async () => {
    renderComponent({ isEditing: true, initialValues: {
      employee_id: "emp-1",
      start_date: "2024-01-15",
      end_date: "2024-01-16",
      type: "vacation",
      day_type: "full",
      period: null,
      reason: "Test reason",
    }});

    await waitFor(() => {
      expect(screen.getByText("Mettre à jour")).toBeInTheDocument();
    });
  });

  it("has required date inputs", async () => {
    renderComponent();

    await waitFor(() => {
      const startDateInput = screen.getByLabelText("Date de début");
      const endDateInput = screen.getByLabelText("Date de fin");
      
      expect(startDateInput).toHaveAttribute("type", "date");
      expect(endDateInput).toHaveAttribute("type", "date");
      expect(startDateInput).toBeRequired();
      expect(endDateInput).toBeRequired();
    });
  });

  it("renders file upload input", async () => {
    renderComponent();

    await waitFor(() => {
      const fileInput = document.querySelector('input[type="file"]');
      expect(fileInput).toBeInTheDocument();
    });
  });
});
