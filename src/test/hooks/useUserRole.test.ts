
import { describe, it, expect, vi, beforeEach } from "vitest";
import { renderHook, waitFor } from "@testing-library/react";
import { useUserRole } from "@/hooks/useUserRole";

// Mock the auth context
vi.mock("@/contexts/AuthContext", () => ({
  useAuth: vi.fn(),
}));

// Mock the supabase client
vi.mock("@/integrations/supabase/client", () => ({
  supabase: {
    from: vi.fn(() => ({
      select: vi.fn(() => ({
        eq: vi.fn(() => ({
          maybeSingle: vi.fn(),
        })),
      })),
    })),
  },
}));

import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";

const mockUseAuth = vi.mocked(useAuth);

describe("useUserRole", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("returns null role when no user is authenticated", async () => {
    mockUseAuth.mockReturnValue({
      session: null,
      user: null,
      isLoading: false,
      signOut: vi.fn(),
      signIn: vi.fn(),
      isSessionExpired: false,
    });

    const { result } = renderHook(() => useUserRole());

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false);
    });

    expect(result.current.role).toBe(null);
    expect(result.current.hasRole("hr")).toBe(false);
    expect(result.current.hasRole("employee")).toBe(false);
  });

  it("hasRole returns true for HR accessing any route", async () => {
    mockUseAuth.mockReturnValue({
      session: { user: { id: "123" } } as any,
      user: { id: "123" } as any,
      isLoading: false,
      signOut: vi.fn(),
      signIn: vi.fn(),
      isSessionExpired: false,
    });

    const mockMaybeSingle = vi.fn().mockResolvedValue({
      data: { role: "hr" },
      error: null,
    });

    vi.mocked(supabase.from).mockReturnValue({
      select: vi.fn().mockReturnValue({
        eq: vi.fn().mockReturnValue({
          maybeSingle: mockMaybeSingle,
        }),
      }),
    } as any);

    const { result } = renderHook(() => useUserRole());

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false);
    });

    expect(result.current.role).toBe("hr");
    expect(result.current.hasRole("hr")).toBe(true);
    expect(result.current.hasRole("employee")).toBe(true); // HR can access employee routes
  });

  it("hasRole returns false for employee accessing HR route", async () => {
    mockUseAuth.mockReturnValue({
      session: { user: { id: "456" } } as any,
      user: { id: "456" } as any,
      isLoading: false,
      signOut: vi.fn(),
      signIn: vi.fn(),
      isSessionExpired: false,
    });

    const mockMaybeSingle = vi.fn().mockResolvedValue({
      data: { role: "employee" },
      error: null,
    });

    vi.mocked(supabase.from).mockReturnValue({
      select: vi.fn().mockReturnValue({
        eq: vi.fn().mockReturnValue({
          maybeSingle: mockMaybeSingle,
        }),
      }),
    } as any);

    const { result } = renderHook(() => useUserRole());

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false);
    });

    expect(result.current.role).toBe("employee");
    expect(result.current.hasRole("hr")).toBe(false); // Employee cannot access HR routes
    expect(result.current.hasRole("employee")).toBe(true);
  });
});
