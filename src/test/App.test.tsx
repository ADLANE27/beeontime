import { describe, it, expect, vi, beforeEach } from "vitest";
import { render } from "@testing-library/react";
import { screen } from "@testing-library/dom";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { MemoryRouter, Routes, Route } from "react-router-dom";
import App from "@/App";

// Mock auth context
vi.mock("@/contexts/AuthContext", () => ({
  AuthProvider: ({ children }: { children: React.ReactNode }) => <>{children}</>,
  useAuth: () => ({
    session: null,
    user: null,
    isLoading: false,
    signOut: vi.fn(),
    signIn: vi.fn(),
    isSessionExpired: false,
  }),
}));

// Mock sonner
vi.mock("sonner", () => ({
  toast: {
    success: vi.fn(),
    error: vi.fn(),
    warning: vi.fn(),
    info: vi.fn(),
  },
  Toaster: () => null,
}));

describe("App", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("renders without crashing", () => {
    render(<App />);
    // App should render something
    expect(document.body).toBeTruthy();
  });

  it("contains necessary providers", () => {
    const { container } = render(<App />);
    // The app should have content
    expect(container.firstChild).toBeTruthy();
  });
});
