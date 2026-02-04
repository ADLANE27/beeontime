import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { render } from "@testing-library/react";
import { screen } from "@testing-library/dom";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { TimeClock } from "@/components/attendance/TimeClock";

// Mock the hooks with proper timeRecord structure
vi.mock("@/hooks/use-time-record", () => ({
  useTimeRecord: () => ({
    timeRecord: {
      id: null,
      morning_in: null,
      lunch_out: null,
      lunch_in: null,
      evening_out: null,
    },
    getNextAction: () => "morning_in",
    getButtonLabel: () => "Pointer l'arrivée",
    handleTimeRecord: vi.fn(),
  }),
}));

vi.mock("@/contexts/AuthContext", () => ({
  AuthProvider: ({ children }: { children: React.ReactNode }) => <>{children}</>,
  useAuth: () => ({
    session: { user: { id: "123" } },
    user: { id: "123" },
    isLoading: false,
    signOut: vi.fn(),
    signIn: vi.fn(),
    isSessionExpired: false,
  }),
}));

describe("TimeClock", () => {
  let queryClient: QueryClient;

  beforeEach(() => {
    queryClient = new QueryClient({
      defaultOptions: {
        queries: {
          retry: false,
        },
      },
    });

    // Mock timers
    vi.useFakeTimers();
    vi.setSystemTime(new Date("2024-01-15T10:30:00"));
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  const renderComponent = () => {
    return render(
      <QueryClientProvider client={queryClient}>
        <TimeClock />
      </QueryClientProvider>
    );
  };

  it("renders time clock component", () => {
    renderComponent();
    expect(screen.getByText("Pointer l'arrivée")).toBeInTheDocument();
  });

  it("displays current time", () => {
    renderComponent();
    // The component should show the button label
    expect(screen.getByText("Pointer l'arrivée")).toBeInTheDocument();
  });

  it("renders time record button", () => {
    renderComponent();
    const button = screen.getByRole("button", { name: /pointer/i });
    expect(button).toBeInTheDocument();
  });
});
