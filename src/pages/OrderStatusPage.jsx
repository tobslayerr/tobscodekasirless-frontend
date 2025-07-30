import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import axios from 'axios';
import Swal from 'sweetalert2';
import pdfMake from 'pdfmake/build/pdfmake';
import pdfFonts from 'pdfmake/build/vfs_fonts';

// Konfigurasi Font untuk pdfmake
if (pdfFonts && pdfFonts.pdfMake && pdfFonts.pdfMake.vfs) {
    pdfMake.vfs = pdfFonts.pdfMake.vfs;
}
pdfMake.fonts = {
    Roboto: {
        normal: 'Roboto-Regular.ttf',
        bold: 'Roboto-Medium.ttf',
        italics: 'Roboto-Italic.ttf',
        bolditalics: 'Roboto-MediumItalic.ttf'
    }
};


import {
    CheckCircleIcon, ClockIcon, DocumentArrowDownIcon, ArrowPathIcon,
    ClipboardDocumentCheckIcon, QrCodeIcon
} from '@heroicons/react/24/solid';

function OrderStatusPage() {
    const { orderUuid } = useParams();
    const navigate = useNavigate();
    const [order, setOrder] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');

    const API_URL = import.meta.env.VITE_SERVER_URL;

    useEffect(() => {
        fetchOrderStatus();
    }, [orderUuid]);

    const fetchOrderStatus = async () => {
        setLoading(true);
        setError('');
        try {
            const response = await axios.get(`${API_URL}/api/orders/${orderUuid}`);
            setOrder(response.data);
        } catch (err) {
            console.error('Error fetching order status:', err);
            const errorMessage = err.response?.data?.message || 'Gagal memuat status pesanan. Pastikan Order ID benar.';
            setError(errorMessage);
            Swal.fire('Error', errorMessage, 'error');
        } finally {
            setLoading(false);
        }
    };

    const generateReceiptPdf = () => {
        if (!order) return Swal.fire('Error', 'Data pesanan tidak ditemukan.', 'error');

        Swal.fire({ title: 'Membuat Struk...', allowOutsideClick: false, didOpen: () => Swal.showLoading() });

        const tableHeader = [
            { text: 'Item', style: 'tableHeader', alignment: 'left' },
            { text: 'Qty', style: 'tableHeader', alignment: 'center' },
            { text: 'Harga', style: 'tableHeader', alignment: 'right' },
            { text: 'Subtotal', style: 'tableHeader', alignment: 'right' },
        ];

        const tableBody = order.items.map(item => {
            const addonsText = item.addons.map(a => `  - ${a.addon_value_name}`).join('\n');
            const itemName = { text: `${item.product_name}\n`, bold: true };
            const itemAddons = { text: addonsText, style: 'addonsText' };
            
            return [
                { text: [itemName, itemAddons], style: 'itemText' },
                { text: item.quantity, alignment: 'center', style: 'itemText' },
                { text: `Rp${parseFloat(item.base_price).toLocaleString('id-ID')}`, alignment: 'right', style: 'itemText' },
                { text: `Rp${parseFloat(item.subtotal).toLocaleString('id-ID')}`, alignment: 'right', style: 'itemText' }
            ];
        });

        const docDefinition = {
            content: [
                { text: 'Struk Pesanan', style: 'header' },
                { text: 'Terima Kasih Atas Pesanan Anda', alignment: 'center', style: 'subheader' },
                { canvas: [{ type: 'line', x1: 0, y1: 5, x2: 515, y2: 5, lineWidth: 1, lineColor: '#cccccc' }], margin: [0, 10, 0, 10] },
                {
                    columns: [
                        { text: `Nama: ${order.customer_name}\nMeja: ${order.table_number}`, style: 'infoText' },
                        { text: `Order ID: ${order.uuid}\nTanggal: ${new Date(order.created_at).toLocaleString('id-ID')}`, style: 'infoText', alignment: 'right' },
                    ]
                },
                { canvas: [{ type: 'line', x1: 0, y1: 5, x2: 515, y2: 5, lineWidth: 0.5, lineColor: '#eeeeee' }], margin: [0, 10, 0, 10] },
                {
                    table: {
                        headerRows: 1,
                        widths: ['*', 'auto', 'auto', 'auto'],
                        body: [tableHeader, ...tableBody]
                    },
                    layout: 'lightHorizontalLines'
                },
                { canvas: [{ type: 'line', x1: 0, y1: 5, x2: 515, y2: 5, lineWidth: 0.5, lineColor: '#eeeeee' }], margin: [0, 10, 0, 10] },
                {
                    columns: [
                        { text: 'Metode Pembayaran', style: 'summaryTitle' },
                        { text: order.payment_method.toUpperCase(), style: 'summaryValue', alignment: 'right' }
                    ]
                },
                {
                    columns: [
                        { text: 'Total', style: 'totalTitle' },
                        { text: `Rp${parseFloat(order.total_amount).toLocaleString('id-ID')}`, style: 'totalValue', alignment: 'right' }
                    ]
                },
            ],
            styles: {
                header: { fontSize: 24, bold: true, alignment: 'center', color: '#1e293b' },
                subheader: { fontSize: 10, alignment: 'center', color: '#64748b', margin: [0, 0, 0, 10] },
                infoText: { fontSize: 9, color: '#475569' },
                tableHeader: { bold: true, fontSize: 10, color: '#334155' },
                itemText: { fontSize: 10, color: '#334155' },
                addonsText: { fontSize: 8, color: '#64748b', italics: true },
                summaryTitle: { fontSize: 10, color: '#475569' },
                summaryValue: { fontSize: 10, bold: true, color: '#1e293b' },
                totalTitle: { fontSize: 14, bold: true, color: '#1e293b' },
                totalValue: { fontSize: 14, bold: true, color: '#4f46e5' },
            },
            defaultStyle: { font: 'Roboto' }
        };

        pdfMake.createPdf(docDefinition).download(`Struk_Order_${order.uuid.substring(0, 8)}.pdf`, () => {
            Swal.close();
        });
    };
    
    const StatusBadge = ({ status, type }) => {
        let text, color, Icon;
        switch (status) {
            case 'paid': text = 'Lunas'; color = 'green'; Icon = CheckCircleIcon; break;
            case 'completed': text = 'Selesai'; color = 'green'; Icon = CheckCircleIcon; break;
            case 'pending': text = 'Menunggu'; color = 'yellow'; Icon = ClockIcon; break;
            case 'waiting': text = 'Menunggu'; color = 'yellow'; Icon = ClockIcon; break;
            case 'processing': text = 'Diproses'; color = 'blue'; Icon = ClockIcon; break;
            case 'failed': text = 'Gagal'; color = 'red'; Icon = ClockIcon; break;
            case 'cancelled': text = 'Dibatalkan'; color = 'red'; Icon = ClockIcon; break;
            default: text = 'Tidak Diketahui'; color = 'gray'; Icon = ClockIcon; break;
        }
        
        const colors = {
            green: 'bg-green-100 text-green-800',
            yellow: 'bg-yellow-100 text-yellow-800',
            blue: 'bg-blue-100 text-blue-800',
            red: 'bg-red-100 text-red-800',
            gray: 'bg-gray-100 text-gray-800',
        };

        return (
            <div className='text-center'>
                <p className="text-sm font-semibold text-slate-500 mb-2">{type}</p>
                <div className={`inline-flex items-center gap-2 px-4 py-2 rounded-full font-bold text-lg ${colors[color]}`}>
                    <Icon className="w-6 h-6" />
                    <span>{text}</span>
                </div>
            </div>
        );
    };

    if (loading) return (
        <div className="min-h-screen bg-slate-50 flex items-center justify-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-4 border-indigo-600"></div>
        </div>
    );

    if (error) return (
         <div className="min-h-screen bg-slate-50 flex items-center justify-center p-4">
             <div className="text-center bg-white p-8 rounded-2xl shadow-lg">
                <h2 className="text-2xl font-bold text-red-600 mb-2">Terjadi Kesalahan</h2>
                <p className="text-slate-600">{error}</p>
                <button onClick={() => navigate('/')} className="mt-6 px-6 py-2 bg-indigo-600 text-white font-semibold rounded-lg shadow-md hover:bg-indigo-700">Kembali</button>
             </div>
        </div>
    );

    return (
        <div className="min-h-screen bg-slate-50 p-4 sm:p-6 md:p-8">
            <main className="max-w-2xl mx-auto">
                <div className="bg-white rounded-2xl shadow-xl border border-slate-200">
                    <div className="p-8 text-center border-b-2 border-dashed">
                        <h1 className="text-3xl font-extrabold text-slate-800">Status Pesanan</h1>
                        <p className="text-slate-500 mt-1">Terima kasih, {order.customer_name}!</p>
                    </div>

                    <div className="p-8 grid grid-cols-2 gap-6">
                        <StatusBadge status={order.payment_status} type="Status Pembayaran"/>
                        <StatusBadge status={order.order_status} type="Status Pesanan"/>
                    </div>
                    
                    <div className="p-8 bg-slate-50">
                        <h2 className="text-lg font-bold text-slate-800 mb-4 text-center">Ringkasan Pesanan</h2>
                        <div className="space-y-3 text-sm text-slate-600">
                             <div className="flex justify-between"><span className="font-semibold">Order ID:</span> <span className="font-mono">{order.uuid}</span></div>
                             <div className="flex justify-between"><span className="font-semibold">Meja:</span> <span>{order.table_number}</span></div>
                             <div className="flex justify-between"><span className="font-semibold">Tanggal:</span> <span>{new Date(order.created_at).toLocaleString('id-ID')}</span></div>
                             <div className="flex justify-between"><span className="font-semibold">Metode Bayar:</span> <span className="font-bold uppercase">{order.payment_method}</span></div>
                        </div>
                    </div>
                    
                    {order.payment_method === 'cash' && order.payment_status !== 'paid' && (
                        <div className="p-8 border-t border-slate-200 text-center bg-yellow-50">
                            <QrCodeIcon className="w-10 h-10 text-yellow-600 mx-auto mb-2"/>
                            <h3 className="font-bold text-yellow-800">Tunjukkan Order ID ke Kasir</h3>
                            <p className="text-sm text-yellow-700 mt-1">Untuk menyelesaikan pembayaran</p>
                        </div>
                    )}
                    
                    <div className="p-8 border-t border-slate-200">
                        <h2 className="text-lg font-bold text-slate-800 mb-4">Detail Item</h2>
                        <div className="space-y-4">
                            {order.items.map((item) => (
                                <div key={item.id} className="pb-4 border-b border-slate-100 last:border-none">
                                    <div className="flex justify-between font-semibold text-slate-800">
                                        <span>{item.product_name} x {item.quantity}</span>
                                        <span>Rp{parseFloat(item.subtotal).toLocaleString('id-ID')}</span>
                                    </div>
                                    {item.addons && item.addons.length > 0 && (
                                        <div className="text-xs text-slate-500 mt-1 pl-2">
                                            {item.addons.map((addon, idx) => (
                                                <p key={idx}>- {addon.addon_value_name}</p>
                                            ))}
                                        </div>
                                    )}
                                </div>
                            ))}
                        </div>
                         <div className="mt-6 flex justify-between items-center text-xl font-bold text-slate-900">
                            <span>Total</span>
                            <span className="text-indigo-600">Rp{parseFloat(order.total_amount).toLocaleString('id-ID')}</span>
                        </div>
                    </div>
                </div>

                <div className="mt-6 flex flex-col sm:flex-row justify-center gap-4">
                    {order.payment_status === 'paid' && (
                        <button onClick={generateReceiptPdf} className="w-full px-6 py-3 bg-green-600 text-white font-bold rounded-lg shadow-md hover:bg-green-700 transition flex items-center justify-center gap-2">
                            <DocumentArrowDownIcon className="w-5 h-5" /> Unduh Struk
                        </button>
                    )}
                    <button onClick={() => navigate(`/meja/${order.table_uuid}`)} className="w-full px-6 py-3 bg-indigo-600 text-white font-bold rounded-lg shadow-md hover:bg-indigo-700 transition flex items-center justify-center gap-2">
                        <ArrowPathIcon className="w-5 h-5" /> Pesan Lagi
                    </button>
                </div>
            </main>
        </div>
    );
}

export default OrderStatusPage;
