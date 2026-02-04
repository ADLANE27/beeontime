import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, waitFor } from "@testing-library/react";
import { screen } from "@testing-library/dom";
import { MemoryRouter } from "react-router-dom";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import HRPortal from "@/pages/HRPortal";

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

describe("HRPortal", () => {
  let queryClient: QueryClient;

  beforeEach(() => {
    vi.clearAllMocks();
    queryClient = new QueryClient({
      defaultOptions: {
        queries: {
          retry: false,
        },
      },
    });
  });

  const renderComponent = () => {
    return render(
      <QueryClientProvider client={queryClient}>
        <MemoryRouter>
          <HRPortal />
        </MemoryRouter>
      </QueryClientProvider>
    );
  };

  it("shows loading state when checking authentication", () => {
    mockUseAuth.mockReturnValue({
      session: null,
      user: null,
      isLoading: true,
      signOut: vi.fn(),
      signIn: vi.fn(),
      isSessionExpired: false,
    });

    renderComponent();

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

    renderComponent();

    await waitFor(() => {
      expect(screen.getByText("Portail RH")).toBeInTheDocument();
    });
  });

  it("shows secure connection badge", async () => {
    mockUseAuth.mockReturnValue({
      session: null,
      user: null,
      isLoading: false,
      signOut: vi.fn(),
      signIn: vi.fn(),
      isSessionExpired: false,
    });

    renderComponent();

    await waitFor(() => {
      expect(screen.getByText("Connexion sécurisée")).toBeInTheDocument();
    });
  });
});
