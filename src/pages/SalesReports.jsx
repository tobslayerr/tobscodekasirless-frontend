import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';
import Swal from 'sweetalert2';
import { Line, Pie } from 'react-chartjs-2';
import { Chart as ChartJS, CategoryScale, LinearScale, PointElement, LineElement, BarElement, ArcElement, Title, Tooltip, Legend } from 'chart.js';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import { format } from 'date-fns';
import { DocumentArrowDownIcon, ChartBarIcon, ClipboardDocumentListIcon, CurrencyDollarIcon, PresentationChartLineIcon } from '@heroicons/react/24/solid';

ChartJS.register(CategoryScale, LinearScale, PointElement, LineElement, BarElement, ArcElement, Title, Tooltip, Legend);

function SalesReports() {
    const navigate = useNavigate();
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const [salesSummary, setSalesSummary] = useState(null);
    const [salesByDate, setSalesByDate] = useState({ labels: [], datasets: [] });
    const [topProducts, setTopProducts] = useState([]);
    const [salesByCategory, setSalesByCategory] = useState([]);
    const [startDate, setStartDate] = useState('');
    const [endDate, setEndDate] = useState('');
    const [interval, setInterval] = useState('day');

    const API_URL = import.meta.env.VITE_SERVER_URL;

    const getAuthHeader = () => ({ headers: { Authorization: `Bearer ${localStorage.getItem('token')}` } });

    useEffect(() => {
        const today = new Date();
        const thirtyDaysAgo = new Date(new Date().setDate(today.getDate() - 30));
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
            const authHeader = getAuthHeader();
            const commonParams = { params: { startDate, endDate }, ...authHeader };
            const [summaryRes, byDateRes, topProductsRes, byCategoryRes] = await Promise.all([
                axios.get(`${API_URL}/api/reports/summary`, commonParams),
                axios.get(`${API_URL}/api/reports/by-date`, { ...commonParams, params: { ...commonParams.params, interval } }),
                axios.get(`${API_URL}/api/reports/top-products`, { ...commonParams, params: { ...commonParams.params, limit: 5 } }),
                axios.get(`${API_URL}/api/reports/by-category`, commonParams),
            ]);

            setSalesSummary(summaryRes.data);
            setTopProducts(topProductsRes.data);
            setSalesByCategory(byCategoryRes.data);

            setSalesByDate({
                labels: byDateRes.data.map(item => item.period),
                datasets: [{
                    label: 'Total Penjualan',
                    data: byDateRes.data.map(item => item.totalSales),
                    borderColor: '#4f46e5',
                    backgroundColor: 'rgba(79, 70, 229, 0.1)',
                    fill: true,
                    tension: 0.3,
                    pointBackgroundColor: '#4f46e5',
                    pointRadius: 4,
                }]
            });
        } catch (err) {
            console.error('Error fetching reports:', err);
            setError(err.response?.data?.message || 'Gagal memuat laporan.');
            if (err.response && [401, 403].includes(err.response.status)) {
                navigate('/admin/login');
            }
        } finally {
            setLoading(false);
        }
    };

    const chartOptions = {
        responsive: true,
        maintainAspectRatio: false,
        plugins: { legend: { display: false } },
        scales: {
            x: { grid: { display: false } },
            y: {
                beginAtZero: true,
                ticks: {
                    callback: (value) => `Rp${(value / 1000).toLocaleString('id-ID')}k`
                }
            }
        }
    };
    
    const pieChartData = {
        labels: salesByCategory.map(item => item.categoryName),
        datasets: [{
            data: salesByCategory.map(item => parseFloat(item.totalRevenue.replace(/[^0-9.-]+/g,""))),
            backgroundColor: ['#4f46e5', '#3b82f6', '#14b8a6', '#f97316', '#facc15', '#a855f7'],
            borderColor: '#ffffff',
            borderWidth: 2,
        }]
    };

    const pieChartOptions = {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
            legend: { position: 'right' }
        }
    };

    const handleDownloadPdf = () => {
        Swal.fire({ title: 'Membuat Laporan PDF...', allowOutsideClick: false, didOpen: () => Swal.showLoading() });
        const doc = new jsPDF();
        
        doc.setFont('helvetica', 'bold');
        doc.setFontSize(20);
        doc.text('Laporan Penjualan', doc.internal.pageSize.getWidth() / 2, 20, { align: 'center' });
        doc.setFontSize(10);
        doc.setFont('helvetica', 'normal');
        doc.text(`Periode: ${startDate} s/d ${endDate}`, doc.internal.pageSize.getWidth() / 2, 28, { align: 'center' });

        if (salesSummary) {
            const summaryData = [
                ['Total Pendapatan', 'Total Pesanan', 'Rata-rata per Pesanan'],
                [salesSummary.totalRevenue, salesSummary.totalOrders, salesSummary.averageOrderValue]
            ];
            autoTable(doc, {
                startY: 35,
                head: summaryData.slice(0, 1),
                body: summaryData.slice(1),
                theme: 'striped',
                headStyles: { fillColor: [79, 70, 229] },
                bodyStyles: { halign: 'center' }
            });
        }

        const topProductsRows = topProducts.map((p, i) => [i + 1, p.productName, p.totalQuantitySold, p.totalRevenue]);
        autoTable(doc, {
            startY: (doc.lastAutoTable && doc.lastAutoTable.finalY ? doc.lastAutoTable.finalY : 35) + 10,
            head: [['No.', 'Produk Terlaris', 'Jumlah', 'Pendapatan']],
            body: topProductsRows,
            theme: 'grid',
            headStyles: { fillColor: [79, 70, 229] }
        });

        const salesByCategoryRows = salesByCategory.map(c => [c.categoryName, c.totalRevenue]);
        autoTable(doc, {
            startY: doc.lastAutoTable.finalY + 10,
            head: [['Penjualan per Kategori', 'Pendapatan']],
            body: salesByCategoryRows,
            theme: 'grid',
            headStyles: { fillColor: [79, 70, 229] }
        });

        doc.save(`Laporan_Penjualan_${startDate}_${endDate}.pdf`);
        Swal.close();
    };

    const KSPCard = ({ title, value, icon }) => (
        <div className="bg-white p-6 rounded-2xl shadow-md border border-slate-200 flex items-center gap-5">
            <div className="bg-indigo-100 text-indigo-600 p-4 rounded-full">{icon}</div>
            <div>
                <p className="text-slate-500 font-medium">{title}</p>
                <p className="text-3xl font-bold text-slate-800">{value}</p>
            </div>
        </div>
    );

    if (loading) {
        return (
            <div className="w-full h-full min-h-screen flex items-center justify-center bg-slate-50">
                <div className="animate-spin rounded-full h-16 w-16 border-b-4 border-indigo-600"></div>
            </div>
        );
    }
    
    if (error) return <div className="p-10 text-center text-red-500">Error: {error}</div>;

    return (
        <div className="p-4 sm:p-6 lg:p-8 bg-slate-50 min-h-full">
            <header className="mb-8">
                <div className="flex flex-col md:flex-row justify-between md:items-center gap-4">
                    <div>
                        <h1 className="text-4xl font-extrabold text-slate-900">Laporan Penjualan</h1>
                        <p className="text-slate-500 mt-1">Analisis performa bisnis Anda dalam rentang waktu yang dipilih.</p>
                    </div>
                    <div className="flex items-center gap-2">
                        <input type="date" value={startDate} onChange={e => setStartDate(e.target.value)} className="form-input rounded-lg border-slate-300"/>
                        <span className="text-slate-500">s/d</span>
                        <input type="date" value={endDate} onChange={e => setEndDate(e.target.value)} className="form-input rounded-lg border-slate-300"/>
                        <button onClick={handleDownloadPdf} className="p-3 bg-indigo-600 text-white rounded-lg shadow-md hover:bg-indigo-700 transition-all flex items-center">
                            <DocumentArrowDownIcon className="w-5 h-5"/>
                        </button>
                    </div>
                </div>
            </header>

            <main className="space-y-8">
                <section className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    <KSPCard title="Total Pendapatan" value={salesSummary?.totalRevenue || 'Rp0'} icon={<CurrencyDollarIcon className="w-8 h-8"/>}/>
                    <KSPCard title="Total Pesanan" value={salesSummary?.totalOrders || 0} icon={<ClipboardDocumentListIcon className="w-8 h-8"/>}/>
                    <KSPCard title="Rata-rata per Pesanan" value={salesSummary?.averageOrderValue || 'Rp0'} icon={<PresentationChartLineIcon className="w-8 h-8"/>}/>
                </section>

                <section className="bg-white p-6 rounded-2xl shadow-md border border-slate-200">
                    <div className="flex justify-between items-center mb-4">
                         <h2 className="text-xl font-bold text-slate-800">Tren Penjualan</h2>
                         <div className="flex gap-1 bg-slate-100 p-1 rounded-lg">
                            {['day', 'week', 'month'].map(val => (
                                <button key={val} onClick={() => setInterval(val)} className={`px-4 py-1 text-sm font-semibold rounded-md transition-all ${interval === val ? 'bg-white text-indigo-600 shadow-sm' : 'text-slate-600'}`}>
                                    {val.charAt(0).toUpperCase() + val.slice(1)}
                                </button>
                            ))}
                         </div>
                    </div>
                    <div className="h-80"><Line data={salesByDate} options={chartOptions} /></div>
                </section>

                <section className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                    <div className="lg:col-span-2 bg-white p-6 rounded-2xl shadow-md border border-slate-200">
                        <h2 className="text-xl font-bold text-slate-800 mb-4">Produk Terlaris</h2>
                        <div className="space-y-4">
                            {topProducts.length > 0 ? topProducts.map((product, index) => (
                                <div key={index}>
                                    <div className="flex justify-between items-center text-sm mb-1">
                                        <p className="font-medium text-slate-700">{index + 1}. {product.productName}</p>
                                        <p className="font-semibold text-slate-500">{product.totalQuantitySold} pcs ({product.totalRevenue})</p>
                                    </div>
                                    <div className="w-full bg-slate-200 rounded-full h-2.5">
                                        <div className="bg-indigo-500 h-2.5 rounded-full" style={{ width: `${(product.totalQuantitySold / topProducts[0].totalQuantitySold) * 100}%` }}></div>
                                    </div>
                                </div>
                            )) : <p className="text-slate-500 text-center">Tidak ada data untuk periode ini.</p>}
                        </div>
                    </div>
                    <div className="bg-white p-6 rounded-2xl shadow-md border border-slate-200">
                        <h2 className="text-xl font-bold text-slate-800 mb-4">Penjualan per Kategori</h2>
                        <div className="h-64">{salesByCategory.length > 0 ? <Pie data={pieChartData} options={pieChartOptions} /> : <p className="text-slate-500 text-center h-full flex items-center justify-center">Tidak ada data.</p>}</div>
                    </div>
                </section>
            </main>
        </div>
    );
}

export default SalesReports;