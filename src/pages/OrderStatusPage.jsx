import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import axios from 'axios';
import Swal from 'sweetalert2';
import pdfMake from 'pdfmake/build/pdfmake';
import * as pdfFonts from 'pdfmake/build/vfs_fonts';

pdfMake.vfs = pdfFonts.pdfMake ? pdfFonts.pdfMake.vfs : pdfFonts;

pdfMake.fonts = {
  Roboto: {
    normal: 'Roboto-Regular.ttf',
    bold: 'Roboto-Medium.ttf',
    italics: 'Roboto-Italic.ttf',
    bolditalics: 'Roboto-MediumItalic.ttf'
  },
};

import {
  CheckCircleIcon, ClockIcon, DocumentArrowDownIcon, ArrowPathIcon,
  UserIcon, QrCodeIcon, WalletIcon, BuildingStorefrontIcon, CurrencyDollarIcon, XCircleIcon, CubeIcon
} from '@heroicons/react/24/solid';

const StatusTracker = ({ status }) => {
    const steps = ['waiting', 'processing', 'completed'];
    const stepLabels = {
        'waiting': 'Pesanan Diterima',
        'processing': 'Diproses Dapur',
        'completed': 'Selesai & Siap Diambil'
    };

    const currentStepIndex = steps.indexOf(status);

    if (status === 'cancelled') {
        return (
            <div className="flex items-center justify-center p-4 bg-red-100 rounded-lg border-2 border-dashed border-red-300">
                <XCircleIcon className="w-10 h-10 text-red-500 mr-4" />
                <div>
                    <h3 className="text-xl font-bold text-red-800">Pesanan Dibatalkan</h3>
                    <p className="text-red-600">Pesanan ini telah dibatalkan.</p>
                </div>
            </div>
        );
    }
    
    return (
        <div className="flex items-center justify-between w-full">
            {steps.map((step, index) => {
                const isActive = index <= currentStepIndex;
                const isCurrent = index === currentStepIndex;

                return (
                    <React.Fragment key={step}>
                        <div className="flex flex-col items-center text-center">
                            <div className={`w-12 h-12 rounded-full flex items-center justify-center border-4
                                ${isActive ? 'bg-orange-500 border-orange-600' : 'bg-gray-200 border-gray-300'}`}>
                                {index < currentStepIndex ? 
                                    <CheckCircleIcon className="w-7 h-7 text-white" /> :
                                    <CubeIcon className={`w-7 h-7 ${isActive ? 'text-white' : 'text-gray-400'}`} />
                                }
                            </div>
                            <p className={`mt-2 text-sm font-bold ${isActive ? 'text-orange-700' : 'text-gray-500'}`}>
                                {stepLabels[step]}
                            </p>
                        </div>
                        {index < steps.length - 1 && (
                            <div className={`flex-grow h-1 mx-2 ${isActive ? 'bg-orange-500' : 'bg-gray-300'}`}></div>
                        )}
                    </React.Fragment>
                );
            })}
        </div>
    );
};


