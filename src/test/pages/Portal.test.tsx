import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, waitFor, fireEvent } from "@testing-library/react";
import { screen } from "@testing-library/dom";
import { MemoryRouter } from "react-router-dom";
import Portal from "@/pages/Portal";
import { AuthProvider } from "@/contexts/AuthContext";

// Mock auth context
vi.mock("@/contexts/AuthContext", async () => {
  const actual = await vi.importActual("@/contexts/AuthContext");
  return {
    ...actual,
    useAuth: vi.fn(),
  };
});

import { useAuth } from "@/contexts/AuthContext";
const mockUseAuth = vi.mocked(useAuth);

// Mock sonner
vi.mock("sonner", () => ({
  toast: {
    success: vi.fn(),
    error: vi.fn(),
    warning: vi.fn(),
    info: vi.fn(),
  },
}));

describe("Portal", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("shows loading state when checking authentication", () => {
    mockUseAuth.mockReturnValue({
      session: null,
      user: null,
      isLoading: true,
      signOut: vi.fn(),
      signIn: vi.fn(),
      isSessionExpired: false,
    });

    render(
      <MemoryRouter>
        <Portal />
      </MemoryRouter>
    );

    expect(screen.getByText("Chargement...")).toBeInTheDocument();
  });

  it("renders login form when not authenticated", async () => {
    mockUseAuth.mockReturnValue({
      session: null,
      user: null,
      isLoading: false,
      signOut: vi.fn(),
      signIn: vi.fn(),
      isSessionExpired: false,
    });

    render(
      <MemoryRouter>
        <Portal />
      </MemoryRouter>
    );

    await waitFor(() => {
      expect(screen.getByText("Portail Employé")).toBeInTheDocument();
      expect(screen.getByText("Connexion sécurisée")).toBeInTheDocument();
    });
  });

  it("displays email and password fields", async () => {
    mockUseAuth.mockReturnValue({
      session: null,
      user: null,
      isLoading: false,
      signOut: vi.fn(),
      signIn: vi.fn(),
      isSessionExpired: false,
    });

    render(
      <MemoryRouter>
        <Portal />
      </MemoryRouter>
    );

    await waitFor(() => {
      expect(screen.getByLabelText("Adresse email")).toBeInTheDocument();
      expect(screen.getByLabelText("Mot de passe")).toBeInTheDocument();
    });
  });

  it("has a submit button", async () => {
    mockUseAuth.mockReturnValue({
      session: null,
      user: null,
      isLoading: false,
      signOut: vi.fn(),
      signIn: vi.fn(),
      isSessionExpired: false,
    });

    render(
      <MemoryRouter>
        <Portal />
      </MemoryRouter>
    );

    await waitFor(() => {
      expect(screen.getByRole("button", { name: /se connecter/i })).toBeInTheDocument();
    });
  });

  it("can type in email field", async () => {
    mockUseAuth.mockReturnValue({
      session: null,
      user: null,
      isLoading: false,
      signOut: vi.fn(),
      signIn: vi.fn(),
      isSessionExpired: false,
    });

    render(
      <MemoryRouter>
        <Portal />
      </MemoryRouter>
    );

    await waitFor(() => {
      const emailInput = screen.getByLabelText("Adresse email") as HTMLInputElement;
      fireEvent.change(emailInput, { target: { value: "test@example.com" } });
      expect(emailInput.value).toBe("test@example.com");
    });
  });

  it("shows copyright notice", async () => {
    mockUseAuth.mockReturnValue({
      session: null,
      user: null,
      isLoading: false,
      signOut: vi.fn(),
      signIn: vi.fn(),
      isSessionExpired: false,
    });

    render(
      <MemoryRouter>
        <Portal />
      </MemoryRouter>
    );

    await waitFor(() => {
      expect(screen.getByText(/AFTraduction\. Tous droits réservés/i)).toBeInTheDocument();
    });
  });

  it("calls signIn when form is submitted", async () => {
    const mockSignIn = vi.fn().mockResolvedValue({ error: null });
    mockUseAuth.mockReturnValue({
      session: null,
      user: null,
      isLoading: false,
      signOut: vi.fn(),
      signIn: mockSignIn,
      isSessionExpired: false,
    });

    render(
      <MemoryRouter>
        <Portal />
      </MemoryRouter>
    );

    await waitFor(() => {
      const emailInput = screen.getByLabelText("Adresse email");
      const passwordInput = screen.getByLabelText("Mot de passe");
      const submitButton = screen.getByRole("button", { name: /se connecter/i });

      fireEvent.change(emailInput, { target: { value: "test@example.com" } });
      fireEvent.change(passwordInput, { target: { value: "password123" } });
      fireEvent.click(submitButton);
    });

    await waitFor(() => {
      expect(mockSignIn).toHaveBeenCalledWith("test@example.com", "password123");
    });
  });
});
