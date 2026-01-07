/* eslint-disable */

import { HiX } from 'react-icons/hi';
import Links from './components/Links';
import { IRoute } from '@/types/navigation';

function SidebarHorizon(props: { routes: IRoute[]; [x: string]: any }) {
  const { routes, open, setOpen } = props;
  return (
    <div
      className={`sm:none duration-175 linear fixed !z-50 flex min-h-full flex-col bg-white pb-10 shadow-2xl shadow-white/5 transition-all dark:!bg-navy-800 dark:text-white md:!z-50 lg:!z-50 xl:!z-0 ${
        open ? 'translate-x-0' : '-translate-x-96 xl:translate-x-0'
      }`}
    >
      <span
        className="absolute right-4 top-4 block cursor-pointer xl:hidden touch-manipulation p-2 min-h-[44px] min-w-[44px] flex items-center justify-center"
        onClick={() => setOpen(false)}
        role="button"
        aria-label="Tutup menu navigasi"
      >
        <HiX />
      </span>

      <div className={`mx-[56px] mt-[50px] flex items-center justify-center`}>
        <div className="flex items-center gap-2">
          <svg
            className="h-8 w-8 text-brand-500 dark:text-white"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10"
            />
          </svg>
          <div className="font-poppins text-[22px] font-bold text-navy-700 dark:text-white">
            Live<span className="font-medium text-brand-500"> Track</span>
          </div>
        </div>
      </div>
      <div className="mb-7 mt-[58px] h-px bg-gray-300 dark:bg-white/30" />
      {/* Nav item */}

      <ul className="mb-auto pt-1">
        <Links routes={routes} />
      </ul>

      {/* Nav item end */}
    </div>
  );
}

export default SidebarHorizon;
