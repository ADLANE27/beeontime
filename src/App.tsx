
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

const RouteFallback = () => (
  <div className="flex min-h-screen items-center justify-center bg-background">
    <div className="h-10 w-10 animate-spin rounded-full border-b-2 border-primary" />
  </div>
);

const App = () => (
  <ErrorBoundary>
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
  </ErrorBoundary>
);

export default App;
