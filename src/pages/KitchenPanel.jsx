import React, { useState, useEffect, useRef } from 'react';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';
import { io } from 'socket.io-client';
import Swal from 'sweetalert2';
import {
    ArrowLeftEndOnRectangleIcon, CheckCircleIcon, ClockIcon, 
    UserCircleIcon, ChatBubbleBottomCenterTextIcon, BellAlertIcon, BellSlashIcon
} from '@heroicons/react/24/solid';

const Timer = ({ startTime }) => {
    const [elapsedTime, setElapsedTime] = useState(Math.floor((Date.now() - new Date(startTime).getTime()) / 1000));

    useEffect(() => {
        const interval = setInterval(() => {
            setElapsedTime(prev => prev + 1);
        }, 1000);
        return () => clearInterval(interval);
    }, [startTime]);

    const formatTime = (totalSeconds) => {
        const minutes = Math.floor(totalSeconds / 60);
        const seconds = totalSeconds % 60;
        return `${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`;
    };

    const timeColor = elapsedTime > 600 ? 'bg-red-500' : elapsedTime > 300 ? 'bg-yellow-500' : 'bg-green-500';

    return (
        <div className={`text-white text-sm font-bold px-3 py-1 rounded-full flex items-center gap-1.5 ${timeColor}`}>
            <ClockIcon className="w-4 h-4" />
            {formatTime(elapsedTime)}
        </div>
    );
};

