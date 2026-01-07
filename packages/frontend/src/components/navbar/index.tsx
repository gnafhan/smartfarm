import React from 'react';
import Dropdown from '@/components/dropdown';
import { FiAlignJustify } from 'react-icons/fi';
import NavLink from '@/components/link/NavLink';
import Link from 'next/link';
import { RiMoonFill, RiSunFill } from 'react-icons/ri';
import { IoMdNotificationsOutline } from 'react-icons/io';
import { MdPerson, MdLogout } from 'react-icons/md';
import { useAuthStore } from '../../stores/useAuthStore';
import { useRouter } from 'next/navigation';

const Navbar = (props: {
  onOpenSidenav: () => void;
  brandText: string;
  secondary?: boolean | string;
  [x: string]: any;
}) => {
  const { onOpenSidenav, brandText } = props;
  const { user, logout } = useAuthStore();
  const router = useRouter();
  
  const [darkmode, setDarkmode] = React.useState(
    typeof document !== 'undefined' && document.body.classList.contains('dark'),
  );

  const handleLogout = () => {
    logout();
    router.push('/login');
  };

  return (
    <nav className="sticky top-0 z-40 flex flex-row flex-wrap items-center justify-between rounded-xl bg-white/10 p-4 backdrop-blur-xl dark:bg-[#0b14374d] md:p-5">
      <div className="ml-2">
        <div className="h-6 w-[224px] pt-1">
          <Link
            className="text-sm font-normal text-navy-700 hover:underline dark:text-white dark:hover:text-white"
            href="/"
          >
            Dashboard
            <span className="mx-1 text-sm text-navy-700 hover:text-navy-700 dark:text-white">
              {' '}
              /{' '}
            </span>
          </Link>
          <NavLink
            className="text-sm font-normal capitalize text-navy-700 hover:underline dark:text-white dark:hover:text-white"
            href="#"
          >
            {brandText}
          </NavLink>
        </div>
        <p className="shrink text-[33px] capitalize text-navy-700 dark:text-white">
          <NavLink
            href="#"
            className="font-bold capitalize hover:text-navy-700 dark:hover:text-white"
          >
            {brandText}
          </NavLink>
        </p>
      </div>

      <div className="relative mt-[3px] flex h-[61px] w-auto flex-grow items-center justify-end gap-2 rounded-full bg-white px-2 py-2 shadow-xl shadow-shadow-500 dark:!bg-navy-800 dark:shadow-none md:w-auto md:flex-grow-0 md:gap-1 xl:gap-2">
        <span
          className="flex cursor-pointer text-xl text-gray-600 dark:text-white xl:hidden touch-manipulation p-2 min-h-[44px] min-w-[44px] items-center justify-center"
          onClick={onOpenSidenav}
          aria-label="Buka menu navigasi"
        >
          <FiAlignJustify className="h-5 w-5" />
        </span>
        
        {/* Notifications */}
        <Dropdown
          button={
            <p className="cursor-pointer touch-manipulation p-2 min-h-[44px] min-w-[44px] flex items-center justify-center" aria-label="Notifikasi">
              <IoMdNotificationsOutline className="h-5 w-5 text-gray-600 dark:text-white" />
            </p>
          }
          animation="origin-[65%_0%] md:origin-top-right transition-all duration-300 ease-in-out"
          classNames={'py-2 top-4 -left-[230px] md:-left-[340px] w-max'}
        >
          <div className="flex w-[360px] flex-col gap-3 rounded-[20px] bg-white p-4 shadow-xl shadow-shadow-500 dark:!bg-navy-700 dark:text-white dark:shadow-none">
            <div className="flex items-center justify-between">
              <p className="text-base font-bold text-navy-700 dark:text-white">
                Notifikasi
              </p>
            </div>
            <div className="flex items-center justify-center py-4">
              <p className="text-sm text-gray-600 dark:text-gray-400">
                Tidak ada notifikasi baru
              </p>
            </div>
          </div>
        </Dropdown>

        {/* Dark mode toggle */}
        <div
          className="cursor-pointer text-gray-600 touch-manipulation p-2 min-h-[44px] min-w-[44px] flex items-center justify-center"
          onClick={() => {
            if (darkmode) {
              document.body.classList.remove('dark');
              setDarkmode(false);
            } else {
              document.body.classList.add('dark');
              setDarkmode(true);
            }
          }}
          role="button"
          aria-label={darkmode ? 'Beralih ke mode terang' : 'Beralih ke mode gelap'}
        >
          {darkmode ? (
            <RiSunFill className="h-5 w-5 text-gray-600 dark:text-white" />
          ) : (
            <RiMoonFill className="h-5 w-5 text-gray-600 dark:text-white" />
          )}
        </div>

        {/* Profile & Dropdown */}
        <Dropdown
          button={
            <div className="flex h-10 w-10 items-center justify-center rounded-full bg-brand-500 text-white touch-manipulation min-h-[44px] min-w-[44px] cursor-pointer" aria-label="Menu profil pengguna">
              <MdPerson className="h-6 w-6" />
            </div>
          }
          classNames={'py-2 top-8 -left-[180px] w-max'}
        >
          <div className="flex w-56 flex-col justify-start rounded-[20px] bg-white bg-cover bg-no-repeat shadow-xl shadow-shadow-500 dark:!bg-navy-700 dark:text-white dark:shadow-none">
            <div className="p-4">
              <div className="flex items-center gap-2">
                <div className="flex h-10 w-10 items-center justify-center rounded-full bg-brand-500 text-white">
                  <MdPerson className="h-6 w-6" />
                </div>
                <div className="flex flex-col">
                  <p className="text-sm font-bold text-navy-700 dark:text-white">
                    {user?.fullName || 'Pengguna'}
                  </p>
                  <p className="text-xs text-gray-600 dark:text-gray-400">
                    {user?.role === 'admin' ? 'Admin' : 'Peternak'}
                  </p>
                </div>
              </div>
            </div>
            <div className="h-px w-full bg-gray-200 dark:bg-white/20" />

            <div className="flex flex-col p-4">
              <button
                onClick={() => router.push('/settings')}
                className="flex items-center gap-2 text-left text-sm text-gray-800 hover:text-brand-500 dark:text-white dark:hover:text-brand-400 touch-manipulation min-h-[44px] py-2"
                aria-label="Ke pengaturan profil"
              >
                <MdPerson className="h-4 w-4" />
                Pengaturan Profil
              </button>
              <button
                onClick={handleLogout}
                className="mt-3 flex items-center gap-2 text-left text-sm font-medium text-red-500 hover:text-red-600 touch-manipulation min-h-[44px] py-2"
                aria-label="Keluar"
              >
                <MdLogout className="h-4 w-4" />
                Keluar
              </button>
            </div>
          </div>
        </Dropdown>
      </div>
    </nav>
  );
};

export default Navbar;
