import React from 'react';
import { useNavigate } from 'react-router-dom';
import {
    ArchiveBoxIcon, PuzzlePieceIcon, TableCellsIcon, ShoppingBagIcon,
    BookOpenIcon, ChartPieIcon, DeviceTabletIcon, PresentationChartBarIcon, 
    RocketLaunchIcon, UserGroupIcon, LinkIcon
} from '@heroicons/react/24/solid';

const GithubIcon = () => (
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 16 16" fill="currentColor" className="w-5 h-5">
        <path d="M8 0C3.58 0 0 3.58 0 8c0 3.54 2.29 6.53 5.47 7.59.4.07.55-.17.55-.38 0-.19-.01-.82-.01-1.49-2.01.37-2.53-.49-2.69-.94-.09-.23-.48-.94-.82-1.13-.28-.15-.68-.52-.01-.53.63-.01 1.08.58 1.23.82.72 1.21 1.87.87 2.33.66.07-.52.28-.87.51-1.07-1.78-.2-3.64-.89-3.64-3.95 0-.87.31-1.59.82-2.15-.08-.2-.36-1.02.08-2.12 0 0 .67-.21 2.2.82.64-.18 1.32-.27 2-.27.68 0 1.36.09 2 .27 1.53-1.04 2.2-.82 2.2-.82.44 1.1.16 1.92.08 2.12.51.56.82 1.27.82 2.15 0 3.07-1.87 3.75-3.65 3.95.29.25.54.73.54 1.48 0 1.07-.01 1.93-.01 2.2 0 .21.15.46.55.38A8.013 8.013 0 0 0 16 8c0-4.42-3.58-8-8-8Z" />
    </svg>
);

function AdminDashboard() {
    const navigate = useNavigate();

    const mainFeatures = [
        { name: 'Manajemen Menu', path: '/admin/products', icon: <ArchiveBoxIcon className="w-7 h-7 text-indigo-600"/>, color: 'indigo' },
        { name: 'Manajemen Addons', path: '/admin/addons', icon: <PuzzlePieceIcon className="w-7 h-7 text-teal-600"/>, color: 'teal' },
        { name: 'Manajemen Meja', path: '/admin/tables', icon: <TableCellsIcon className="w-7 h-7 text-sky-600"/>, color: 'sky' },
        { name: 'Terminal Kasir', path: '/cashier/login', icon: <ShoppingBagIcon className="w-7 h-7 text-amber-600"/>, color: 'amber' },
        { name: 'Panel Dapur', path: '/kitchen/login', icon: <BookOpenIcon className="w-7 h-7 text-rose-600"/>, color: 'rose' },
        { name: 'Laporan Penjualan', path: '/admin/reports', icon: <ChartPieIcon className="w-7 h-7 text-purple-600"/>, color: 'purple' },
    ];

    const advantages = [
        { title: 'Pemesanan Efisien', description: 'Pelanggan memesan mandiri, mengurangi antrean di kasir.', icon: <RocketLaunchIcon className="w-6 h-6 text-green-500" /> },
        { title: 'Pengalaman Modern', description: 'Akses menu & pemesanan langsung dari ponsel pelanggan.', icon: <DeviceTabletIcon className="w-6 h-6 text-blue-500" /> },
        { title: 'Optimasi Staf', description: 'Staf dapat fokus pada pelayanan, bukan pencatatan manual.', icon: <UserGroupIcon className="w-6 h-6 text-yellow-500" /> },
        { title: 'Data Bisnis Akurat', description: 'Semua transaksi tercatat rapi untuk keputusan strategis.', icon: <PresentationChartBarIcon className="w-6 h-6 text-purple-500" /> },
    ];

    const developerLinks = [
        { name: 'Portfolio', href: '#', icon: <LinkIcon className="w-5 h-5"/> },
        { name: 'GitHub', href: '#', icon: <GithubIcon /> },
        { name: 'LinkedIn', href: '#', icon: <LinkIcon className="w-5 h-5"/> }, 
    ];

    return (
        <div className="p-4 sm:p-6 lg:p-8 min-h-full bg-slate-50">
            <div className="bg-gradient-to-br from-indigo-600 to-blue-500 text-white p-8 rounded-2xl shadow-lg mb-10">
                <h1 className="text-4xl md:text-5xl font-extrabold mb-3">Sistem Kasir Modern</h1>
                <p className="text-lg md:text-xl opacity-90 max-w-3xl">
                    Selamat datang di dasbor admin. Kelola semua aspek bisnis kafe Anda dari sini.
                </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-12">
                {mainFeatures.map((feature) => (
                    <div
                        key={feature.name}
                        onClick={() => navigate(feature.path)}
                        className="bg-white p-6 rounded-2xl shadow-md border border-slate-200 hover:shadow-xl hover:-translate-y-1 transition-all duration-300 cursor-pointer flex items-center gap-5"
                    >
                        <div className={`bg-${feature.color}-100 p-4 rounded-full`}>
                            {feature.icon}
                        </div>
                        <div>
                            <h3 className="text-lg font-bold text-slate-800">{feature.name}</h3>
                            <p className="text-sm text-slate-500">Buka menu {feature.name}</p>
                        </div>
                    </div>
                ))}
            </div>

            <div className="mb-12">
                <h2 className="text-3xl font-bold text-slate-800 mb-6 text-center">Kelebihan Sistem Ini</h2>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
                    {advantages.map((advantage) => (
                        <div key={advantage.title} className="bg-white p-6 rounded-2xl shadow-md border border-slate-200">
                            <div className="flex items-center gap-3 mb-3">
                                {advantage.icon}
                                <h3 className="text-lg font-bold text-slate-800">{advantage.title}</h3>
                            </div>
                            <p className="text-sm text-slate-600">{advantage.description}</p>
                        </div>
                    ))}
                </div>
            </div>

            <div className="bg-white p-6 rounded-2xl shadow-md border border-slate-200">
                <div className="flex flex-col sm:flex-row items-center gap-6">
                    <img 
                        className="w-24 h-24 rounded-full border-4 border-slate-200 shadow-sm" 
                        src="/images/tobscode.jpg" 
                        alt="Tobscode Developer Avatar"
                    />
                    <div className="text-center sm:text-left">
                        <h3 className="text-2xl font-bold text-slate-900">Tobscode</h3>
                        <p className="text-indigo-600 font-semibold">Developer</p>
                        <p className="text-slate-500 mt-1 max-w-xl">
                            Website ini dikembangkan oleh Kevin Christman Lumban Tobing (TOBSCODE) silahkan hubungi wa +6288212098241 jika minat sistem kasirless ini
                        </p>
                    </div>
                </div>
            </div>
        </div>
    );
}

export default AdminDashboard;
