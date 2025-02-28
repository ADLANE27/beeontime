
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Download, FileText, Calendar, Loader2, FileSearch, File, RefreshCw } from "lucide-react";
import { toast } from "sonner";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { useState, useEffect, useRef } from "react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { format } from "date-fns";
import { fr } from "date-fns/locale";
import { useAuth } from "@/contexts/AuthContext";

export const PayslipList = () => {
  const { session } = useAuth();
  const [downloadingDoc, setDownloadingDoc] = useState<string | null>(null);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [loadTimeout, setLoadTimeout] = useState(false);
  const timeoutRef = useRef<number | null>(null);
  const mountedRef = useRef(true);

  useEffect(() => {
    // Component mounted
    mountedRef.current = true;
    
    // Set a timeout to show a manual refresh option if loading takes too long
    timeoutRef.current = window.setTimeout(() => {
      if (mountedRef.current) {
        setLoadTimeout(true);
      }
    }, 3000);

    // Cleanup function
    return () => {
      mountedRef.current = false;
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
    };
  }, []);

  // Verify authentication first before attempting to fetch data
  const isAuthenticated = !!session?.user?.id;
  
  // Modified payslips query with better error handling, auth check, and retry logic
  const { 
    data: payslips = [], 
    isLoading: isLoadingPayslips, 
    error: payslipError, 
    refetch: refetchPayslips,
    isError: isPayslipError,
    status: payslipStatus
  } = useQuery({
    queryKey: ['payslips', session?.user?.id],
    queryFn: async () => {
      console.log('Fetching payslips...');
      if (!session || !session.user) {
        console.error('No active session - aborting payslips fetch');
        throw new Error("Authentification requise");
      }

      console.log('Payslips fetch - User ID:', session.user.id);
      
      try {
        const { data, error } = await supabase
          .from('documents')
          .select('*')
          .eq('employee_id', session.user.id)
          .eq('type', 'payslip');

        if (error) {
          console.error('Error fetching payslips:', error);
          throw error;
        }

        console.log('Payslips fetched successfully:', data?.length || 0, 'items');
        return data || [];
      } catch (err) {
        console.error('Exception in payslip fetch:', err);
        throw err;
      }
    },
    enabled: isAuthenticated, // Only run query if authenticated
    retry: 1,
    retryDelay: 1000,
    staleTime: 300000, // 5 minutes
    gcTime: 600000, // 10 minutes (previously called cacheTime)
  });

  // Modified important documents query with better error handling and retry logic
  const { 
    data: importantDocuments = [], 
    isLoading: isLoadingDocs, 
    error: docsError, 
    refetch: refetchDocs,
    isError: isDocsError
  } = useQuery({
    queryKey: ['important_documents'],
    queryFn: async () => {
      console.log('Fetching important documents...');
      
      try {
        const { data, error } = await supabase
          .from('documents')
          .select('*')
          .is('employee_id', null)
          .eq('type', 'important_document');

        if (error) {
          console.error('Error fetching important documents:', error);
          throw error;
        }

        console.log('Important documents fetched successfully:', data?.length || 0, 'items');
        return data || [];
      } catch (err) {
        console.error('Exception in documents fetch:', err);
        throw err;
      }
    },
    retry: 1,
    retryDelay: 1000,
    staleTime: 300000, // 5 minutes
    gcTime: 600000, // 10 minutes
  });

  // Set error state on query failures
  useEffect(() => {
    if (isPayslipError || isDocsError) {
      const errorMessage = isPayslipError 
        ? 'Erreur de chargement des bulletins de paie: ' + (payslipError instanceof Error ? payslipError.message : 'Erreur inconnue')
        : 'Erreur de chargement des documents: ' + (docsError instanceof Error ? docsError.message : 'Erreur inconnue');
      
      console.error('Document loading error:', payslipError || docsError);
      setLoadError(errorMessage);
      
      // Show a toast for error feedback
      if (mountedRef.current) {
        toast.error(errorMessage);
      }
    }
  }, [isPayslipError, isDocsError, payslipError, docsError]);

  const handleDownload = async (fileUrl: string, title: string) => {
    try {
      setDownloadingDoc(fileUrl);
      const { data, error } = await supabase.storage
        .from('documents')
        .download(fileUrl);

      if (error) {
        console.error('Error downloading file:', error);
        toast.error("Erreur lors du téléchargement du document");
        return;
      }

      // Create a download link
      const url = URL.createObjectURL(data);
      const a = document.createElement('a');
      a.href = url;
      a.download = title;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);

      toast.success(`Téléchargement de ${title} réussi`);
    } catch (error) {
      console.error('Error downloading document:', error);
      toast.error("Erreur lors du téléchargement du document");
    } finally {
      setDownloadingDoc(null);
    }
  };

  // Manual refresh function with proper state reset
  const handleRefresh = () => {
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
    }
    
    setLoadError(null);
    setLoadTimeout(false);
    refetchPayslips();
    refetchDocs();
    
    // Set a new timeout
    timeoutRef.current = window.setTimeout(() => {
      if (mountedRef.current) {
        setLoadTimeout(true);
      }
    }, 3000);
  };

  // Authentication check - show friendly message if not authenticated
  if (!isAuthenticated && !isLoadingPayslips) {
    return (
      <Card className="p-6">
        <div className="flex flex-col items-center justify-center py-8 space-y-4">
          <div className="text-amber-500">
            <FileSearch className="h-12 w-12 mx-auto" />
          </div>
          <p className="text-gray-700 text-center">Authentification requise</p>
          <p className="text-sm text-gray-500 text-center">Veuillez vous connecter pour accéder à vos documents</p>
          <Button onClick={handleRefresh} variant="outline" className="mt-4">
            <RefreshCw className="mr-2 h-4 w-4" />
            Réessayer
          </Button>
        </div>
      </Card>
    );
  }

  // Show error state with refresh button
  if (loadError) {
    return (
      <Card className="p-6">
        <div className="flex flex-col items-center justify-center py-8 space-y-4">
          <div className="text-red-500">
            <FileSearch className="h-12 w-12 mx-auto" />
          </div>
          <p className="text-gray-700 text-center">Une erreur s'est produite lors du chargement des documents</p>
          <p className="text-sm text-gray-500 text-center">{loadError}</p>
          <Button onClick={handleRefresh} variant="outline" className="mt-4">
            <RefreshCw className="mr-2 h-4 w-4" />
            Réessayer
          </Button>
        </div>
      </Card>
    );
  }

  // Show loading state with timeout detection
  if (isLoadingPayslips || isLoadingDocs) {
    return (
      <Card className="p-6">
        <div className="flex flex-col items-center justify-center py-8 space-y-4">
          <Loader2 className="h-8 w-8 animate-spin text-blue-500" />
          <p className="text-gray-600">Chargement des documents...</p>
          {loadTimeout && (
            <Button onClick={handleRefresh} variant="ghost" size="sm" className="text-xs text-blue-500 hover:text-blue-700">
              Le chargement est long? Cliquez ici pour rafraîchir
            </Button>
          )}
        </div>
      </Card>
    );
  }

  return (
    <Tabs defaultValue="payslips" className="space-y-4">
      <TabsList>
        <TabsTrigger value="payslips">Bulletins de paie</TabsTrigger>
        <TabsTrigger value="documents">Documents importants</TabsTrigger>
      </TabsList>

      <TabsContent value="payslips">
        <Card className="p-6">
          <h2 className="text-2xl font-bold mb-6 flex items-center gap-2">
            <FileText className="h-6 w-6 text-blue-500" />
            Bulletins de paie
          </h2>
          <div className="space-y-4">
            {payslips.length === 0 ? (
              <div className="text-center py-12 bg-gray-50 rounded-lg border border-dashed border-gray-300">
                <FileSearch className="h-10 w-10 text-gray-400 mx-auto mb-3" />
                <p className="text-gray-500 text-lg">Aucun bulletin de paie disponible</p>
                <p className="text-gray-400 text-sm mt-1">Vos bulletins apparaîtront ici une fois qu'ils seront chargés par le service RH</p>
              </div>
            ) : (
              <div className="rounded-lg border overflow-hidden shadow-sm hover:shadow-md transition-shadow">
                <div className="divide-y divide-gray-100">
                  {payslips
                    .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())
                    .map((payslip) => (
                    <div
                      key={payslip.id}
                      className="flex items-center justify-between p-4 hover:bg-gray-50 transition-colors"
                    >
                      <div className="flex items-center space-x-3">
                        <div className="p-2 bg-blue-50 rounded-full">
                          <FileText className="h-5 w-5 text-blue-500" />
                        </div>
                        <div>
                          <p className="font-medium text-gray-800">{payslip.title}</p>
                          <p className="text-sm text-gray-500">
                            <Calendar className="h-3.5 w-3.5 inline mr-1" />
                            {format(new Date(payslip.created_at), "dd MMMM yyyy", { locale: fr })}
                          </p>
                        </div>
                      </div>
                      <Button 
                        variant="outline" 
                        size="sm"
                        onClick={() => handleDownload(payslip.file_path, payslip.title)}
                        disabled={downloadingDoc === payslip.file_path}
                        className="border-blue-200 text-blue-600 hover:bg-blue-50 hover:text-blue-700"
                      >
                        {downloadingDoc === payslip.file_path ? (
                          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        ) : (
                          <Download className="mr-2 h-4 w-4" />
                        )}
                        Télécharger
                      </Button>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </Card>
      </TabsContent>

      <TabsContent value="documents">
        <Card className="p-6">
          <h2 className="text-2xl font-bold mb-6 flex items-center gap-2">
            <FileText className="h-6 w-6 text-green-500" />
            Documents importants
          </h2>
          <div className="space-y-4">
            {importantDocuments.length === 0 ? (
              <div className="text-center py-12 bg-gray-50 rounded-lg border border-dashed border-gray-300">
                <FileSearch className="h-10 w-10 text-gray-400 mx-auto mb-3" />
                <p className="text-gray-500 text-lg">Aucun document important disponible</p>
                <p className="text-gray-400 text-sm mt-1">Les documents importants de l'entreprise apparaîtront ici</p>
              </div>
            ) : (
              <div className="rounded-lg border overflow-hidden shadow-sm hover:shadow-md transition-shadow">
                <div className="divide-y divide-gray-100">
                  {importantDocuments
                    .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())
                    .map((doc) => (
                    <div
                      key={doc.id}
                      className="flex items-center justify-between p-4 hover:bg-gray-50 transition-colors"
                    >
                      <div className="flex items-center space-x-3">
                        <div className="p-2 bg-green-50 rounded-full">
                          <FileText className="h-5 w-5 text-green-500" />
                        </div>
                        <div>
                          <p className="font-medium text-gray-800">{doc.title}</p>
                          <p className="text-sm text-gray-500">
                            <Calendar className="h-3.5 w-3.5 inline mr-1" />
                            {format(new Date(doc.created_at), "dd MMMM yyyy", { locale: fr })}
                          </p>
                        </div>
                      </div>
                      <Button 
                        variant="outline" 
                        size="sm"
                        onClick={() => handleDownload(doc.file_path, doc.title)}
                        disabled={downloadingDoc === doc.file_path}
                        className="border-green-200 text-green-600 hover:bg-green-50 hover:text-green-700"
                      >
                        {downloadingDoc === doc.file_path ? (
                          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        ) : (
                          <Download className="mr-2 h-4 w-4" />
                        )}
                        Télécharger
                      </Button>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </Card>
      </TabsContent>
    </Tabs>
  );
};
