import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, waitFor } from "@testing-library/react";
import { screen } from "@testing-library/dom";
import { MemoryRouter, Routes, Route } from "react-router-dom";
import { ProtectedRoute } from "@/components/auth/ProtectedRoute";
import { AuthProvider } from "@/contexts/AuthContext";

// Mock the auth context for different scenarios
vi.mock("@/contexts/AuthContext", async () => {
  const actual = await vi.importActual("@/contexts/AuthContext");
  return {
    ...actual,
    useAuth: vi.fn(),
  };
});

import { useAuth } from "@/contexts/AuthContext";
const mockUseAuth = vi.mocked(useAuth);

describe("ProtectedRoute", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("shows loading state when authentication is being checked", () => {
    mockUseAuth.mockReturnValue({
      session: null,
      user: null,
      isLoading: true,
      signOut: vi.fn(),
      signIn: vi.fn(),
      isSessionExpired: false,
    });

    render(
      <MemoryRouter initialEntries={["/protected"]}>
        <Routes>
          <Route
            path="/protected"
            element={
              <ProtectedRoute>
                <div>Protected Content</div>
              </ProtectedRoute>
            }
          />
        </Routes>
      </MemoryRouter>
    );

    expect(screen.getByText("Chargement...")).toBeInTheDocument();
  });

  it("renders children when user is authenticated", async () => {
    mockUseAuth.mockReturnValue({
      session: { user: { id: "123", email: "test@test.com" } } as any,
      user: { id: "123", email: "test@test.com" } as any,
      isLoading: false,
      signOut: vi.fn(),
      signIn: vi.fn(),
      isSessionExpired: false,
    });

    render(
      <MemoryRouter initialEntries={["/protected"]}>
        <Routes>
          <Route
            path="/protected"
            element={
              <ProtectedRoute>
                <div>Protected Content</div>
              </ProtectedRoute>
            }
          />
        </Routes>
      </MemoryRouter>
    );

    expect(screen.getByText("Protected Content")).toBeInTheDocument();
  });

  it("redirects to portal when session is expired", async () => {
    mockUseAuth.mockReturnValue({
      session: null,
      user: null,
      isLoading: false,
      signOut: vi.fn(),
      signIn: vi.fn(),
      isSessionExpired: true,
    });

    render(
      <MemoryRouter initialEntries={["/protected"]}>
        <Routes>
          <Route
            path="/protected"
            element={
              <ProtectedRoute requiredRole="employee">
                <div>Protected Content</div>
              </ProtectedRoute>
            }
          />
          <Route path="/portal" element={<div>Portal Page</div>} />
        </Routes>
      </MemoryRouter>
    );

    await waitFor(() => {
      expect(screen.getByText("Portal Page")).toBeInTheDocument();
    });
  });

  it("redirects to hr-portal for HR required role", async () => {
    mockUseAuth.mockReturnValue({
      session: null,
      user: null,
      isLoading: false,
      signOut: vi.fn(),
      signIn: vi.fn(),
      isSessionExpired: false,
    });

    render(
      <MemoryRouter initialEntries={["/hr"]}>
        <Routes>
          <Route
            path="/hr"
            element={
              <ProtectedRoute requiredRole="hr">
                <div>HR Content</div>
              </ProtectedRoute>
            }
          />
          <Route path="/hr-portal" element={<div>HR Portal Page</div>} />
        </Routes>
      </MemoryRouter>
    );

    await waitFor(() => {
      expect(screen.getByText("HR Portal Page")).toBeInTheDocument();
    });
  });
});
