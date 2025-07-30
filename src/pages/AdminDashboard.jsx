import React from 'react';
import { useNavigate } from 'react-router-dom';
import {
    ArchiveBoxIcon, PuzzlePieceIcon, TableCellsIcon, ShoppingBagIcon,
    BookOpenIcon, ChartPieIcon, DeviceTabletIcon, PresentationChartBarIcon, 
    CurrencyDollarIcon, RocketLaunchIcon, UserGroupIcon, LinkIcon,
    ArchiveBoxArrowDownIcon // Ikon untuk Manajemen Stok
} from '@heroicons/react/24/solid';

// Komponen ikon GitHub (sudah Anda sediakan)
const GithubIcon = () => (
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 16 16" fill="currentColor" className="w-5 h-5">
        <path d="M8 0C3.58 0 0 3.58 0 8c0 3.54 2.29 6.53 5.47 7.59.4.07.55-.17.55-.38 0-.19-.01-.82-.01-1.49-2.01.37-2.53-.49-2.69-.94-.09-.23-.48-.94-.82-1.13-.28-.15-.68-.52-.01-.53.63-.01 1.08.58 1.23.82.72 1.21 1.87.87 2.33.66.07-.52.28-.87.51-1.07-1.78-.2-3.64-.89-3.64-3.95 0-.87.31-1.59.82-2.15-.08-.2-.36-1.02.08-2.12 0 0 .67-.21 2.2.82.64-.18 1.32-.27 2-.27.68 0 1.36.09 2 .27 1.53-1.04 2.2-.82 2.2-.82.44 1.1.16 1.92.08 2.12.51.56.82 1.27.82 2.15 0 3.07-1.87 3.75-3.65 3.95.29.25.54.73.54 1.48 0 1.07-.01 1.93-.01 2.2 0 .21.15.46.55.38A8.013 8.013 0 0 0 16 8c0-4.42-3.58-8-8-8Z" />
    </svg>
);

