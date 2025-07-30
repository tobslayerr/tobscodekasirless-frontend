import React, { useState, useEffect, useRef } from 'react';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';
import Swal from 'sweetalert2';
import { Line, Pie } from 'react-chartjs-2';
import { Chart as ChartJS, CategoryScale, LinearScale, PointElement, LineElement, BarElement, ArcElement, Title, Tooltip, Legend, Filler } from 'chart.js'; // <-- PERUBAHAN 1
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import { format } from 'date-fns';
import { id } from 'date-fns/locale';

import { 
    ArrowLeftIcon, CalendarDaysIcon, DocumentArrowDownIcon, 
    ArchiveBoxIcon as StockIcon, BanknotesIcon, ShoppingBagIcon, 
    CalculatorIcon, ChevronDownIcon, ChartPieIcon, ChartBarIcon 
} from '@heroicons/react/24/solid';

ChartJS.register(CategoryScale, LinearScale, PointElement, LineElement, BarElement, ArcElement, Title, Tooltip, Legend, Filler); // <-- PERUBAHAN 2

function SalesReports() {
    const navigate = useNavigate();
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const [salesSummary, setSalesSummary] = useState(null);
    const [salesByDate, setSalesByDate] = useState({ labels: [], datasets: [], rawData: [] });
    const [topProducts, setTopProducts] = useState([]);
    const [salesByCategory, setSalesByCategory] = useState([]);
    const [dailyStockReport, setDailyStockReport] = useState([]);
    
    const [startDate, setStartDate] = useState('');
    const [endDate, setEndDate] = useState('');
    const [interval, setInterval] = useState('day');
    
    const [openAccordion, setOpenAccordion] = useState(null);

    const API_URL = import.meta.env.VITE_SERVER_URL;

    const getAuthHeader = () => ({ headers: { Authorization: `Bearer ${localStorage.getItem('token')}` } });

    useEffect(() => {
        const today = new Date();
        const thirtyDaysAgo = new Date(today);
        thirtyDaysAgo.setDate(today.getDate() - 30);
        setStartDate(format(thirtyDaysAgo, 'yyyy-MM-dd'));
        setEndDate(format(today, 'yyyy-MM-dd'));
    }, []);

    useEffect(() => {
        if (startDate && endDate) {
            fetchReports();
        }
    }, [startDate, endDate, interval]);

    const fetchReports = async () => {
        setLoading(true);
        setError('');
        try {
            const commonParams = { startDate, endDate };
            const [summaryRes, byDateRes, topProductsRes, byCategoryRes, dailyStockRes] = await Promise.all([
                axios.get(`${API_URL}/api/reports/summary`, { ...getAuthHeader(), params: commonParams }),
                axios.get(`${API_URL}/api/reports/by-date`, { ...getAuthHeader(), params: { ...commonParams, interval } }),
                axios.get(`${API_URL}/api/reports/top-products`, { ...getAuthHeader(), params: { ...commonParams, limit: 10 } }),
                axios.get(`${API_URL}/api/reports/by-category`, { ...getAuthHeader(), params: commonParams }),
                axios.get(`${API_URL}/api/stock/daily-report`, { ...getAuthHeader(), params: commonParams }),
            ]);

            setSalesSummary(summaryRes.data);
            
            setSalesByDate({
                labels: byDateRes.data.map(item => item.period),
                datasets: [{
                    label: 'Total Penjualan (Rp)',
                    data: byDateRes.data.map(item => item.totalSales),
                    borderColor: '#4f46e5',
                    backgroundColor: 'rgba(79, 70, 229, 0.1)',
                    fill: true,
                    tension: 0.3,
                    pointBackgroundColor: '#4f46e5',
                }],
                rawData: byDateRes.data
            });

            setTopProducts(topProductsRes.data);
            setSalesByCategory(byCategoryRes.data);
            setDailyStockReport(dailyStockRes.data);

        } catch (err) {
            handleApiError(err, 'Gagal memuat laporan.');
        } finally {
            setLoading(false);
        }
    };

    const handleApiError = (err, defaultMessage) => {
        console.error('Error fetching reports:', err);
        setError(err.response?.data?.message || defaultMessage);
        Swal.fire('Error', err.response?.data?.message || defaultMessage, 'error');
        if (err.response && [401, 403].includes(err.response.status)) {
            localStorage.removeItem('token');
            navigate('/admin/login');
        }
    };

    const handleDownloadPdf = () => {
        if (!salesSummary) {
            Swal.fire('Gagal', 'Data laporan tidak tersedia untuk diunduh.', 'error');
            return;
        }

        Swal.fire({
            title: 'Membuat PDF...',
            text: 'Mohon tunggu, laporan sedang dibuat.',
            allowOutsideClick: false,
            didOpen: () => { Swal.showLoading(); }
        });

        const doc = new jsPDF();
        let yOffset = 20;
        const pageHeight = doc.internal.pageSize.height;
        const pageWidth = doc.internal.pageSize.width;
        const leftMargin = 14;

        const addHeader = () => {
            doc.setFontSize(20);
            doc.setFont('helvetica', 'bold');
            doc.text('Laporan Penjualan & Stok', leftMargin, yOffset);
            yOffset += 8;
            doc.setFontSize(10);
            doc.setFont('helvetica', 'normal');
            doc.text(`Periode: ${format(new Date(startDate), 'd MMMM yyyy', { locale: id })} - ${format(new Date(endDate), 'd MMMM yyyy', { locale: id })}`, leftMargin, yOffset);
            yOffset += 12;
        };

        const addFooter = () => {
            const pageCount = doc.internal.getNumberOfPages();
            for (let i = 1; i <= pageCount; i++) {
                doc.setPage(i);
                doc.setFontSize(8);
                doc.text(`Halaman ${i} dari ${pageCount}`, pageWidth - 35, pageHeight - 10);
                doc.text(`Dibuat pada: ${format(new Date(), 'dd MMM yyyy, HH:mm')}`, leftMargin, pageHeight - 10);
            }
        };

        addHeader();

        doc.setFontSize(12);
        doc.setFont('helvetica', 'bold');
        doc.text('Ringkasan Penjualan', leftMargin, yOffset);
        yOffset += 6;
        autoTable(doc, {
            startY: yOffset,
            body: [
                ['Total Pendapatan', salesSummary.totalRevenue],
                ['Total Pesanan', salesSummary.totalOrders.toString()],
                ['Rata-rata per Pesanan', salesSummary.averageOrderValue],
            ],
            theme: 'grid',
            styles: { fontSize: 10 },
            columnStyles: { 0: { fontStyle: 'bold' } },
        });
        yOffset = doc.lastAutoTable.finalY + 12;

        doc.setFontSize(12);
        doc.setFont('helvetica', 'bold');
        doc.text(`Penjualan per ${interval === 'day' ? 'Hari' : (interval === 'week' ? 'Minggu' : 'Bulan')}`, leftMargin, yOffset);
        yOffset += 6;
        autoTable(doc, {
            startY: yOffset,
            head: [['Periode', 'Total Penjualan (Rp)']],
            body: salesByDate.rawData.map(item => [item.period, item.totalSales.toLocaleString('id-ID')]),
            theme: 'striped',
            headStyles: { fillColor: [45, 55, 72] },
            columnStyles: { 1: { halign: 'right' } },
        });
        yOffset = doc.lastAutoTable.finalY + 12;

        const topProductsBody = topProducts.map((p, i) => [i + 1, p.productName, p.totalQuantitySold, p.totalRevenue]);
        const categoryBody = salesByCategory.map(c => [c.categoryName, c.totalRevenue]);
        
        const sideBySideYStart = yOffset;

        autoTable(doc, {
            startY: sideBySideYStart,
            head: [['No.', 'Produk Terlaris', 'Terjual', 'Pendapatan']],
            body: topProductsBody,
            theme: 'striped',
            headStyles: { fillColor: [45, 55, 72] },
            tableWidth: 100,
            margin: { right: pageWidth - leftMargin - 100 },
            columnStyles: { 0: { halign: 'center', cellWidth: 10 }, 2: { halign: 'center' }, 3: { halign: 'right' } }
        });
        const firstTableFinalY = doc.lastAutoTable.finalY;

        autoTable(doc, {
            startY: sideBySideYStart,
            head: [['Kategori', 'Pendapatan']],
            body: categoryBody,
            theme: 'striped',
            headStyles: { fillColor: [45, 55, 72] },
            tableWidth: 80,
            margin: { left: leftMargin + 105 },
            columnStyles: { 1: { halign: 'right' } }
        });
        const secondTableFinalY = doc.lastAutoTable.finalY;
        
        yOffset = Math.max(firstTableFinalY, secondTableFinalY) + 15;

        if(dailyStockReport.length > 0) {
            if (yOffset > pageHeight - 50) { // Cek jika butuh halaman baru
                doc.addPage();
                yOffset = 20;
            }
            doc.setFontSize(14);
            doc.setFont('helvetica', 'bold');
            doc.text('Laporan Stok Harian', leftMargin, yOffset);
            yOffset += 8;

            dailyStockReport.forEach(session => {
                const sessionHeader = `Tanggal: ${format(new Date(session.session_date), 'd MMMM yyyy')} | Status: ${session.status.toUpperCase()}`;
                const tableBody = session.products_stock.map(stock => [
                    stock.product_name,
                    stock.initial_stock ?? 'N/A',
                    stock.final_stock ?? 'N/A',
                    (stock.initial_stock ?? 0) - (stock.final_stock ?? 0)
                ]);

                if (tableBody.length === 0) {
                    tableBody.push([{ content: 'Tidak ada data stok untuk sesi ini.', colSpan: 4, styles: { halign: 'center' } }]);
                }

                autoTable(doc, {
                    startY: yOffset,
                    head: [[{ content: sessionHeader, colSpan: 4, styles: { fontStyle: 'bold', fillColor: [237, 242, 247], textColor: [45, 55, 72] } }]],
                    body: tableBody,
                    columns: [
                        { header: 'Produk', dataKey: 'product' },
                        { header: 'Awal', dataKey: 'initial' },
                        { header: 'Akhir', dataKey: 'final' },
                        { header: 'Terjual', dataKey: 'sold' },
                    ],
                    theme: 'grid',
                    headStyles: { fillColor: [100, 116, 139] },
                    columnStyles: { 1: { halign: 'center' }, 2: { halign: 'center' }, 3: { halign: 'center' } },
                    didDrawPage: (data) => {
                        // Jika tabel melewati halaman, update yOffset untuk halaman baru
                        if (data.cursor) {
                            yOffset = data.cursor.y;
                        }
                    }
                });
                yOffset = doc.lastAutoTable.finalY + 8;
            });
        }
        
        addFooter();
        doc.save(`Laporan_Penjualan_Stok_${startDate}_sd_${endDate}.pdf`);
        Swal.close();
    };

    const KpiCard = ({ title, value, icon }) => (
        <div className="bg-white p-5 rounded-2xl shadow-lg border border-slate-200 flex items-center gap-4">
            <div className="p-3 bg-indigo-100 rounded-full">{icon}</div>
            <div>
                <p className="text-sm text-slate-500">{title}</p>
                <p className="text-2xl font-bold text-slate-800">{value}</p>
            </div>
        </div>
    );

    const ChartCard = ({ title, children, icon }) => (
        <div className="bg-white p-6 rounded-2xl shadow-lg border border-slate-200">
            <h3 className="text-lg font-bold text-slate-800 mb-4 flex items-center gap-2">{icon}{title}</h3>
            {children}
        </div>
    );

    return (
        <div className="p-4 sm:p-6 lg:p-8 bg-slate-50 min-h-screen w-full">
            <header className="mb-8">
                <div className="flex flex-col md:flex-row justify-between md:items-center gap-4">
                    <div>
                        <h1 className="text-3xl sm:text-4xl font-extrabold text-slate-800 tracking-tight">Dasbor Laporan</h1>
                        <p className="text-slate-500 mt-1">Analisis penjualan, produk, dan stok Anda.</p>
                    </div>
                    <button onClick={() => navigate('/admin')} className="px-4 py-2 bg-white border border-slate-300 text-slate-700 font-semibold rounded-lg shadow-sm hover:bg-slate-100 transition-all flex items-center gap-2 self-start md:self-center">
                        <ArrowLeftIcon className="w-5 h-5" /> Kembali
                    </button>
                </div>

                <div className="mt-6 bg-white p-4 rounded-2xl shadow-md border border-slate-200 flex flex-col md:flex-row gap-4 justify-between items-center">
                    <div className="flex flex-col sm:flex-row gap-4 w-full md:w-auto">
                        <div>
                            <label htmlFor="startDate" className="block text-xs font-medium text-slate-600 mb-1">Dari Tanggal</label>
                            <input type="date" id="startDate" value={startDate} onChange={(e) => setStartDate(e.target.value)} className="form-input w-full sm:w-auto rounded-lg border-slate-300"/>
                        </div>
                        <div>
                            <label htmlFor="endDate" className="block text-xs font-medium text-slate-600 mb-1">Sampai Tanggal</label>
                            <input type="date" id="endDate" value={endDate} onChange={(e) => setEndDate(e.target.value)} className="form-input w-full sm:w-auto rounded-lg border-slate-300"/>
                        </div>
                         <div>
                            <label htmlFor="interval" className="block text-xs font-medium text-slate-600 mb-1">Interval</label>
                            <select id="interval" value={interval} onChange={(e) => setInterval(e.target.value)} className="form-select w-full sm:w-auto rounded-lg border-slate-300 bg-white">
                                <option value="day">Harian</option>
                                <option value="week">Mingguan</option>
                                <option value="month">Bulanan</option>
                            </select>
                        </div>
                    </div>
                    <button onClick={handleDownloadPdf} className="w-full md:w-auto px-5 py-2.5 bg-indigo-600 text-white font-bold rounded-lg shadow-md hover:bg-indigo-700 transition-all flex items-center justify-center gap-2">
                        <DocumentArrowDownIcon className="w-5 h-5" /> Unduh PDF
                    </button>
                </div>
            </header>
            
            {loading ? (
                <div className="text-center py-20"><div className="animate-spin rounded-full h-12 w-12 border-b-4 border-indigo-600 mx-auto"></div></div>
            ) : error ? (
                <div className="text-center py-20 text-red-600 bg-red-50 p-6 rounded-2xl"><p>Error: {error}</p></div>
            ) : (
                <main className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                    <KpiCard title="Total Pendapatan" value={salesSummary?.totalRevenue || 'Rp 0'} icon={<BanknotesIcon className="w-6 h-6 text-indigo-500"/>} />
                    <KpiCard title="Total Pesanan" value={salesSummary?.totalOrders || 0} icon={<ShoppingBagIcon className="w-6 h-6 text-indigo-500"/>} />
                    <KpiCard title="Rata-rata/Pesanan" value={salesSummary?.averageOrderValue || 'Rp 0'} icon={<CalculatorIcon className="w-6 h-6 text-indigo-500"/>} />

                    <div className="lg:col-span-3">
                        <ChartCard title="Grafik Penjualan" icon={<ChartBarIcon className="w-6 h-6 text-slate-500"/>}>
                            <div className="h-80"><Line data={salesByDate} options={{responsive: true, maintainAspectRatio: false}} /></div>
                        </ChartCard>
                    </div>
                    
                    <div className="lg:col-span-2">
                        <ChartCard title="Produk Terlaris" icon={<StockIcon className="w-6 h-6 text-slate-500"/>}>
                            <ul className="space-y-3">
                                {topProducts.map((product, index) => (
                                    <li key={index} className="flex justify-between items-center text-sm p-2 rounded-lg hover:bg-slate-50">
                                        <span className="font-bold text-slate-700">{index + 1}. {product.productName}</span>
                                        <div className="text-right">
                                            <span className="font-semibold text-slate-800">{product.totalQuantitySold} pcs</span>
                                            <span className="text-xs text-slate-500 block">{product.totalRevenue}</span>
                                        </div>
                                    </li>
                                ))}
                            </ul>
                        </ChartCard>
                    </div>

                    <div>
                        <ChartCard title="Penjualan per Kategori" icon={<ChartPieIcon className="w-6 h-6 text-slate-500"/>}>
                            <div className="h-80"><Pie data={{
                                labels: salesByCategory.map(item => item.categoryName),
                                datasets: [{
                                    data: salesByCategory.map(item => parseFloat(item.totalRevenue.replace(/[^0-9.-]+/g, ""))),
                                    backgroundColor: ['#4f46e5', '#3b82f6', '#f59e0b', '#10b981', '#8b5cf6', '#ef4444'],
                                    borderColor: '#ffffff',
                                    borderWidth: 2,
                                }]
                            }} options={{responsive: true, maintainAspectRatio: false, plugins: {legend: {position: 'bottom'}}}} /></div>
                        </ChartCard>
                    </div>

                    <div className="lg:col-span-3">
                        <ChartCard title="Laporan Stok Harian" icon={<StockIcon className="w-6 h-6 text-slate-500"/>}>
                            <div className="space-y-2">
                                {dailyStockReport.map((session, index) => (
                                    <div key={index} className="border border-slate-200 rounded-lg">
                                        <button onClick={() => setOpenAccordion(openAccordion === index ? null : index)} className="w-full flex justify-between items-center p-4 text-left font-semibold text-slate-700">
                                            <span>Tanggal: {format(new Date(session.session_date), 'dd MMMM yyyy', { locale: id })}</span>
                                            <div className='flex items-center gap-4'>
                                                <span className={`px-2 py-1 rounded-full text-xs font-semibold ${session.status === 'open' ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}`}>{session.status.toUpperCase()}</span>
                                                <ChevronDownIcon className={`w-5 h-5 transition-transform ${openAccordion === index ? 'rotate-180' : ''}`} />
                                            </div>
                                        </button>
                                        {openAccordion === index && (
                                            <div className="p-4 border-t border-slate-200">
                                                <div className="overflow-x-auto">
                                                    <table className="min-w-full text-sm">
                                                        <thead className="bg-slate-50 text-xs text-slate-600 uppercase">
                                                            <tr>
                                                                <th className="px-4 py-2 text-left">Produk</th>
                                                                <th className="px-4 py-2 text-center">Stok Awal</th>
                                                                <th className="px-4 py-2 text-center">Stok Akhir</th>
                                                                <th className="px-4 py-2 text-center">Terjual</th>
                                                            </tr>
                                                        </thead>
                                                        <tbody className="divide-y divide-slate-200">
                                                            {session.products_stock.map((stock, idx) => (
                                                                <tr key={idx} className="hover:bg-slate-50">
                                                                    <td className="px-4 py-2 font-medium">{stock.product_name}</td>
                                                                    <td className="px-4 py-2 text-center">{stock.initial_stock ?? 'N/A'}</td>
                                                                    <td className="px-4 py-2 text-center">{stock.final_stock ?? 'N/A'}</td>
                                                                    <td className="px-4 py-2 text-center font-semibold text-red-600">{(stock.initial_stock ?? 0) - (stock.final_stock ?? 0)}</td>
                                                                </tr>
                                                            ))}
                                                        </tbody>
                                                    </table>
                                                </div>
                                            </div>
                                        )}
                                    </div>
                                ))}
                            </div>
                        </ChartCard>
                    </div>
                </main>
            )}
        </div>
    );
}

export default SalesReports;
