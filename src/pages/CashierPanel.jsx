import React, { useState, useEffect, useRef } from 'react';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';
import Swal from 'sweetalert2';
import {
    ArrowLeftEndOnRectangleIcon, MagnifyingGlassIcon, CurrencyDollarIcon,
    CheckCircleIcon, ArrowPathIcon, UserCircleIcon, ArrowUturnLeftIcon
} from '@heroicons/react/24/solid';

function CashierPanel() {
    const [pendingOrders, setPendingOrders] = useState([]);
    const [selectedOrder, setSelectedOrder] = useState(null);
    const [loading, setLoading] = useState(true);
    const [loggedInUser, setLoggedInUser] = useState(null);

    const manualOrderIdRef = useRef(null);
    const navigate = useNavigate();
    const API_URL = import.meta.env.VITE_SERVER_URL;

    const getAuthHeader = () => ({ headers: { 'Authorization': `Bearer ${localStorage.getItem('token')}` } });

    const handleApiError = (err, defaultMessage) => {
        console.error('API Error:', err);
        const message = err.response?.data?.message || defaultMessage;
        Swal.fire({ icon: 'error', title: 'Error', text: message });
        if (err.response && [401, 403].includes(err.response.status)) {
            localStorage.removeItem('token');
            navigate('/cashier/login');
        }
    };

    const fetchPendingOrders = async () => {
        setLoading(true);
        try {
            const response = await axios.get(`${API_URL}/api/cashier/pending-cash`, getAuthHeader());
            setPendingOrders(response.data);
        } catch (err) {
            handleApiError(err, 'Gagal memuat pesanan tunai tertunda.');
        } finally {
            setLoading(false);
        }
    };

    const fetchOrderDetails = async (uuid) => {
        if (!uuid) return;
        Swal.fire({ title: 'Mengambil Detail Pesanan...', allowOutsideClick: false, didOpen: () => Swal.showLoading() });
        try {
            const response = await axios.get(`${API_URL}/api/cashier/${uuid}`, getAuthHeader());
            setSelectedOrder(response.data);
            Swal.close();
        } catch (err) {
            Swal.close();
            handleApiError(err, 'Pesanan tidak ditemukan atau terjadi kesalahan.');
            setSelectedOrder(null);
        }
    };

    const markOrderAsPaid = async () => {
        if (!selectedOrder) return;
        Swal.fire({
            title: 'Konfirmasi Pembayaran',
            html: `Konfirmasi bahwa Anda telah menerima uang tunai sebesar <strong>Rp${parseFloat(selectedOrder.total_amount).toLocaleString('id-ID')}</strong>?`,
            icon: 'question',
            showCancelButton: true,
            confirmButtonText: 'Ya, Sudah Dibayar',
            confirmButtonColor: '#10b981', 
            cancelButtonText: 'Batal',
        }).then(async (result) => {
            if (result.isConfirmed) {
                Swal.fire({ title: 'Memproses Pembayaran...', allowOutsideClick: false, didOpen: () => Swal.showLoading() });
                try {
                    await axios.put(`${API_URL}/api/cashier/${selectedOrder.uuid}/mark-paid`, {}, getAuthHeader());
                    Swal.fire('Berhasil!', 'Pesanan ditandai lunas dan dikirim ke dapur!', 'success');
                    setSelectedOrder(null);
                    fetchPendingOrders();
                } catch (err) {
                    handleApiError(err, 'Gagal menandai pesanan sebagai lunas.');
                }
            }
        });
    };

    const handleLogout = () => {
        localStorage.removeItem('token');
        navigate('/cashier/login');
    };

    useEffect(() => {
        const token = localStorage.getItem('token');
        if (token) {
            try {
                const decodedToken = JSON.parse(atob(token.split('.')[1]));
                setLoggedInUser(decodedToken.full_name || decodedToken.username);
            } catch (e) {
                setLoggedInUser("Kasir");
            }
        }
        fetchPendingOrders();
    }, []);
    
    if (loading) {
        return (
            <div className="min-h-screen bg-gray-50 flex flex-col items-center justify-center">
                <div className="animate-spin rounded-full h-16 w-16 border-b-4 border-emerald-500"></div>
                <p className="mt-4 text-lg text-gray-600">Memuat Data...</p>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-gray-50">
            <header className="bg-white shadow-sm p-4 flex justify-between items-center sticky top-0 z-10">
                <div className="flex items-center gap-3">
                    <div className="w-12 h-12 bg-emerald-500 rounded-full flex items-center justify-center text-white">
                        <UserCircleIcon className="w-8 h-8"/>
                    </div>
                    <div>
                        <h1 className="text-xl font-extrabold text-gray-800">Panel Kasir</h1>
                        <p className="text-gray-500 text-sm">Masuk sebagai: {loggedInUser || 'Pengguna'}</p>
                    </div>
                </div>
                <button onClick={handleLogout} className="px-4 py-2 bg-red-600 text-white font-semibold rounded-lg shadow-md hover:bg-red-700 transition-all flex items-center gap-2">
                    <ArrowLeftEndOnRectangleIcon className="w-5 h-5" /> Keluar
                </button>
            </header>

            <main className="p-4 sm:p-6 lg:p-8">
                {selectedOrder ? (
                    <div className="max-w-2xl mx-auto animate-fade-in-up">
                         <button onClick={() => setSelectedOrder(null)} className="mb-4 flex items-center gap-2 text-gray-600 font-semibold hover:text-gray-900 transition-colors">
                            <ArrowUturnLeftIcon className="w-5 h-5" /> Kembali ke Daftar
                        </button>
                        <div className="bg-white rounded-3xl shadow-2xl border border-gray-200">
                            <div className="p-6 text-center border-b-2 border-dashed">
                                <h2 className="text-3xl font-bold text-gray-800">Detail Pesanan</h2>
                                <p className="font-mono text-gray-500 mt-1">{selectedOrder.uuid}</p>
                            </div>
                            <div className="p-6 space-y-3">
                                <div className="flex justify-between text-lg"><span className="text-gray-600">Pelanggan:</span><span className="font-bold text-gray-800">{selectedOrder.customer_name}</span></div>
                                <div className="flex justify-between text-lg"><span className="text-gray-600">Meja:</span><span className="font-bold text-gray-800">{selectedOrder.table_number}</span></div>
                            </div>
                            <div className="px-6">
                                <div className="border-t border-gray-200"></div>
                            </div>
                            <div className="p-6 space-y-3">
                                {selectedOrder.items.map(item => (
                                    <div key={item.id} className="flex justify-between items-start">
                                        <div>
                                            <p className="font-semibold text-gray-800">{item.quantity}x {item.product_name}</p>
                                            {item.addons.length > 0 && <p className="text-xs text-gray-500 pl-4">{item.addons.map(a => a.addon_value_name).join(', ')}</p>}
                                        </div>
                                        <p className="font-semibold text-gray-700 whitespace-nowrap">Rp{parseFloat(item.subtotal).toLocaleString('id-ID')}</p>
                                    </div>
                                ))}
                            </div>
                             <div className="p-6 bg-emerald-50 rounded-b-3xl mt-2 flex justify-between items-center">
                                <span className="text-2xl font-bold text-emerald-800">Total</span>
                                <span className="text-3xl font-extrabold text-emerald-600">Rp{parseFloat(selectedOrder.total_amount).toLocaleString('id-ID')}</span>
                            </div>

                            <div className="p-6 text-center">
                                <p className="text-gray-600 mb-3">Setelah menerima uang tunai, tekan tombol di bawah ini untuk mengirim pesanan ke dapur.</p>
                                <button onClick={markOrderAsPaid} className="w-full py-4 bg-emerald-600 text-white font-bold rounded-2xl shadow-lg hover:bg-emerald-700 transition-all text-xl flex items-center justify-center gap-3 transform hover:scale-105">
                                    <CurrencyDollarIcon className="w-7 h-7" /> Konfirmasi Pembayaran Tunai
                                </button>
                            </div>
                        </div>
                    </div>
                ) : (
                    <div className="max-w-4xl mx-auto">
                        <div className="mb-6">
                            <label htmlFor="manualOrderId" className="block text-sm font-medium text-gray-700 mb-2">Cari Pesanan via ID</label>
                            <div className="flex gap-2">
                                <input id="manualOrderId" type="text" ref={manualOrderIdRef} placeholder="Masukkan ID Pesanan lengkap..." onKeyPress={(e) => e.key === 'Enter' && fetchOrderDetails(manualOrderIdRef.current.value.trim())} className="w-full form-input rounded-lg border-gray-300 shadow-sm focus:border-emerald-500 focus:ring-emerald-500"/>
                                <button onClick={() => fetchOrderDetails(manualOrderIdRef.current.value.trim())} className="px-4 py-2 bg-gray-800 text-white font-semibold rounded-lg shadow-md hover:bg-gray-900 transition-all flex items-center justify-center">
                                    <MagnifyingGlassIcon className="w-5 h-5" />
                                </button>
                            </div>
                        </div>

                        <div>
                            <div className="flex justify-between items-center mb-4">
                                <div>
                                    <h2 className="text-2xl font-bold text-gray-800">Pesanan Tunai Tertunda</h2>
                                    <p className="text-gray-500 text-sm">Jika pelanggan datang, segarkan daftar untuk melihat pesanan mereka.</p>
                                </div>
                                <button onClick={fetchPendingOrders} className="p-3 bg-white border border-gray-300 text-gray-700 rounded-full shadow-sm hover:bg-gray-100 hover:scale-110 transition-all" title="Segarkan Daftar">
                                    <ArrowPathIcon className="w-5 h-5" />
                                </button>
                            </div>
                            
                            {pendingOrders.length === 0 ? (
                                    <div className="text-center py-16 bg-white rounded-3xl shadow-md border border-gray-200">
                                        <CheckCircleIcon className="w-20 h-20 mx-auto text-emerald-300"/>
                                        <h3 className="mt-4 text-xl font-semibold text-gray-700">Semua Beres!</h3>
                                        <p className="mt-1 text-gray-500">Tidak ada pembayaran tunai yang tertunda saat ini.</p>
                                    </div>
                                ) : (
                                    <div className="space-y-4">
                                        {pendingOrders.map(order => (
                                            <div key={order.id} onClick={() => fetchOrderDetails(order.uuid)} className="bg-white p-5 rounded-2xl shadow-md border-l-8 border-amber-400 flex flex-col sm:flex-row justify-between sm:items-center gap-3 cursor-pointer hover:shadow-xl hover:-translate-y-1 transition-all">
                                                <div>
                                                    <p className="font-bold text-lg text-gray-800">Meja {order.table_number} - {order.customer_name}</p>
                                                    <p className="text-sm text-gray-500 font-mono">{order.uuid.substring(0, 8)}... ● {new Date(order.created_at).toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' })}</p>
                                                </div>
                                                <p className="text-xl font-bold text-emerald-600 sm:text-right">Rp{parseFloat(order.total_amount).toLocaleString('id-ID')}</p>
                                            </div>
                                        ))}
                                    </div>
                                )
                            }
                        </div>
                    </div>
                )}
            </main>
        </div>
    );
}

export default CashierPanel;