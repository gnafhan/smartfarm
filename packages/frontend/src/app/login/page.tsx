'use client';

import { useState, FormEvent, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import InputField from '@/components/fields/InputField';
import Default from '@/components/auth/variants/DefaultAuthLayout';
import { useAuthStore } from '@/stores/useAuthStore';

function LoginPage() {
  const router = useRouter();
  const { login, isLoading, error, clearError, isAuthenticated } =
    useAuthStore();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [rememberMe, setRememberMe] = useState(false);

  // Redirect if already authenticated
  useEffect(() => {
    if (isAuthenticated) {
      router.push('/');
    }
  }, [isAuthenticated, router]);

  // Clear error when component mounts or inputs change
  useEffect(() => {
    clearError();
  }, [email, password, clearError]);

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();

    if (!email || !password) {
      return;
    }

    const success = await login({ email, password });

    if (success) {
      router.push('/');
    }
  };

  return (
    <Default
      maincard={
        <div className="mb-16 mt-16 flex h-full w-full items-center justify-center px-2 md:mx-0 md:px-0 lg:mb-10 lg:items-center lg:justify-start">
          {/* Sign in section */}
          <div className="mt-[10vh] w-full max-w-full flex-col items-center md:pl-4 lg:pl-0 xl:max-w-[420px]">
            <h3 className="mb-2.5 text-4xl font-bold text-navy-700 dark:text-white">
              Masuk
            </h3>
            <p className="mb-9 ml-1 text-base text-gray-600">
              Masukkan email dan kata sandi Anda untuk masuk!
            </p>

            {/* Error message */}
            {error && (
              <div className="mb-4 rounded-lg bg-red-50 p-4 text-sm text-red-600 dark:bg-red-900/20 dark:text-red-400">
                {error}
              </div>
            )}

            <form onSubmit={handleSubmit}>
              {/* Email */}
              <InputField
                variant="auth"
                extra="mb-3"
                label="Email*"
                placeholder="email@contoh.com"
                id="email"
                type="email"
                onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                  setEmail(e.target.value)
                }
                disabled={isLoading}
              />

              {/* Password */}
              <InputField
                variant="auth"
                extra="mb-3"
                label="Kata Sandi*"
                placeholder="Min. 8 karakter"
                id="password"
                type="password"
                onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                  setPassword(e.target.value)
                }
                disabled={isLoading}
              />

              {/* Remember me checkbox */}
              <div className="mb-4 flex items-center justify-between px-2">
                <div className="mt-2 flex items-center">
                  <input
                    type="checkbox"
                    id="remember"
                    checked={rememberMe}
                    onChange={(e) => setRememberMe(e.target.checked)}
                    className="h-4 w-4 rounded border-gray-300 text-brand-500 focus:ring-brand-500"
                    disabled={isLoading}
                  />
                  <label
                    htmlFor="remember"
                    className="ml-2 text-sm font-medium text-navy-700 dark:text-white"
                  >
                    Tetap masuk
                  </label>
                </div>
              </div>

              {/* Submit button */}
              <button
                type="submit"
                disabled={isLoading || !email || !password}
                className="linear w-full rounded-xl bg-brand-500 py-3 text-base font-medium text-white transition duration-200 hover:bg-brand-600 active:bg-brand-700 disabled:cursor-not-allowed disabled:opacity-50 dark:bg-brand-400 dark:text-white dark:hover:bg-brand-300 dark:active:bg-brand-200"
              >
                {isLoading ? (
                  <span className="flex items-center justify-center">
                    <svg
                      className="-ml-1 mr-3 h-5 w-5 animate-spin text-white"
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
                    Masuk...
                  </span>
                ) : (
                  'Masuk'
                )}
              </button>
            </form>
          </div>
        </div>
      }
    />
  );
}

export default LoginPage;