function KitchenPanel() {
    const [ordersByTable, setOrdersByTable] = useState({});
    const [loading, setLoading] = useState(true);
    const navigate = useNavigate();
    const socket = useRef(null);
    const [loggedInUser, setLoggedInUser] = useState(null);
    const newOrderSoundRef = useRef(null);
    const [audioAllowed, setAudioAllowed] = useState(true); 

    const API_URL = import.meta.env.VITE_SERVER_URL;

    const getAuthHeader = () => ({ headers: { 'Authorization': `Bearer ${localStorage.getItem('token')}` } });

    useEffect(() => {
        const token = localStorage.getItem('token');
        if (token) {
            try {
                const decodedToken = JSON.parse(atob(token.split('.')[1]));
                setLoggedInUser(decodedToken.full_name || decodedToken.username);
            } catch (e) {
                setLoggedInUser("Dapur");
            }
        }
        
        fetchProcessingOrders();

        socket.current = io(API_URL);

        socket.current.on('connect', () => console.log('Socket.IO connected!'));
        socket.current.on('disconnect', () => console.log('Socket.IO disconnected.'));

        socket.current.on('newOrder', (receivedOrder) => {
            if (receivedOrder.orderStatus !== 'processing') return;

            setOrdersByTable(prev => {
                const updatedOrders = { ...prev };
                const table = receivedOrder.tableNumber;
                if (!updatedOrders[table]) updatedOrders[table] = [];
                
                const existingIndex = updatedOrders[table].findIndex(o => o.orderId === receivedOrder.orderId);
                if (existingIndex === -1) {
                    updatedOrders[table].push(receivedOrder);
                    if (audioAllowed) newOrderSoundRef.current?.play().catch(e => console.error("Audio play failed:", e));
                    Swal.fire({ toast: true, position: 'top', icon: 'info', title: `Pesanan Baru: Meja ${table}!`, showConfirmButton: false, timer: 3000 });
                }
                
                return updatedOrders;
            });
        });

        socket.current.on('orderCompleted', ({ orderId }) => {
            setOrdersByTable(prev => {
                const updatedOrders = {};
                Object.keys(prev).forEach(table => {
                    const filteredOrders = prev[table].filter(o => o.orderId !== orderId);
                    if (filteredOrders.length > 0) {
                        updatedOrders[table] = filteredOrders;
                    }
                });
                return updatedOrders;
            });
        });

        return () => {
            socket.current?.disconnect();
        };
    }, []);

    const fetchProcessingOrders = async () => {
        setLoading(true);
        try {
            const response = await axios.get(`${API_URL}/api/kitchen/processing`, getAuthHeader());
            const groupedOrders = response.data.reduce((acc, order) => {
                const { table_number } = order;
                if (!acc[table_number]) acc[table_number] = [];
                acc[table_number].push({
                    orderId: order.id,
                    orderUuid: order.uuid,
                    tableNumber: order.table_number,
                    customerName: order.customer_name,
                    items: order.items,
                    createdAt: order.created_at,
                });
                return acc;
            }, {});
            setOrdersByTable(groupedOrders);
        } catch (err) {
            console.error(err);
        } finally {
            setLoading(false);
        }
    };
    
    const markOrderAsCompleted = (orderId) => {
        Swal.fire({
            title: 'Selesaikan Pesanan Ini?',
            text: `Pastikan semua item sudah disiapkan.`,
            icon: 'question',
            showCancelButton: true,
            confirmButtonText: 'Ya, Selesaikan',
            confirmButtonColor: '#10b981', // Emerald
            cancelButtonText: 'Batal',
        }).then(async (result) => {
            if (result.isConfirmed) {
                try {
                    await axios.put(`${API_URL}/api/kitchen/${orderId}/complete`, {}, getAuthHeader());
                } catch (err) {
                    Swal.fire('Error', 'Gagal menyelesaikan pesanan.', 'error');
                }
            }
        });
    };

    const handleLogout = () => {
        localStorage.removeItem('token');
        navigate('/kitchen/login');
    };
    
    const allOrders = Object.values(ordersByTable).flat().sort((a, b) => new Date(a.createdAt) - new Date(b.createdAt));

    return (
        <div className="min-h-screen bg-gray-50 font-sans">
            <header className="bg-white shadow-sm p-4 flex justify-between items-center sticky top-0 z-20">
                 <div className="flex items-center gap-3">
                    <div className="w-12 h-12 bg-gray-800 rounded-full flex items-center justify-center text-white">
                        <UserCircleIcon className="w-8 h-8"/>
                    </div>
                    <div>
                        <h1 className="text-xl font-extrabold text-gray-800">Panel Dapur</h1>
                        <p className="text-gray-500 text-sm">Masuk sebagai: {loggedInUser || 'Staff'}</p>
                    </div>
                </div>
                <div className="flex items-center gap-4">
                    <button onClick={() => setAudioAllowed(!audioAllowed)} className="p-3 bg-gray-100 rounded-full hover:bg-gray-200 transition-colors" title={audioAllowed ? "Matikan Suara Notifikasi" : "Aktifkan Suara Notifikasi"}>
                        {audioAllowed ? <BellAlertIcon className="w-6 h-6 text-yellow-500"/> : <BellSlashIcon className="w-6 h-6 text-gray-400"/>}
                    </button>
                    <button onClick={handleLogout} className="px-4 py-2 bg-red-600 text-white font-semibold rounded-lg shadow-md hover:bg-red-700 transition-all flex items-center gap-2">
                        <ArrowLeftEndOnRectangleIcon className="w-5 h-5" /> Keluar
                    </button>
                </div>
            </header>
            
            <audio ref={newOrderSoundRef} src="/sounds/new_order_sound.mp3" preload="auto" />
            
            {loading ? (
                <div className="flex flex-col justify-center items-center h-[80vh]">
                    <div className="animate-spin rounded-full h-20 w-20 border-b-4 border-emerald-500"></div>
                    <p className="mt-4 text-lg text-gray-600">Memuat Pesanan...</p>
                </div>
            ) : Object.keys(ordersByTable).length === 0 ? (
                <div className="text-center py-20">
                    <CheckCircleIcon className="w-24 h-24 mx-auto text-green-400"/>
                    <h2 className="mt-4 text-3xl font-bold text-gray-700">Dapur Bersih!</h2>
                    <p className="mt-2 text-lg text-gray-500">Tidak ada pesanan aktif saat ini.</p>
                </div>
            ) : (
                <main className="p-4 sm:p-6 lg:p-8">
                    <div className="grid gap-6 auto-rows-start" style={{ gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))' }}>
                        {allOrders.map(order => (
                            <div key={order.orderId} className="bg-white rounded-2xl shadow-lg border border-gray-200 flex flex-col">
                                <div className="p-5 border-b border-gray-200 flex justify-between items-center bg-gray-50 rounded-t-2xl">
                                    <div>
                                        <h2 className="text-3xl font-bold text-gray-800">Meja {order.tableNumber}</h2>
                                        <p className="text-gray-600">{order.customerName}</p>
                                    </div>
                                    <Timer startTime={order.createdAt} />
                                </div>

                                <div className="p-5 flex-grow">
                                    <ul className="space-y-4">
                                        {order.items.map(item => (
                                            <li key={item.id} className="text-lg">
                                                <p className="font-bold text-xl text-gray-800">{item.quantity}x <span className="text-emerald-700">{item.product_name}</span></p>
                                                {item.addons.length > 0 && (
                                                    <p className="text-sm text-gray-500 pl-7">
                                                        ↳ {item.addons.map(a => a.addon_value_name).join(', ')}
                                                    </p>
                                                )}
                                                {item.notes && (
                                                    <p className="text-sm text-red-600 bg-red-50 p-2 rounded-md mt-1 ml-4 flex items-center gap-2 italic">
                                                        <ChatBubbleBottomCenterTextIcon className="w-4 h-4"/> Catatan: {item.notes}
                                                    </p>
                                                )}
                                            </li>
                                        ))}
                                    </ul>
                                </div>
                                
                                <div className="p-4 mt-auto bg-gray-50 rounded-b-2xl">
                                    <button onClick={() => markOrderAsCompleted(order.orderId)} className="w-full py-4 bg-emerald-600 font-bold text-white rounded-xl shadow-lg hover:bg-emerald-700 transition-all text-lg flex items-center justify-center gap-2 transform hover:scale-105">
                                        <CheckCircleIcon className="w-7 h-7" /> Selesai
                                    </button>
                                </div>
                            </div>
                        ))}
                    </div>
                </main>
            )}
        </div>
    );
}

export default KitchenPanel;