import { describe, it, expect, vi } from "vitest";
import { render, waitFor, fireEvent } from "@testing-library/react";
import { screen } from "@testing-library/dom";
import { MemoryRouter } from "react-router-dom";
import { DashboardLayout } from "@/components/dashboard/DashboardLayout";
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

    // Should show "Quitter" on mobile view
    expect(screen.getByText("Quitter")).toBeInTheDocument();
  });

  it("calls signOut when logout button is clicked", async () => {
    render(
      <MemoryRouter>
        <DashboardLayout>
          <div>Content</div>
        </DashboardLayout>
      </MemoryRouter>
    );

    const logoutButton = screen.getByRole("button");
    fireEvent.click(logoutButton);

    await waitFor(() => {
      expect(supabase.auth.signOut).toHaveBeenCalled();
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

    // Check for header element
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
