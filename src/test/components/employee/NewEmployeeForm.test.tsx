import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, waitFor, fireEvent } from "@testing-library/react";
import { screen } from "@testing-library/dom";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { NewEmployeeForm } from "@/components/employee/NewEmployeeForm";

// Mock sonner
vi.mock("sonner", () => ({
  toast: {
    success: vi.fn(),
    error: vi.fn(),
    warning: vi.fn(),
    info: vi.fn(),
  },
}));

describe("NewEmployeeForm", () => {
  let queryClient: QueryClient;

  beforeEach(() => {
    queryClient = new QueryClient({
      defaultOptions: {
        queries: {
          retry: false,
        },
      },
    });
    vi.clearAllMocks();
  });

  const renderComponent = (props = {}) => {
    const defaultProps = {
      onSuccess: vi.fn(),
      isEditing: false,
    };
    return render(
      <QueryClientProvider client={queryClient}>
        <NewEmployeeForm {...defaultProps} {...props} />
      </QueryClientProvider>
    );
  };

  it("renders all form sections", async () => {
    renderComponent();

    // Personal info
    expect(screen.getByText("Prénom")).toBeInTheDocument();
    expect(screen.getByText("Nom")).toBeInTheDocument();
    expect(screen.getByText("Email")).toBeInTheDocument();

    // Work info
    expect(screen.getByText("Type de contrat")).toBeInTheDocument();
    expect(screen.getByText("Poste")).toBeInTheDocument();
  });

  it("displays create button when not editing", () => {
    renderComponent();

    expect(screen.getByRole("button", { name: /créer l'employé/i })).toBeInTheDocument();
  });

  it("displays modify button when editing", () => {
    renderComponent({ isEditing: true });

    expect(screen.getByRole("button", { name: /modifier l'employé/i })).toBeInTheDocument();
  });

  it("has required fields", () => {
    renderComponent();

    const firstNameInput = screen.getByLabelText("Prénom");
    const lastNameInput = screen.getByLabelText("Nom");
    const emailInput = screen.getByLabelText("Email");

    expect(firstNameInput).toBeRequired();
    expect(lastNameInput).toBeRequired();
    expect(emailInput).toBeRequired();
  });

  it("allows typing in form fields", () => {
    renderComponent();

    const firstNameInput = screen.getByLabelText("Prénom") as HTMLInputElement;
    fireEvent.change(firstNameInput, { target: { value: "Jean" } });
    expect(firstNameInput.value).toBe("Jean");

    const lastNameInput = screen.getByLabelText("Nom") as HTMLInputElement;
    fireEvent.change(lastNameInput, { target: { value: "Dupont" } });
    expect(lastNameInput.value).toBe("Dupont");
  });

  it("renders password field section", () => {
    renderComponent();

    expect(screen.getByText("Mot de passe initial")).toBeInTheDocument();
  });

  it("shows optional password label when editing", () => {
    renderComponent({ isEditing: true });

    expect(screen.getByText("Nouveau mot de passe (optionnel)")).toBeInTheDocument();
  });
});
