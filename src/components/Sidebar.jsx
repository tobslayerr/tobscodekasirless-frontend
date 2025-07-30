import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import {
  ArchiveBoxIcon, PuzzlePieceIcon, TableCellsIcon, ShoppingBagIcon,
  BookOpenIcon, ChartPieIcon, ArrowLeftEndOnRectangleIcon, Bars3Icon,
  XMarkIcon, HomeModernIcon, ArchiveBoxArrowDownIcon // Ikon untuk Manajemen Stok
} from '@heroicons/react/24/solid';

const navItems = [
  { name: 'Dashboard', icon: <HomeModernIcon className="w-5 h-5" />, path: '/admin' },
  { name: 'Manajemen Produk', icon: <ArchiveBoxIcon className="w-5 h-5" />, path: '/admin/products' },
  { name: 'Manajemen Addons', icon: <PuzzlePieceIcon className="w-5 h-5" />, path: '/admin/addons' },
  { name: 'Manajemen Meja', icon: <TableCellsIcon className="w-5 h-5" />, path: '/admin/tables' },
  { name: 'Manajemen Stok', icon: <ArchiveBoxArrowDownIcon className="w-5 h-5" />, path: '/admin/stock' }, // Link baru
  { name: 'Laporan Penjualan', icon: <ChartPieIcon className="w-5 h-5" />, path: '/admin/reports' },
];

function Sidebar({ isOpen, toggleSidebar, handleLogout }) {
  const location = useLocation();

  return (
    <>
      {isOpen && (
        <div 
          className="fixed inset-0 bg-black bg-opacity-50 z-30 lg:hidden"
          onClick={toggleSidebar}
        ></div>
      )}

      <aside 
        className={`fixed top-0 left-0 min-h-screen w-64 bg-gray-900 text-white p-6 flex flex-col 
                   transform transition-transform duration-300 ease-in-out z-40
                   ${isOpen ? 'translate-x-0' : '-translate-x-full'} 
                   lg:relative lg:translate-x-0 lg:flex-shrink-0 lg:z-auto`}
      >
        <div className="flex items-center justify-between lg:justify-center mb-10">
          <h2 className="text-2xl font-bold text-blue-400">Sistem Kasir Admin</h2>
          <button 
            onClick={toggleSidebar}
            className="p-1 rounded-full text-white lg:hidden hover:bg-gray-700 transition"
          >
            <XMarkIcon className="w-6 h-6" />
          </button>
        </div>

        <nav className="flex-grow">
          <ul className="space-y-3">
            {navItems.map((item, index) => (
              <li key={index}>
                <Link
                  to={item.path}
                  onClick={toggleSidebar}
                  className={`flex items-center p-3 rounded-lg font-medium transition-colors duration-200 
                             ${location.pathname === item.path 
                                ? 'bg-blue-600 text-white shadow-md' 
                                : 'text-gray-300 hover:bg-gray-700 hover:text-white'}`}
                >
                  {item.icon}
                  <span className="ml-3 text-lg">{item.name}</span>
                </Link>
              </li>
            ))}
          </ul>
        </nav>

        <div className="mt-auto pt-6 border-t border-gray-700">
          <button
            onClick={handleLogout}
            className="flex items-center w-full p-3 rounded-lg text-red-300 bg-gray-800 hover:bg-red-700 hover:text-white transition duration-200"
          >
            <ArrowLeftEndOnRectangleIcon className="w-5 h-5" />
            <span className="ml-3 text-lg">Logout</span>
          </button>
        </div>
      </aside>
    </>
  );
}

export default Sidebar;
