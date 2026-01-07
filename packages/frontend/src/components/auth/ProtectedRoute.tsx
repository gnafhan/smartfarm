'use client';

import { useEffect, ReactNode } from 'react';
import { useRouter } from 'next/navigation';
import { useAuthStore } from '../../stores/useAuthStore';

interface ProtectedRouteProps {
  children: ReactNode;
  requiredRole?: 'admin' | 'farmer';
}

/**
 * ProtectedRoute component that wraps protected pages/layouts.
 * Redirects unauthenticated users to login page.
 * Optionally restricts access based on user role.
 */
export function ProtectedRoute({
  children,
  requiredRole,
}: ProtectedRouteProps) {
  const router = useRouter();
  const { isAuthenticated, user, isLoading } = useAuthStore();

  useEffect(() => {
    // Wait for auth state to be loaded
    if (isLoading) return;

    // Redirect to login if not authenticated
    if (!isAuthenticated) {
      router.push('/login');
      return;
    }

    // Check role-based access
    if (requiredRole && user?.role !== requiredRole) {
      // If user doesn't have required role, redirect to home
      // Admin can access everything, farmer cannot access admin-only routes
      if (requiredRole === 'admin' && user?.role === 'farmer') {
        router.push('/');
      }
    }
  }, [isAuthenticated, isLoading, requiredRole, router, user?.role]);

  // Show loading state
  if (isLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-gray-100 dark:bg-navy-900">
        <div className="flex flex-col items-center">
          <svg
            className="h-10 w-10 animate-spin text-brand-500"
            xmlns="http://www.w3.org/2000/svg"
            fill="none"
            viewBox="0 0 24 24"
          >
            <circle
              className="opacity-25"
              cx="12"
              cy="12"
              r="10"
              stroke="currentColor"
              strokeWidth="4"
            ></circle>
            <path
              className="opacity-75"
              fill="currentColor"
              d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
            ></path>
          </svg>
          <p className="mt-4 text-gray-600 dark:text-gray-400">Memuat...</p>
        </div>
      </div>
    );
  }

  // Don't render children if not authenticated
  if (!isAuthenticated) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-gray-100 dark:bg-navy-900">
        <div className="flex flex-col items-center">
          <svg
            className="h-10 w-10 animate-spin text-brand-500"
            xmlns="http://www.w3.org/2000/svg"
            fill="none"
            viewBox="0 0 24 24"
          >
            <circle
              className="opacity-25"
              cx="12"
              cy="12"
              r="10"
              stroke="currentColor"
              strokeWidth="4"
            ></circle>
            <path
              className="opacity-75"
              fill="currentColor"
              d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
            ></path>
          </svg>
          <p className="mt-4 text-gray-600 dark:text-gray-400">
            Redirecting to login...
          </p>
        </div>
      </div>
    );
  }

  // Check role access
  if (requiredRole && user?.role !== requiredRole) {
    if (requiredRole === 'admin' && user?.role === 'farmer') {
      return (
        <div className="flex min-h-screen items-center justify-center bg-gray-100 dark:bg-navy-900">
          <div className="text-center">
            <h1 className="text-2xl font-bold text-gray-800 dark:text-white">
              Access Denied
            </h1>
            <p className="mt-2 text-gray-600 dark:text-gray-400">
              You don&apos;t have permission to access this page.
            </p>
          </div>
        </div>
      );
    }
  }

  return <>{children}</>;
}

export default ProtectedRoute;
