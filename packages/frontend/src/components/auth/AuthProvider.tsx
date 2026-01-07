'use client';

import { useEffect, useState, ReactNode } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import { useAuthStore } from '../../stores/useAuthStore';

// Public routes that don't require authentication
const PUBLIC_ROUTES = [
  '/login',
  '/auth/sign-in',
  '/livestock/public', // Public QR code pages
];

// Check if a path is public
const isPublicRoute = (pathname: string): boolean => {
  return PUBLIC_ROUTES.some(
    (route) => pathname === route || pathname.startsWith(`${route}/`)
  );
};

interface AuthProviderProps {
  children: ReactNode;
}

export function AuthProvider({ children }: AuthProviderProps) {
  const router = useRouter();
  const pathname = usePathname();
  const { isAuthenticated, isLoading, fetchProfile, accessToken } =
    useAuthStore();
  const [isInitialized, setIsInitialized] = useState(false);

  // Initialize auth state on mount
  useEffect(() => {
    const initAuth = async () => {
      // If we have a token but no user, fetch the profile
      if (accessToken && !isLoading) {
        await fetchProfile();
      }
      setIsInitialized(true);
    };

    initAuth();
  }, [accessToken, fetchProfile, isLoading]);

  // Handle route protection
  useEffect(() => {
    if (!isInitialized) return;

    const isPublic = isPublicRoute(pathname);

    // If not authenticated and trying to access protected route
    if (!isAuthenticated && !isPublic) {
      router.push('/login');
    }

    // If authenticated and trying to access login page
    if (isAuthenticated && pathname === '/login') {
      router.push('/');
    }
  }, [isAuthenticated, pathname, router, isInitialized]);

  // Show loading state while initializing
  if (!isInitialized) {
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
          <p className="mt-4 text-gray-600 dark:text-gray-400">Mengalihkan...</p>
        </div>
      </div>
    );
  }

  // If not authenticated and on protected route, show loading while redirecting
  const isPublic = isPublicRoute(pathname);
  if (!isAuthenticated && !isPublic) {
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

  return <>{children}</>;
}

export default AuthProvider;