function AdminDashboard() {
    const navigate = useNavigate();

    const mainFeatures = [
        { name: 'Manajemen Menu', path: '/admin/products', icon: <ArchiveBoxIcon className="w-7 h-7 text-indigo-600"/>, color: 'indigo', description: 'Atur semua produk kafe Anda, termasuk minuman, makanan, dan camilan. Tambah item baru, perbarui harga, upload gambar menu dengan mudah.' },
        { name: 'Manajemen Addons', path: '/admin/addons', icon: <PuzzlePieceIcon className="w-7 h-7 text-teal-600"/>, color: 'teal', description: 'Kelola opsi kustomisasi seperti ukuran, tingkat kemanisan, atau jenis wadah untuk setiap produk.' },
        { name: 'Manajemen Meja', path: '/admin/tables', icon: <TableCellsIcon className="w-7 h-7 text-sky-600"/>, color: 'sky', description: 'Atur daftar meja dan hasilkan QR Code unik untuk setiap meja agar pelanggan bisa memesan.' },
        { name: 'Terminal Kasir', path: '/cashier/login', icon: <ShoppingBagIcon className="w-7 h-7 text-amber-600"/>, color: 'amber', description: 'Proses pembayaran tunai dari pelanggan dengan cepat dan efisien menggunakan ID pesanan.' },
        { name: 'Panel Dapur', path: '/kitchen/login', icon: <BookOpenIcon className="w-7 h-7 text-rose-600"/>, color: 'rose', description: 'Lihat pesanan yang sudah dibayar secara real-time. Kelola status pesanan hingga selesai dibuat.' },
        { name: 'Manajemen Stok Harian', path: '/admin/stock', icon: <ArchiveBoxArrowDownIcon className="w-7 h-7 text-fuchsia-600"/>, color: 'fuchsia', description: 'Kontrol penuh stok produk Anda. Buka/tutup sesi penjualan harian, input stok awal, dan lihat stok saat ini.' },
        { name: 'Laporan Penjualan', path: '/admin/reports', icon: <ChartPieIcon className="w-7 h-7 text-purple-600"/>, color: 'purple', description: 'Dapatkan wawasan bisnis dari laporan penjualan, produk terlaris, dan stok harian.' },
    ];

    const advantages = [
        { title: 'Pemesanan Efisien', description: 'Pelanggan memesan mandiri, mengurangi antrean di kasir dan meningkatkan kecepatan layanan.', icon: <RocketLaunchIcon className="w-6 h-6 text-green-500" /> },
        { title: 'Pengalaman Modern', description: 'Akses menu & pemesanan langsung dari ponsel pelanggan, menciptakan citra kafe yang inovatif.', icon: <DeviceTabletIcon className="w-6 h-6 text-blue-500" /> },
        { title: 'Optimasi Staf', description: 'Staf dapat fokus pada pelayanan dan persiapan, bukan pencatatan manual yang memakan waktu.', icon: <UserGroupIcon className="w-6 h-6 text-yellow-500" /> },
        { title: 'Data Bisnis Akurat', description: 'Semua transaksi tercatat rapi, menyediakan data berharga untuk pengambilan keputusan strategis.', icon: <PresentationChartBarIcon className="w-6 h-6 text-purple-500" /> },
        { title: 'Pembayaran Fleksibel', description: 'Mendukung pembayaran tunai dan berbagai opsi pembayaran digital untuk kenyamanan pelanggan.', icon: <CurrencyDollarIcon className="w-6 h-6 text-orange-500" /> },
        { title: 'Integrasi Stok Real-time', description: 'Stok produk diperbarui secara otomatis setelah setiap penjualan, memberikan data inventaris yang akurat.', icon: <ArchiveBoxArrowDownIcon className="w-6 h-6 text-fuchsia-500" /> },
    ];

    const developerLinks = [
        { name: 'Portfolio', href: '#', icon: <LinkIcon className="w-5 h-5"/> },
        { name: 'GitHub', href: 'https://github.com/TobsCode', icon: <GithubIcon /> }, // Contoh link GitHub
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

            <h2 className="text-3xl font-bold text-slate-800 mb-6 text-center">Fitur Utama Sistem Ini</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6 mb-12">
                {mainFeatures.map((feature) => (
                    <div
                        key={feature.name}
                        onClick={() => navigate(feature.path)}
                        className="bg-white p-6 rounded-2xl shadow-md border border-slate-200 hover:shadow-xl hover:-translate-y-1 transition-all duration-300 cursor-pointer flex flex-col items-start gap-4"
                    >
                        <div className={`bg-${feature.color}-100 p-4 rounded-full flex-shrink-0`}>
                            {feature.icon}
                        </div>
                        <div>
                            <h3 className="text-lg font-bold text-slate-800 mb-1">{feature.name}</h3>
                            <p className="text-sm text-slate-500">{feature.description}</p>
                        </div>
                    </div>
                ))}
            </div>

            <h2 className="text-3xl font-bold text-slate-800 mb-6 text-center">Kelebihan Menggunakan Sistem Ini</h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-3 gap-6 mb-12">
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

            <div className="bg-white p-6 rounded-2xl shadow-md border border-slate-200">
                <div className="flex flex-col sm:flex-row items-center gap-6">
                    <img 
                        className="w-24 h-24 rounded-full border-4 border-slate-200 shadow-sm" 
                        src="/images/tobscode.jpg" // Pastikan gambar ini ada di client/public/images/
                        alt="Tobscode Developer Avatar"
                    />
                    <div className="text-center sm:text-left">
                        <h3 className="text-2xl font-bold text-slate-900">Tobscode</h3>
                        <p className="text-indigo-600 font-semibold">Developer</p>
                        <p className="text-slate-500 mt-1 max-w-xl">
                            Website ini dikembangkan oleh Kevin Christman Lumban Tobing (TOBSCODE) silahkan hubungi wa +6288212098241 jika minat sistem kasirless ini
                        </p>
                        <div className="flex justify-center sm:justify-start gap-4 mt-4">
                            {developerLinks.map((link) => (
                                <a 
                                    key={link.name} 
                                    href={link.href} 
                                    target="_blank" 
                                    rel="noopener noreferrer" 
                                    className="flex items-center gap-2 text-slate-600 hover:text-indigo-600 transition-colors"
                                >
                                    {link.icon}
                                    <span className="font-medium">{link.name}</span>
                                </a>
                            ))}
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}

export default AdminDashboard;
