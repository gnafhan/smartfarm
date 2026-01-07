/* eslint-disable */
import React from 'react';
import { useCallback } from 'react';
import { usePathname } from 'next/navigation';
import NavLink from '@/components/link/NavLink';
import DashIcon from '@/components/icons/DashIcon';
// chakra imports

export const SidebarLinks = (props: { routes: RoutesType[] }): JSX.Element => {
  // Chakra color mode
  const pathname = usePathname();

  const { routes } = props;

  // verifies if routeName is the one active (in browser input)
  const activeRoute = useCallback(
    (routeName: string) => {
      // Exact match for specific routes
      if (pathname === routeName) {
        return true;
      }
      // For routes like /home, /livestock, etc - exact match or starts with for nested routes
      if (routeName !== '/' && pathname?.startsWith(routeName + '/')) {
        return true;
      }
      return false;
    },
    [pathname],
  );

  const createLinks = (routes: RoutesType[]) => {
    return routes.map((route, index) => {
      const isActive = activeRoute(route.path);
      
      return (
        <NavLink key={index} href={route.path}>
          <div className="relative mb-3 flex hover:cursor-pointer">
            <li
              className="my-[3px] flex cursor-pointer items-center px-8"
              key={index}
            >
              <span
                className={`${
                  isActive
                    ? 'font-bold text-brand-500 dark:text-white'
                    : 'font-medium text-gray-600'
                }`}
              >
                {route.icon ? (
                  React.cloneElement(route.icon as React.ReactElement, {
                    className: `h-6 w-6 ${isActive ? '' : 'opacity-60'}`,
                  })
                ) : (
                  <DashIcon />
                )}
              </span>
              <p
                className={`leading-1 ml-4 flex ${
                  isActive
                    ? 'font-bold text-navy-700 dark:text-white'
                    : 'font-medium text-gray-600'
                }`}
              >
                {route.name}
              </p>
            </li>
            {isActive ? (
              <div className="absolute right-0 top-px h-9 w-1 rounded-lg bg-brand-500 dark:bg-brand-400" />
            ) : null}
          </div>
        </NavLink>
      );
    });
  };
  // BRAND
  return <>{createLinks(routes)}</>;
};

export default SidebarLinks;
