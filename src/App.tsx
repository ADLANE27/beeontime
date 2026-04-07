
import { useState, useEffect, lazy, Suspense } from "react";
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import Portal from "./pages/Portal";
import HRPortal from "./pages/HRPortal";
import RoleSelector from "./pages/RoleSelector";
const EmployeeDashboard = lazy(() => import("./pages/employee/EmployeeDashboard"));
const HRDashboard = lazy(() => import("./pages/hr/HRDashboard"));
import { ErrorBoundary } from "./components/ErrorBoundary";
import { AuthProvider } from "./contexts/AuthContext";
import { supabase } from "./integrations/supabase/client";
import { toast } from "sonner";
import { ProtectedRoute } from "./components/auth/ProtectedRoute";
import { ThemeProvider } from "./components/theme/ThemeProvider";

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: 1,
      refetchOnWindowFocus: false,
      // Using the updated error handling pattern
      meta: {
        onError: (error: Error) => {
          console.error('Query error:', error);
          toast.error("Erreur lors de la récupération des données");
        }
      }
    },
    mutations: {
      // Using the updated error handling pattern
      meta: {
        onError: (error: Error) => {
          console.error('Mutation error:', error);
          toast.error("Erreur lors de la modification des données");
        }
      }
    }
  },
});

import { Skeleton } from "@/components/ui/skeleton";

const RouteFallback = () => (
  <div className="min-h-screen w-full bg-background">
    <header className="sticky top-0 z-30 border-b border-border/50 bg-background/80 backdrop-blur">
      <div className="mx-auto flex h-16 max-w-full items-center justify-end gap-2 px-6 sm:h-20 sm:px-10">
        <Skeleton className="h-10 w-10 rounded-xl" />
        <Skeleton className="h-10 w-32 rounded-xl" />
      </div>
    </header>
    <main className="mx-auto max-w-full space-y-6 px-6 py-10 sm:px-10">
      <Skeleton className="h-32 w-full rounded-2xl" />
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <Skeleton className="h-24 rounded-xl" />
        <Skeleton className="h-24 rounded-xl" />
        <Skeleton className="h-24 rounded-xl" />
        <Skeleton className="h-24 rounded-xl" />
      </div>
      <Skeleton className="h-96 w-full rounded-2xl" />
    </main>
  </div>
);

const App = () => (
  <ErrorBoundary>
    <ThemeProvider>
    <QueryClientProvider client={queryClient}>
      <AuthProvider>
        <TooltipProvider>
          <Toaster />
          <Sonner />
          <BrowserRouter>
            <Routes>
              <Route path="/" element={<RoleSelector />} />
              <Route path="/portal" element={<Portal />} />
              <Route path="/hr-portal" element={<HRPortal />} />
              <Route
                path="/employee/*"
                element={
                  <ProtectedRoute requiredRole="employee">
                    <Suspense fallback={<RouteFallback />}>
                      <EmployeeDashboard />
                    </Suspense>
                  </ProtectedRoute>
                }
              />
              <Route
                path="/hr/*"
                element={
                  <ProtectedRoute requiredRole="hr">
                    <Suspense fallback={<RouteFallback />}>
                      <HRDashboard />
                    </Suspense>
                  </ProtectedRoute>
                }
              />
              <Route path="*" element={<Navigate to="/" replace />} />
            </Routes>
          </BrowserRouter>
        </TooltipProvider>
      </AuthProvider>
    </QueryClientProvider>
    </ThemeProvider>
  </ErrorBoundary>
);

export default App;