function OrderStatusPage() {
    const { orderUuid } = useParams();
    const navigate = useNavigate();
    const [order, setOrder] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');

    const API_URL = import.meta.env.VITE_SERVER_URL;

    useEffect(() => {
        const fetchOrderStatus = async () => {
            setLoading(true);
            setError('');
            try {
                const response = await axios.get(`${API_URL}/api/orders/${orderUuid}`);
                setOrder(response.data);
            } catch (err) {
                console.error('Error fetching order status:', err);
                setError(err.response?.data?.message || 'Gagal memuat status pesanan.');
                Swal.fire('Error', 'Gagal memuat status pesanan. Pastikan Order ID benar.', 'error');
            } finally {
                setLoading(false);
            }
        };

        fetchOrderStatus();
        const interval = setInterval(fetchOrderStatus, 15000); 

        return () => clearInterval(interval); 
    }, [orderUuid, API_URL]);


    const generateReceiptPdf = () => {
        if (!order) return;
        Swal.fire({
            title: 'Mengunduh Struk...',
            text: 'Mohon tunggu, PDF sedang dibuat.',
            allowOutsideClick: false,
            didOpen: () => Swal.showLoading()
        });

        const tableBody = [
            [{ text: 'Produk', style: 'tableHeader' }, { text: 'Qty', style: 'tableHeader', alignment: 'center' }, { text: 'Subtotal', style: 'tableHeader', alignment: 'right' }]
        ];
        order.items.forEach(item => {
            const addons = item.addons.map(a => `- ${a.addon_value_name}`).join('\n');
            const productText = [{ text: item.product_name, bold: true }, { text: `\n${addons}`, fontSize: 9, italics: true }];
            tableBody.push([
                addons ? productText : item.product_name,
                { text: item.quantity, alignment: 'center' },
                { text: `Rp${parseFloat(item.subtotal).toLocaleString('id-ID')}`, alignment: 'right' }
            ]);
        });

        const docDefinition = {
            content: [
                { text: 'Cafe Kita', style: 'header' },
                { text: 'Struk Pembelian', style: 'subheader' },
                { canvas: [{ type: 'line', x1: 0, y1: 5, x2: 515, y2: 5, lineWidth: 1, lineColor: '#cccccc' }], margin: [0, 0, 0, 10] },
                {
                    columns: [
                        { text: `Order ID: ${order.uuid.substring(0, 13)}...`, fontSize: 9 },
                        { text: `Tanggal: ${new Date(order.created_at).toLocaleString('id-ID')}`, fontSize: 9, alignment: 'right' }
                    ]
                },
                { text: `Nama: ${order.customer_name}`, fontSize: 9 },
                { text: `Meja: ${order.table_number}`, fontSize: 9, margin: [0, 0, 0, 10] },
                {
                    style: 'itemsTable',
                    table: { widths: ['*', 'auto', 'auto'], body: tableBody },
                    layout: 'lightHorizontalLines'
                },
                { canvas: [{ type: 'line', x1: 0, y1: 5, x2: 515, y2: 5, lineWidth: 1, lineColor: '#cccccc' }], margin: [0, 10, 0, 10] },
                {
                    columns: [
                        { text: 'Total', style: 'totalLabel' },
                        { text: `Rp${parseFloat(order.total_amount).toLocaleString('id-ID')}`, style: 'totalValue' }
                    ]
                },
                { text: 'Terima kasih atas kunjungan Anda!', style: 'footer' },
            ],
            styles: {
                header: { fontSize: 24, bold: true, alignment: 'center', color: '#dd6b20' },
                subheader: { fontSize: 14, alignment: 'center', margin: [0, 0, 0, 5], color: '#718096' },
                itemsTable: { margin: [0, 5, 0, 5] },
                tableHeader: { bold: true, fontSize: 12, color: 'black' },
                totalLabel: { bold: true, fontSize: 14, alignment: 'right', margin: [0, 5, 0, 5] },
                totalValue: { bold: true, fontSize: 16, alignment: 'right', margin: [0, 5, 0, 5], color: '#dd6b20' },
                footer: { italics: true, fontSize: 10, alignment: 'center', margin: [0, 20, 0, 0], color: '#718096' }
            },
            defaultStyle: { font: 'Roboto' }
        };

        pdfMake.createPdf(docDefinition).download(`struk_order_${order.uuid.substring(0, 8)}.pdf`, () => {
            Swal.close();
        });
    };

    if (loading) return (
        <div className="min-h-screen bg-orange-50 flex items-center justify-center">
            <div className="animate-spin rounded-full h-16 w-16 border-b-4 border-orange-600"></div>
        </div>
    );

    if (error) return (
        <div className="min-h-screen bg-red-50 flex flex-col items-center justify-center p-4">
            <XCircleIcon className="w-20 h-20 text-red-400 mb-4"/>
            <h2 className="text-2xl font-bold text-red-800">Gagal Memuat Pesanan</h2>
            <p className="text-red-600 mt-2">{error}</p>
            <button onClick={() => navigate('/')} className="mt-6 px-6 py-2 bg-red-600 text-white font-semibold rounded-lg shadow-md hover:bg-red-700 transition-all">Kembali</button>
        </div>
    );

    return (
        <div className="min-h-screen bg-orange-50 p-4 sm:p-6 lg:p-8">
            <div className="max-w-4xl mx-auto bg-white rounded-2xl shadow-xl p-6 md:p-8">
                
                <header className="text-center mb-8">
                    <h1 className="text-4xl font-extrabold text-gray-800">Status Pesanan Anda</h1>
                    <p className="text-gray-500 mt-2 flex items-center justify-center gap-2">
                        <QrCodeIcon className="w-5 h-5"/> 
                        <span className="font-mono">{order.uuid}</span>
                    </p>
                </header>

                <section className="mb-8 p-6 bg-orange-50 rounded-xl">
                    <StatusTracker status={order.order_status} />
                </section>

                <section className="grid md:grid-cols-2 gap-6 mb-8">
                    <div className={`p-5 rounded-xl border-l-8 ${order.payment_status === 'paid' ? 'bg-green-50 border-green-500' : 'bg-yellow-50 border-yellow-500'}`}>
                        <div className="flex items-center gap-3">
                            <WalletIcon className={`w-8 h-8 ${order.payment_status === 'paid' ? 'text-green-500' : 'text-yellow-500'}`} />
                            <div>
                                <p className="text-sm font-semibold text-gray-600">Status Pembayaran</p>
                                <p className={`text-xl font-bold ${order.payment_status === 'paid' ? 'text-green-600' : 'text-yellow-600'}`}>{order.payment_status === 'paid' ? 'Lunas' : 'Belum Lunas'}</p>
                            </div>
                        </div>
                    </div>
                    <div className="p-5 rounded-xl bg-gray-100 border-l-8 border-gray-400">
                         <div className="flex items-center gap-3">
                            <ClockIcon className="w-8 h-8 text-gray-500" />
                            <div>
                                <p className="text-sm font-semibold text-gray-600">Waktu Pesanan</p>
                                <p className="text-xl font-bold text-gray-700">{new Date(order.created_at).toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' })}</p>
                            </div>
                        </div>
                    </div>
                </section>

                <section className="p-6 border border-gray-200 rounded-xl mb-8">
                    <h2 className="text-2xl font-bold text-gray-800 mb-4">Ringkasan Pesanan</h2>
                    <div className="space-y-3">
                        <div className="flex items-center justify-between"><p className="text-gray-600 flex items-center gap-2"><UserIcon className="w-5 h-5 text-gray-400"/>Nama Pelanggan</p><p className="font-bold text-gray-800">{order.customer_name}</p></div>
                        <div className="flex items-center justify-between"><p className="text-gray-600 flex items-center gap-2"><BuildingStorefrontIcon className="w-5 h-5 text-gray-400"/>Nomor Meja</p><p className="font-bold text-gray-800">{order.table_number}</p></div>
                        <div className="flex items-center justify-between"><p className="text-gray-600 flex items-center gap-2"><CurrencyDollarIcon className="w-5 h-5 text-gray-400"/>Metode Bayar</p><p className="font-bold text-gray-800 uppercase">{order.payment_method}</p></div>
                    </div>
                </section>

                <section>
                    <h2 className="text-2xl font-bold text-gray-800 mb-4">Detail Item</h2>
                    <div className="space-y-2">
                        {order.items.map((item) => (
                            <div key={item.id} className="p-4 bg-white flex items-center gap-4 border-b last:border-b-0 border-gray-100">
                                <p className="font-bold text-orange-600">{item.quantity}x</p>
                                <div className="flex-grow">
                                    <p className="font-semibold text-gray-800">{item.product_name}</p>
                                    {item.addons.length > 0 && (
                                        <div className="text-xs text-gray-500">
                                            {item.addons.map(a => a.addon_value_name).join(', ')}
                                        </div>
                                    )}
                                </div>
                                <p className="font-semibold text-gray-800">Rp{parseFloat(item.subtotal).toLocaleString('id-ID')}</p>
                            </div>
                        ))}
                    </div>
                    <div className="flex justify-between items-center mt-4 p-4 bg-orange-50 rounded-lg">
                        <p className="text-xl font-bold text-orange-800">Total Keseluruhan</p>
                        <p className="text-xl font-bold text-orange-800">Rp{parseFloat(order.total_amount).toLocaleString('id-ID')}</p>
                    </div>
                </section>

                <footer className="mt-10 flex flex-col sm:flex-row justify-center items-center gap-4">
                    {order.payment_status === 'paid' && (
                        <button onClick={generateReceiptPdf} className="w-full sm:w-auto px-6 py-3 bg-orange-600 text-white font-bold rounded-lg shadow-md hover:bg-orange-700 transition-all flex items-center justify-center gap-2">
                            <DocumentArrowDownIcon className="w-5 h-5" />Unduh Struk
                        </button>
                    )}
                    <button onClick={() => navigate(`/meja/${order.table_uuid}`)} className="w-full sm:w-auto px-6 py-3 bg-gray-200 text-gray-800 font-bold rounded-lg hover:bg-gray-300 transition-all flex items-center justify-center gap-2">
                        <ArrowPathIcon className="w-5 h-5" />Pesan Lagi
                    </button>
                </footer>
            </div>
        </div>
    );
}

export default OrderStatusPage;