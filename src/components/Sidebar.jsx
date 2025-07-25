import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import {
    ArchiveBoxIcon, PuzzlePieceIcon, TableCellsIcon, ChartPieIcon, 
    ArrowLeftEndOnRectangleIcon, XMarkIcon, HomeModernIcon, CubeIcon
} from '@heroicons/react/24/solid';

const navItems = [
    { name: 'Dashboard', icon: <HomeModernIcon className="w-6 h-6" />, path: '/admin' },
    { name: 'Produk', icon: <ArchiveBoxIcon className="w-6 h-6" />, path: '/admin/products' },
    { name: 'Addons', icon: <PuzzlePieceIcon className="w-6 h-6" />, path: '/admin/addons' },
    { name: 'Meja', icon: <TableCellsIcon className="w-6 h-6" />, path: '/admin/tables' },
    { name: 'Laporan', icon: <ChartPieIcon className="w-6 h-6" />, path: '/admin/reports' },
];

function Sidebar({ isOpen, toggleSidebar, handleLogout }) {
    const location = useLocation();

    const isActive = (path) => {
        if (path === '/admin') {
            return location.pathname === '/admin';
        }
        return location.pathname.startsWith(path);
    };

    return (
        <>
            {isOpen && (
                <div 
                    className="fixed inset-0 bg-black/60 z-30 lg:hidden"
                    onClick={toggleSidebar}
                ></div>
            )}

            <aside 
                className={`fixed top-0 left-0 min-h-screen w-64 bg-slate-800 text-white p-6 flex flex-col 
                          transform transition-transform duration-300 ease-in-out z-40
                          ${isOpen ? 'translate-x-0' : '-translate-x-full'} 
                          lg:translate-x-0 lg:relative lg:flex-shrink-0`}
            >
                <div className="flex items-center justify-between h-16 px-2 mb-6">
                    <div className="flex items-center gap-3">
                        <CubeIcon className="w-8 h-8 text-indigo-400"/>
                        <h2 className="text-xl font-bold text-white">Sistem Kasir</h2>
                    </div>
                    <button 
                        onClick={toggleSidebar}
                        className="p-2 rounded-full lg:hidden hover:bg-slate-700 transition"
                    >
                        <XMarkIcon className="w-6 h-6" />
                    </button>
                </div>

                <nav className="flex-grow">
                    <ul className="space-y-2">
                        {navItems.map((item) => (
                            <li key={item.name}>
                                <Link
                                    to={item.path}
                                    className={`relative flex items-center p-3 rounded-lg font-semibold transition-colors duration-200 
                                      ${isActive(item.path) 
                                        ? 'bg-slate-700 text-white' 
                                        : 'text-slate-300 hover:bg-slate-700 hover:text-white'}`}
                                >
                                    {isActive(item.path) && (
                                        <span className="absolute inset-y-0 left-0 w-1 bg-indigo-500 rounded-r-full"></span>
                                    )}
                                    {item.icon}
                                    <span className="ml-4">{item.name}</span>
                                </Link>
                            </li>
                        ))}
                    </ul>
                </nav>

                <div className="mt-auto pt-6 border-t border-slate-700">
                    <button
                        onClick={handleLogout}
                        className="flex items-center w-full p-3 rounded-lg text-slate-300 hover:bg-slate-700 hover:text-white transition-colors duration-200"
                    >
                        <ArrowLeftEndOnRectangleIcon className="w-6 h-6" />
                        <span className="ml-4 font-semibold">Logout</span>
                    </button>
                </div>
            </aside>
        </>
    );
}

export default Sidebar;