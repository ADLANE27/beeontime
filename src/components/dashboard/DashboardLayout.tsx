import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Clock, Calendar, FileText, Clock4 } from "lucide-react";

interface DashboardLayoutProps {
  children: React.ReactNode;
}

export const DashboardLayout = ({ children }: DashboardLayoutProps) => {
  return (
    <div className="min-h-screen bg-gray-50">
      <nav className="bg-white border-b border-gray-200 fixed w-full z-30 top-0">
        <div className="px-3 py-3 lg:px-5 lg:pl-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center justify-start">
              <h1 className="text-xl font-bold leading-tight tracking-tight text-gray-900 md:text-2xl">
                HR Management System
              </h1>
            </div>
            <div className="flex items-center">
              <Button variant="outline" className="mr-2">
                <Clock className="mr-2 h-4 w-4" />
                Clock In/Out
              </Button>
            </div>
          </div>
        </div>
      </nav>

      <div className="flex overflow-hidden pt-16">
        <aside className="fixed z-20 h-full top-0 left-0 pt-16 flex lg:flex flex-shrink-0 flex-col w-64 transition-width duration-75">
          <div className="relative flex-1 flex flex-col min-h-0 border-r border-gray-200 bg-white pt-0">
            <div className="flex-1 flex flex-col pt-5 pb-4 overflow-y-auto">
              <div className="flex-1 px-3 bg-white divide-y space-y-1">
                <ul className="space-y-2 pb-2">
                  <li>
                    <Button variant="ghost" className="w-full justify-start">
                      <Calendar className="mr-2 h-4 w-4" />
                      Présences
                    </Button>
                  </li>
                  <li>
                    <Button variant="ghost" className="w-full justify-start">
                      <FileText className="mr-2 h-4 w-4" />
                      Congés
                    </Button>
                  </li>
                  <li>
                    <Button variant="ghost" className="w-full justify-start">
                      <Clock4 className="mr-2 h-4 w-4" />
                      Heures Supp.
                    </Button>
                  </li>
                </ul>
              </div>
            </div>
          </div>
        </aside>

        <div className="bg-gray-50 lg:ml-64 overflow-y-auto w-full h-full">
          <main className="flex-1 relative z-0 overflow-y-auto py-6 px-4 sm:px-6 lg:px-8 h-full">
            {children}
          </main>
        </div>
      </div>
    </div>
  );
};