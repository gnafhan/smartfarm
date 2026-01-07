'use client';

import { usePathname } from 'next/navigation';
import { useState } from 'react';
import { isWindowAvailable } from '@/utils/navigation';
import React from 'react';
import Navbar from '@/components/navbar';
import Sidebar from '@/components/sidebar';
import Footer from '@/components/footer/Footer';
import { ProtectedRoute } from '@/components/auth/ProtectedRoute';
import AlertBanner from '@/components/alerts/AlertBanner';
import routes from '@/routes';

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const [open, setOpen] = useState(false);
  const pathname = usePathname();

  if (isWindowAvailable()) document.documentElement.dir = 'ltr';

  // Get active route name for navbar
  const getActiveRouteName = () => {
    const route = routes.find((r) => r.path === pathname);
    return route?.name || 'Dashboard';
  };

  return (
    <ProtectedRoute>
      <div className="flex h-full w-full bg-background-100 dark:bg-background-900">
        <Sidebar
          routes={routes}
          open={open}
          setOpen={setOpen}
          variant="admin"
        />
        {/* Navbar & Main Content */}
        <div className="h-full w-full font-dm dark:bg-navy-900">
          {/* Main Content */}
          <main
            className={`flex-none transition-all dark:bg-navy-900 
                xl:ml-[313px]`}
          >
            {/* Routes */}
            <div className="h-full">
              <div className="px-4 pt-5 md:px-8 md:pt-6">
                <Navbar
                  onOpenSidenav={() => setOpen(!open)}
                  brandText={getActiveRouteName()}
                  secondary={false}
                />
              </div>
              <div className="mx-auto min-h-screen px-4 pb-6 pt-5 md:px-8 md:pt-6">
                {/* Alert Banner */}
                <AlertBanner />
                {children}
              </div>
              <div className="px-4 py-3 md:px-8">
                <Footer />
              </div>
            </div>
          </main>
        </div>
      </div>
    </ProtectedRoute>
  );
}
