import { describe, it, expect, vi } from "vitest";
import { render, waitFor, fireEvent } from "@testing-library/react";
import { screen } from "@testing-library/dom";
import { MemoryRouter } from "react-router-dom";

vi.mock("sonner", () => ({
  toast: {
    success: vi.fn(),
    error: vi.fn(),
    warning: vi.fn(),
    info: vi.fn(),
  },
}));

const signOutMock = vi.fn();

vi.mock("@/contexts/AuthContext", () => ({
  useAuth: () => ({
    session: { user: { id: "u1", email: "test@example.com" } },
    user: { id: "u1", email: "test@example.com" },
    isLoading: false,
    isSessionExpired: false,
    signIn: vi.fn(),
    signOut: signOutMock,
  }),
  AuthProvider: ({ children }: { children: React.ReactNode }) => <>{children}</>,
}));

import { DashboardLayout } from "@/components/dashboard/DashboardLayout";

describe("DashboardLayout", () => {
  it("renders children content", () => {
    render(
      <MemoryRouter>
        <DashboardLayout>
          <div>Dashboard Content</div>
        </DashboardLayout>
      </MemoryRouter>
    );

    expect(screen.getByText("Dashboard Content")).toBeInTheDocument();
  });

  it("renders logout button", () => {
    render(
      <MemoryRouter>
        <DashboardLayout>
          <div>Content</div>
        </DashboardLayout>
      </MemoryRouter>
    );

    expect(screen.getByRole("button", { name: /se déconnecter/i })).toBeInTheDocument();
  });

  it("calls signOut when logout button is clicked", async () => {
    signOutMock.mockClear();
    render(
      <MemoryRouter>
        <DashboardLayout>
          <div>Content</div>
        </DashboardLayout>
      </MemoryRouter>
    );

    const logoutButton = screen.getByRole("button", { name: /se déconnecter/i });
    fireEvent.click(logoutButton);

    await waitFor(() => {
      expect(signOutMock).toHaveBeenCalled();
    });
  });

  it("has proper header structure", () => {
    render(
      <MemoryRouter>
        <DashboardLayout>
          <div>Content</div>
        </DashboardLayout>
      </MemoryRouter>
    );

    const header = document.querySelector("header");
    expect(header).toBeInTheDocument();
    expect(header).toHaveClass("sticky");
  });

  it("renders main content area", () => {
    render(
      <MemoryRouter>
        <DashboardLayout>
          <div data-testid="main-content">Main Content</div>
        </DashboardLayout>
      </MemoryRouter>
    );

    const main = document.querySelector("main");
    expect(main).toBeInTheDocument();
    expect(screen.getByTestId("main-content")).toBeInTheDocument();
  });
});
