import React from 'react';

// Icon Imports - Using same filled icons for both states
// Active: full opacity, Inactive: reduced opacity
import {
  MdHome,
  MdPets,
  MdWarehouse,
  MdSensors,
  MdHistory,
  MdNotifications,
  MdQrCodeScanner,
  MdSettings,
} from 'react-icons/md';

const routes = [
  {
    name: 'Dasbor',
    layout: '/',
    path: '/home',
    icon: <MdHome className="h-6 w-6" />,
  },
  {
    name: 'Ternak',
    layout: '/',
    path: '/livestock',
    icon: <MdPets className="h-6 w-6" />,
  },
  {
    name: 'Kandang',
    layout: '/',
    path: '/barns',
    icon: <MdWarehouse className="h-6 w-6" />,
  },
  {
    name: 'Pemantauan',
    layout: '/',
    path: '/monitoring',
    icon: <MdSensors className="h-6 w-6" />,
  },
  {
    name: 'Perangkat',
    layout: '/',
    path: '/devices',
    icon: <MdSensors className="h-6 w-6" />,
  },
  {
    name: 'Log Keluar/Masuk',
    layout: '/',
    path: '/logs',
    icon: <MdHistory className="h-6 w-6" />,
  },
  {
    name: 'Peringatan',
    layout: '/',
    path: '/alerts',
    icon: <MdNotifications className="h-6 w-6" />,
  },
  {
    name: 'Pemindai QR',
    layout: '/',
    path: '/scan',
    icon: <MdQrCodeScanner className="h-6 w-6" />,
  },
  {
    name: 'Pengaturan',
    layout: '/',
    path: '/settings',
    icon: <MdSettings className="h-6 w-6" />,
  },
];
export default routes;
