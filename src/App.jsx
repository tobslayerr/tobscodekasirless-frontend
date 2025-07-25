import React, { useState, useEffect } from 'react';
import { Routes, Route, useNavigate, useLocation, Navigate } from 'react-router-dom';
import { io } from 'socket.io-client';
import './index.css';

// LOGIN
import LoginPage from './pages/LoginPage'; 
import CashierLoginPage from './pages/CashierLoginPage'; 
import KitchenLoginPage from './pages/KitchenLoginPage'; 

// UTAMA
import AdminDashboard from './pages/AdminDashboard';
import ProductManagement from './pages/ProductManagement';
import AddonManagement from './pages/AddonManagement';
import TableManagement from './pages/TableManagement';
import OrderPage from './pages/OrderPage'; 
import OrderStatusPage from './pages/OrderStatusPage'; 
import CashierPanel from './pages/CashierPanel'; 
import KitchenPanel from './pages/KitchenPanel'; 
import SalesReports from './pages/SalesReports'; 

// SHARED
import PrivateRouteByRole from './components/PrivateRoute'; 
import Sidebar from './components/Sidebar'; 
import { Bars3Icon } from '@heroicons/react/24/solid'; 

const AdminLayout = ({ children }) => {
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const navigate = useNavigate();
  const location = useLocation(); 

  useEffect(() => {
    setIsSidebarOpen(false);
  }, [location.pathname]);

  const toggleSidebar = () => {
    setIsSidebarOpen(!isSidebarOpen);
  };

  const handleLogout = () => {
    localStorage.removeItem('token'); 
    navigate('/admin/login'); 
  };

  return (
    <div className="flex min-h-screen bg-gray-100">
      <Sidebar isOpen={isSidebarOpen} toggleSidebar={toggleSidebar} handleLogout={handleLogout} />

      <div className="flex-1 flex flex-col w-full">
        <header className="bg-white shadow p-4 lg:hidden flex items-center justify-between">
          <button onClick={toggleSidebar} className="p-2 rounded-md hover:bg-gray-100">
            <Bars3Icon className="w-7 h-7 text-gray-700" />
          </button>
          <h1 className="text-xl font-bold text-gray-800">Sistem Kasir Admin</h1>
          <div className="w-7 h-7"></div>
        </header>

        <main className="flex-1 overflow-y-auto lg:ml-70"> 
          {children}
        </main>
      </div>
    </div>
  );
};


function App() {
  useEffect(() => {
    const socket = io(import.meta.env.VITE_SERVER_URL);
    socket.on('connect', () => { console.log('Connected to Socket.IO server!'); });
    socket.on('disconnect', () => { console.log('Disconnected from Socket.IO server.'); });
    return () => socket.close(); 
  }, []);

  return (
    <Routes>
      <Route path="/admin/login" element={<LoginPage />} />
      <Route path="/cashier/login" element={<CashierLoginPage />} />
      <Route path="/kitchen/login" element={<KitchenLoginPage />} />

      <Route path="/admin/*" element={<PrivateRouteByRole allowedRoles={['admin']}><AdminLayout><AdminRoutes /></AdminLayout></PrivateRouteByRole>} />

      <Route path="/cashier" element={<PrivateRouteByRole allowedRoles={['cashier']}><CashierPanel /></PrivateRouteByRole>} />

      <Route path="/kitchen" element={<PrivateRouteByRole allowedRoles={['kitchen']}><KitchenPanel /></PrivateRouteByRole>} />

      <Route path="/meja/:tableUuid" element={<OrderPage />} />
      <Route path="/order-status/:orderUuid" element={<OrderStatusPage />} />
      
      <Route path="/" element={
        <div className="min-h-screen bg-gray-100 flex items-center justify-center p-4">
          <h1 className="text-3xl font-bold text-blue-600 text-center">
            Selamat datang di Sistem Kasir Modern! Silakan scan QR code di meja Anda untuk memesan.
          </h1>
        </div>
      } />
    </Routes>
  );
}

const AdminRoutes = () => (
  <Routes>
    <Route index element={<AdminDashboard />} /> 
    <Route path="products" element={<ProductManagement />} /> 
    <Route path="addons" element={<AddonManagement />} /> 
    <Route path="tables" element={<TableManagement />} /> 
    <Route path="reports" element={<SalesReports />} /> 
  </Routes>
);

export default App;