import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';
import Swal from 'sweetalert2';
import {
  ArrowLeftIcon, PlayCircleIcon, StopCircleIcon, XMarkIcon, PencilIcon, ArchiveBoxIcon, ShoppingBagIcon
} from '@heroicons/react/24/solid';
import { format } from 'date-fns';

function StockManagement() {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [dailySession, setDailySession] = useState(null);
  const [products, setProducts] = useState([]);
  const [categories, setCategories] = useState([]);
  const [initialStocks, setInitialStocks] = useState({});
  const [currentStockInputValue, setCurrentStockInputValue] = useState({});

  const [isCategoryModalOpen, setIsCategoryModalOpen] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState(null);
  const [categoryProducts, setCategoryProducts] = useState([]);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const PRODUCTS_PER_PAGE = 10;

  const API_URL = import.meta.env.VITE_SERVER_URL;

  const getAuthHeader = () => ({ headers: { Authorization: `Bearer ${localStorage.getItem('token')}` } });

  useEffect(() => {
    fetchDailySession();
    fetchCategories();
  }, []);

  useEffect(() => {
    if (isCategoryModalOpen && selectedCategory) {
      fetchProductsByCategory(selectedCategory.id, currentPage);
    }
  }, [isCategoryModalOpen, selectedCategory, currentPage]);

  const fetchDailySession = async () => {
    setLoading(true);
    setError('');
    try {
      const response = await axios.get(`${API_URL}/api/stock/daily-session`, getAuthHeader());
      setDailySession(response.data);
      setLoading(false);
    } catch (err) {
      console.error('Error fetching daily session:', err);
      setError(err.response?.data?.message || 'Failed to fetch daily session.');
      Swal.fire('Error', 'Failed to load daily session. Please login again.', 'error');
      if (err.response && [401, 403].includes(err.response.status)) {
        localStorage.removeItem('token');
        navigate('/admin/login');
      }
      setLoading(false);
    }
  };

  const fetchProducts = async () => {
    try {
      const response = await axios.get(`${API_URL}/api/products`, getAuthHeader());
      setProducts(Array.isArray(response.data.products) ? response.data.products.filter(p => p.is_available) : []);
    } catch (err) {
      console.error('Error fetching products:', err);
      Swal.fire('Error', 'Failed to fetch products for stock management.', 'error');
      setProducts([]);
    }
  };

  const fetchCategories = async () => {
    try {
      const response = await axios.get(`${API_URL}/api/products/categories`, getAuthHeader());
      setCategories(response.data);
    } catch (err) {
      console.error('Error fetching categories:', err);
      Swal.fire('Error', 'Failed to fetch categories for stock management.', 'error');
    }
  };

  const fetchProductsByCategory = async (categoryId, page) => {
    setCategoryProducts([]);
    try {
      const response = await axios.get(`${API_URL}/api/products`, {
        ...getAuthHeader(),
        params: { category_id: categoryId, page: page, limit: PRODUCTS_PER_PAGE }
      });
      setCategoryProducts(response.data.products);
      setTotalPages(Math.ceil(response.data.total_count / PRODUCTS_PER_PAGE));
    } catch (err) {
      console.error('Error fetching products by category for modal:', err);
      Swal.fire('Error', 'Failed to fetch products for this category.', 'error');
    }
  };

  const handleOpenOrder = async () => {
    Swal.fire({
      title: 'Open Order untuk Hari Ini?',
      text: 'Ini akan memulai sesi penjualan dan memungkinkan Anda menginput stok awal.',
      icon: 'question',
      showCancelButton: true,
      confirmButtonText: 'Ya, Open Order',
      cancelButtonText: 'Batal',
    }).then(async (result) => {
      if (result.isConfirmed) {
        Swal.fire({ title: 'Opening Order...', allowOutsideClick: false, didOpen: () => Swal.showLoading() });
        const stocksToOpen = products.map(p => ({
            product_id: p.id,
            initial_stock: initialStocks[p.id] !== undefined ? parseInt(initialStocks[p.id]) : (p.current_stock || 0)
        }));
        try {
          await axios.post(`${API_URL}/api/stock/open-session`, { initialStocks: stocksToOpen }, getAuthHeader());
          Swal.fire('Open Order Berhasil!', 'Sesi penjualan harian telah dimulai. Silakan sesuaikan stok awal setiap produk.', 'success');
          fetchDailySession();
          fetchProducts();
        } catch (err) {
          handleApiError(err, 'Gagal membuka sesi penjualan.');
        }
      }
    });
  };

  const handleCloseOrder = async () => {
    Swal.fire({
      title: 'Tutup Order untuk Hari Ini?',
      text: 'Ini akan mengakhiri sesi penjualan dan mencatat stok akhir. Anda tidak bisa lagi menerima pesanan hari ini.',
      icon: 'question',
      showCancelButton: true,
      confirmButtonText: 'Ya, Tutup Order',
      cancelButtonText: 'Batal',
    }).then(async (result) => {
      if (result.isConfirmed) {
        Swal.fire({ title: 'Closing Order...', allowOutsideClick: false, didOpen: () => Swal.showLoading() });
        try {
          await axios.post(`${API_URL}/api/stock/close-session`, {}, getAuthHeader());
          Swal.fire('Close Order Berhasil!', 'Sesi penjualan harian telah ditutup. Stok akhir dicatat.', 'success');
          fetchDailySession();
        } catch (err) {
          handleApiError(err, 'Gagal menutup sesi penjualan.');
        }
      }
    });
  };

  const handleInitialStockChange = (productId, value) => {
    setInitialStocks(prev => ({
      ...prev,
      [productId]: parseInt(value) || 0
    }));
  };

  const handleUpdateProductStock = async (productId, currentStock) => {
    const { value: newStockAmount } = await Swal.fire({
        title: `Atur Stok ${products.find(p => p.id === productId)?.name || 'Produk'}`,
        input: 'number',
        inputValue: currentStock !== null ? currentStock : 0,
        showCancelButton: true,
        confirmButtonText: 'Simpan',
        cancelButtonText: 'Batal',
        inputValidator: (value) => {
            if (value === '' || parseInt(value) < 0) {
                return 'Jumlah stok harus angka non-negatif!';
            }
        }
    });

    if (newStockAmount !== undefined) {
        Swal.fire({ title: 'Memperbarui Stok...', allowOutsideClick: false, didOpen: () => Swal.showLoading() });
        try {
            await axios.put(`${API_URL}/api/stock/products/${productId}/stock`, { new_stock: parseInt(newStockAmount) }, getAuthHeader());
            Swal.fire('Stok Diperbarui!', `Stok berhasil diatur ke ${newStockAmount}.`, 'success');
            fetchProducts(); 
            if (isCategoryModalOpen && selectedCategory) {
                fetchProductsByCategory(selectedCategory.id, currentPage);
            }
            fetchDailySession();
        } catch (err) {
            handleApiError(err, 'Gagal memperbarui stok produk.');
        }
    }
  };

  const handleApiError = (err, defaultMessage) => {
    console.error('API Error:', err);
    const message = err.response?.data?.message || defaultMessage;
    Swal.fire({ icon: 'error', title: 'Error', text: message });
    if (err.response && [401, 403].includes(err.response.status)) {
        localStorage.removeItem('token');
        navigate('/admin/login');
    }
  };

  const openCategoryModal = (category) => {
    setSelectedCategory(category);
    setCurrentPage(1);
    setIsCategoryModalOpen(true);
  };

  const closeCategoryModal = () => {
    setIsCategoryModalOpen(false);
    setSelectedCategory(null);
    setCategoryProducts([]);
    setCurrentPage(1);
    setTotalPages(1);
  };

  const todayDate = format(new Date(), 'dd MMMM yyyy');

  if (loading) {
    return (
      <div className="w-full h-full min-h-screen flex items-center justify-center bg-slate-50">
        <div className="animate-spin rounded-full h-16 w-16 border-b-4 border-indigo-600"></div>
      </div>
    );
  }

  return (
    <div className="p-4 sm:p-6 lg:p-8 bg-slate-50 min-h-full w-full">
      <header className="mb-8 flex flex-col md:flex-row justify-between md:items-center gap-4">
        <div>
          <h1 className="text-4xl font-extrabold text-slate-900">Manajemen Stok Harian</h1>
          <p className="text-slate-500 mt-1">Kelola sesi penjualan harian dan stok produk Anda.</p>
        </div>
        <button onClick={() => navigate('/admin')} className="px-4 py-2 bg-white border border-slate-300 text-slate-700 font-semibold rounded-lg shadow-sm hover:bg-slate-50 transition-all flex items-center gap-2">
          <ArrowLeftIcon className="w-5 h-5" /> Kembali ke Dashboard
        </button>
      </header>

      {/* Daily Session Status & Controls */}
      <div className="bg-white p-6 rounded-2xl shadow-md border border-slate-200 mb-8">
        <h2 className="text-xl font-bold text-slate-800 mb-4">Status Sesi Hari Ini ({todayDate})</h2>
        {dailySession ? (
          <div className="flex items-center gap-4">
            <span className={`px-4 py-2 rounded-full text-white font-semibold text-sm ${dailySession.status === 'open' ? 'bg-green-500' : 'bg-red-500'}`}>
              Sesi: {dailySession.status.toUpperCase()}
            </span>
            <p className="text-slate-700 text-sm">
              Dibuka: {new Date(dailySession.opened_at).toLocaleString()}
              {dailySession.status === 'closed' && ` | Ditutup: ${new Date(dailySession.closed_at).toLocaleString()}`}
            </p>
            {dailySession.status === 'open' && (
              <button onClick={handleCloseOrder} className="ml-auto px-4 py-2 bg-red-600 text-white font-semibold rounded-lg shadow-md hover:bg-red-700 transition-all flex items-center gap-2">
                <StopCircleIcon className="w-5 h-5" /> Tutup Order
              </button>
            )}
            {dailySession.status === 'closed' && (
              <button onClick={handleOpenOrder} disabled={dailySession.session_date === todayDate && dailySession.status === 'closed'} className="ml-auto px-4 py-2 bg-green-600 text-white font-semibold rounded-lg shadow-md hover:bg-green-700 transition-all flex items-center gap-2 disabled:opacity-50">
                <PlayCircleIcon className="w-5 h-5" /> Buka Order
              </button>
            )}
          </div>
        ) : (
          <div className="flex items-center justify-between gap-4">
            <p className="text-slate-700 text-lg font-semibold">Belum ada sesi untuk hari ini.</p>
            <button onClick={handleOpenOrder} className="px-4 py-2 bg-green-600 text-white font-semibold rounded-lg shadow-md hover:bg-green-700 transition-all flex items-center gap-2">
              <PlayCircleIcon className="w-5 h-5" /> Buka Order
            </button>
          </div>
        )}
      </div>

      {/* Daftar Stok Saat Ini per Kategori */}
      <div className="bg-white p-6 rounded-2xl shadow-md border border-slate-200">
        <h2 className="text-xl font-bold text-slate-800 mb-4">Daftar Stok Produk Saat Ini</h2>
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
          {categories.length === 0 ? (
            <p className="col-span-full text-center text-slate-500 py-4">Tidak ada kategori produk.</p>
          ) : (
            categories.map(cat => (
              <button 
                key={cat.id} 
                onClick={() => openCategoryModal(cat)}
                className="flex flex-col items-center justify-center p-4 bg-blue-50 rounded-lg shadow-sm hover:bg-blue-100 transition-all duration-200"
              >
                <ShoppingBagIcon className="w-8 h-8 text-blue-600 mb-2" />
                <span className="text-base font-semibold text-blue-800">{cat.name}</span>
              </button>
            ))
          )}
        </div>
      </div>

      {/* Modal Produk per Kategori */}
      {isCategoryModalOpen && selectedCategory && (
        <div className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-2xl max-h-[90vh] flex flex-col" onClick={(e) => e.stopPropagation()}>
            <div className="flex justify-between items-center p-5 border-b">
              <h2 className="text-xl font-bold text-slate-800">Stok Produk Kategori: {selectedCategory.name}</h2>
              <button onClick={closeCategoryModal} className="p-1 rounded-full hover:bg-slate-100"><XMarkIcon className="w-6 h-6 text-slate-500"/></button>
            </div>
            <div className="p-5 flex-grow overflow-y-auto">
              {categoryProducts.length === 0 ? (
                <p className="text-center text-slate-500 py-10">Tidak ada produk dalam kategori ini.</p>
              ) : (
                <div className="space-y-4">
                  {categoryProducts.map(product => (
                    <div key={product.id} className="flex items-center justify-between gap-4 p-3 border rounded-lg bg-slate-50">
                        <div className="flex items-center gap-3">
                            <div className="w-12 h-12 bg-slate-200 rounded flex-shrink-0 flex items-center justify-center overflow-hidden">
                                {product.image_url ? (
                                    <img src={product.image_url} alt={product.name} className="w-full h-full object-cover"/>
                                ) : (
                                    <ArchiveBoxIcon className="w-8 h-8 text-slate-400"/>
                                )}
                            </div>
                            <div>
                                <p className="font-semibold text-slate-700">{product.name}</p>
                                <p className="text-sm text-slate-500">Stok saat ini: <span className="font-semibold">{product.current_stock !== null ? product.current_stock : 0}</span></p>
                            </div>
                        </div>
                        <div className="flex items-center gap-2">
                            <button 
                                onClick={() => handleUpdateProductStock(product.id, product.current_stock)}
                                className="px-3 py-1.5 bg-blue-600 text-white text-sm font-semibold rounded-lg shadow-sm hover:bg-blue-700 transition-all flex items-center gap-2"
                            >
                                <PencilIcon className="w-4 h-4"/> Atur Stok
                            </button>
                        </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
            {/* Pagination */}
            {totalPages > 1 && (
              <div className="p-4 border-t border-slate-200 flex justify-center items-center gap-2">
                <button onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))} disabled={currentPage === 1} className="px-3 py-1.5 bg-white border border-slate-300 rounded-lg text-slate-700 disabled:opacity-50">Previous</button>
                <span className="text-sm text-slate-700">Page {currentPage} of {totalPages}</span>
                <button onClick={() => setCurrentPage(prev => Math.min(totalPages, prev + 1))} disabled={currentPage === totalPages} className="px-3 py-1.5 bg-white border border-slate-300 rounded-lg text-slate-700 disabled:opacity-50">Next</button>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

export default StockManagement;
