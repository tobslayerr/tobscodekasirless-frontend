import React, { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import axios from 'axios';
import Swal from 'sweetalert2';
import {
    ShoppingCartIcon, MagnifyingGlassIcon, ClockIcon, BuildingStorefrontIcon, ArrowPathIcon
} from '@heroicons/react/24/solid';

import ProductDetailModal from '../components/ProductDetailModal';
import CartSidePanel from '../components/CartSidePanel';

// Komponen untuk Kartu Produk
const ProductCard = ({ product, onProductClick }) => (
    <div 
        className="group bg-white rounded-2xl shadow-lg overflow-hidden relative flex flex-col transition-all duration-300 ease-in-out hover:shadow-2xl hover:-translate-y-1 cursor-pointer"
        onClick={onProductClick}
    >
        {/* Indikator Stok Habis */}
        {product.current_stock !== null && product.current_stock <= 0 && (
            <div className="absolute inset-0 bg-black bg-opacity-50 flex items-center justify-center z-10 rounded-2xl">
                <span className="text-white font-bold text-lg bg-red-600 px-4 py-2 rounded-full shadow-lg">Stok Habis</span>
            </div>
        )}
        
        {/* Gambar Produk */}
        <div className={`w-full aspect-square bg-gray-100 overflow-hidden ${product.current_stock !== null && product.current_stock <= 0 ? 'opacity-60' : ''}`}>
            {product.image_url ? (
                <img 
                    src={product.image_url} 
                    alt={product.name} 
                    className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-110"
                />
            ) : (
                <div className="w-full h-full flex items-center justify-center">
                    <BuildingStorefrontIcon className="w-16 h-16 text-gray-300"/>
                </div>
            )}
        </div>

        {/* Detail Produk */}
        <div className="p-4 flex flex-col flex-grow">
            <h3 className="text-base sm:text-lg font-bold text-gray-800 leading-tight flex-grow">
                {product.name}
            </h3>
            <p className="text-indigo-600 font-extrabold text-xl mt-2">
                Rp{parseFloat(product.price).toLocaleString('id-ID')}
            </p>
        </div>
        
        {/* Tombol Tambah (Hover) */}
         {product.current_stock > 0 && (
            <div className="absolute inset-0 bg-black bg-opacity-0 group-hover:bg-opacity-40 flex items-center justify-center transition-all duration-300 opacity-0 group-hover:opacity-100">
                <span className="bg-white text-indigo-600 font-bold px-6 py-3 rounded-full shadow-xl transform group-hover:scale-100 scale-90 transition-transform duration-300">
                    Tambah
                </span>
            </div>
        )}
    </div>
);


function OrderPage() {
    const { tableUuid } = useParams();
    const navigate = useNavigate();
    const [products, setProducts] = useState([]);
    const [categories, setCategories] = useState([]);
    const [activeCategory, setActiveCategory] = useState('all');
    const [cart, setCart] = useState([]);
    const [customerName, setCustomerName] = useState('');
    const [searchTerm, setSearchTerm] = useState(''); 
    const [isCartOpen, setIsCartOpen] = useState(false); 

    const [showProductModal, setShowProductModal] = useState(false);
    const [selectedProduct, setSelectedProduct] = useState(null);

    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const [tableNumber, setTableNumber] = useState('');

    const [dailySessionStatus, setDailySessionStatus] = useState('loading'); 

    const API_URL = import.meta.env.VITE_SERVER_URL;

    useEffect(() => {
        fetchInitialData();
    }, [tableUuid]);

    const fetchInitialData = async () => {
        setLoading(true);
        setError('');
        try {
            const sessionPromise = axios.get(`${API_URL}/api/stock/status`);
            const productsPromise = axios.get(`${API_URL}/api/products`);
            const categoriesPromise = axios.get(`${API_URL}/api/products/categories`);
            const tablePromise = axios.get(`${API_URL}/api/tables/uuid/${tableUuid}`);
    
            const [sessionRes, productsRes, categoriesRes, tableRes] = await Promise.all([
                sessionPromise,
                productsPromise,
                categoriesPromise,
                tablePromise
            ]);
    
            setDailySessionStatus(sessionRes.data.status);
            setProducts(
                Array.isArray(productsRes.data.products)
                    ? productsRes.data.products.filter(p => p.is_available && p.name)
                    : []
            );
            setCategories(categoriesRes.data);
            setTableNumber(tableRes.data.table_number);
    
        } catch (err) {
            console.error('Error fetching initial data:', err);
            setError('Gagal memuat menu. Mohon coba lagi nanti.');
            Swal.fire({
                icon: 'error',
                title: 'Gagal Terhubung',
                text: 'Terjadi kesalahan saat memuat data. Periksa koneksi Anda dan coba muat ulang halaman.',
            });
        } finally {
            setLoading(false);
        }
    };

    const fetchAddonDetails = async (productId) => {
        try {
            const response = await axios.get(`${API_URL}/api/addons/product/${productId}`);
            const addonOptions = response.data;
            const fullAddonDetails = {};
            for (const option of addonOptions) {
                const valueResponse = await axios.get(`${API_URL}/api/addons/values/${option.addon_option_id}`);
                fullAddonDetails[option.addon_option_id] = {
                    name: option.addon_option_name,
                    values: valueResponse.data
                };
            }
            return fullAddonDetails;
        } catch (err) {
            console.error('Error fetching addon details:', err);
            return {};
        }
    };

    const openProductModal = async (product) => {
        if (dailySessionStatus !== 'open') {
            Swal.fire('Toko Tutup', 'Maaf, kami sedang tidak menerima pesanan saat ini.', 'info');
            return;
        }
        if (product.current_stock !== null && product.current_stock <= 0) {
            Swal.fire('Stok Habis', `Maaf, stok ${product.name} saat ini habis.`, 'warning');
            return;
        }

        Swal.fire({ title: 'Memuat Opsi...', allowOutsideClick: false, didOpen: () => Swal.showLoading() });
        const addons = await fetchAddonDetails(product.id);
        Swal.close();

        setSelectedProduct({ ...product, fullAddons: addons });
        setShowProductModal(true);
    };

    const closeProductModal = () => {
        setShowProductModal(false);
        setSelectedProduct(null);
    };

    // --- FUNGSI DIPERBAIKI DI SINI ---
    const addToCart = (quantity, notes, addons) => {
        if (!selectedProduct) return; // Gunakan selectedProduct dari state

        const addonsForBackend = Object.keys(addons).map(optionId => {
            const value = addons[optionId];
            const optionDetails = selectedProduct.fullAddons[optionId]; // Gunakan selectedProduct
            const valueDetails = optionDetails?.values.find(v => v.id === value.id);
            return {
                addon_option_id: parseInt(optionId),
                addon_value_id: value.id,
                addon_option_name: optionDetails?.name,
                addon_value_name: valueDetails?.value,
                price_impact: value.price_impact,
            };
        });

        const newItem = {
            product_id: selectedProduct.id, // Gunakan selectedProduct
            product_name: selectedProduct.name, // Gunakan selectedProduct
            base_price: parseFloat(selectedProduct.price), // Gunakan selectedProduct
            quantity: quantity,
            notes: notes,
            selected_addons: addonsForBackend,
            product_image: selectedProduct.image_url, // Gunakan selectedProduct
            total_item_price: (parseFloat(selectedProduct.price) + Object.values(addons).reduce((sum, addon) => sum + parseFloat(addon.price_impact), 0)) * quantity, // Gunakan selectedProduct
            display_addons: addonsForBackend.map(a => ({
                option: a.addon_option_name,
                value: a.addon_value_name,
                price_impact: a.price_impact
            }))
        };
        setCart(prev => [...prev, newItem]);
        closeProductModal();
        setIsCartOpen(true);
    };

    const updateCartItemQuantity = (index, delta) => {
        const newCart = [...cart];
        const newQuantity = newCart[index].quantity + delta;
        if (newQuantity <= 0) {
            newCart.splice(index, 1);
        } else {
            const productInQuestion = products.find(p => p.id === newCart[index].product_id);
            if (productInQuestion && productInQuestion.current_stock !== null && newQuantity > productInQuestion.current_stock) {
                Swal.fire('Stok Tidak Cukup', `Maaf, stok ${productInQuestion.name} hanya tersedia ${productInQuestion.current_stock || 0} pcs.`, 'warning');
                return;
            }
            newCart[index].quantity = newQuantity;
            newCart[index].total_item_price = (newCart[index].base_price + newCart[index].selected_addons.reduce((sum, addon) => sum + parseFloat(addon.price_impact), 0)) * newQuantity;
        }
        setCart(newCart);
    };

    const removeCartItem = (indexToRemove) => {
        setCart(prev => prev.filter((_, index) => index !== indexToRemove));
    };

    const handleCheckout = async (paymentMethod) => {
        if (!customerName.trim()) { return Swal.fire('Peringatan', 'Mohon masukkan nama Anda.', 'warning'); }
        if (cart.length === 0) { return Swal.fire('Peringatan', 'Keranjang Anda kosong!', 'warning'); }

        Swal.fire({ title: 'Memproses Pesanan...', allowOutsideClick: false, didOpen: () => Swal.showLoading() });

        try {
            const orderData = {
                table_uuid: tableUuid,
                customer_name: customerName,
                cart_items: cart.map(item => ({
                    product_id: item.product_id,
                    quantity: item.quantity,
                    notes: item.notes,
                    selected_addons: item.selected_addons,
                })),
                payment_method: paymentMethod,
            };

            const response = await axios.post(`${API_URL}/api/orders`, orderData);
            const { orderUuid, xenditCheckoutUrl, message } = response.data;
            Swal.close();
            setIsCartOpen(false);

            if (paymentMethod === 'xendit' && xenditCheckoutUrl) {
                await Swal.fire({ icon: 'success', title: 'Pesanan Dibuat!', html: `<p>${message}</p><p>Anda akan diarahkan ke halaman pembayaran.</p>`, confirmButtonText: 'Lanjut Membayar'});
                window.location.href = xenditCheckoutUrl;
            } else if (paymentMethod === 'cash') {
                await Swal.fire({ icon: 'success', title: 'Pesanan Dibuat!', html: `<p>${message}</p><p>Tunjukkan Order ID ini ke kasir: <br/><strong>${orderUuid}</strong></p>`, confirmButtonText: 'Lihat Status Pesanan'});
                navigate(`/order-status/${orderUuid}`);
            }
        } catch (err) {
            Swal.fire('Error', err.response?.data?.message || 'Gagal membuat pesanan. Silakan coba lagi.', 'error');
        }
    };

    const displayedProducts = products.filter(product => {
        const matchesCategory = activeCategory === 'all' || product.category_id === activeCategory;
        const matchesSearch = product.name.toLowerCase().includes(searchTerm.toLowerCase());
        return matchesCategory && matchesSearch;
    });

    const CategorySidebar = () => (
        <aside className="hidden md:block w-64 flex-shrink-0">
            <div className="sticky top-24 p-4">
                <h2 className="text-xl font-bold text-gray-800 mb-4">Kategori</h2>
                <ul className="space-y-2">
                    <li>
                        <button onClick={() => setActiveCategory('all')} className={`w-full text-left px-4 py-2 rounded-lg font-semibold transition-colors ${activeCategory === 'all' ? 'bg-indigo-600 text-white shadow-md' : 'text-gray-600 hover:bg-indigo-100'}`}>
                            Semua Menu
                        </button>
                    </li>
                    {categories.map(cat => (
                        <li key={cat.id}>
                            <button onClick={() => setActiveCategory(cat.id)} className={`w-full text-left px-4 py-2 rounded-lg font-semibold transition-colors ${activeCategory === cat.id ? 'bg-indigo-600 text-white shadow-md' : 'text-gray-600 hover:bg-indigo-100'}`}>
                                {cat.name}
                            </button>
                        </li>
                    ))}
                </ul>
            </div>
        </aside>
    );

    const CategoryHorizontalNav = () => (
        <nav className="md:hidden sticky top-[72px] z-30 bg-white/80 backdrop-blur-md shadow-sm p-2 overflow-x-auto">
            <div className="flex space-x-3 whitespace-nowrap px-2 pb-1">
                <button onClick={() => setActiveCategory('all')} className={`px-4 py-2 rounded-full text-sm font-medium transition-all ${activeCategory === 'all' ? 'bg-indigo-600 text-white shadow-md' : 'bg-gray-200 text-gray-800'}`}>
                    Semua
                </button>
                {categories.map(cat => (
                    <button key={cat.id} onClick={() => setActiveCategory(cat.id)} className={`px-4 py-2 rounded-full text-sm font-medium transition-all ${activeCategory === cat.id ? 'bg-indigo-600 text-white shadow-md' : 'bg-gray-200 text-gray-800'}`}>
                        {cat.name}
                    </button>
                ))}
            </div>
        </nav>
    );

    const MainContent = () => {
        if (loading) return (
            <div className="text-center py-20"><div className="animate-spin rounded-full h-12 w-12 border-b-4 border-indigo-600 mx-auto"></div><p className="mt-4 text-gray-600">Memuat menu...</p></div>
        );
        if (error) return (
            <div className="text-center py-20 bg-white p-6 rounded-2xl shadow-lg border border-red-200">
                <h2 className="text-2xl font-bold text-red-600 mb-2">Terjadi Kesalahan</h2><p className="text-gray-600">{error}</p>
                <button onClick={fetchInitialData} className="mt-4 px-4 py-2 bg-indigo-600 text-white font-semibold rounded-lg shadow-md hover:bg-indigo-700 flex items-center gap-2 mx-auto"><ArrowPathIcon className="w-5 h-5"/> Coba Lagi</button>
            </div>
        );
        if (dailySessionStatus !== 'open') return (
            <div className="text-center py-20 bg-white p-6 rounded-2xl shadow-lg border border-yellow-200">
                <ClockIcon className="w-16 h-16 mx-auto text-yellow-500 mb-4" /><h2 className="text-2xl font-bold text-gray-800 mb-2">Maaf, Kami Sudah Tutup</h2><p className="text-gray-600">Saat ini kami sedang tidak menerima pesanan. Silakan coba lagi nanti.</p>
            </div>
        );
        if (displayedProducts.length === 0) return (
            <div className="text-center py-20 text-gray-600 bg-white p-6 rounded-2xl shadow-lg"><p className="text-lg">Menu tidak ditemukan.</p><p className="text-sm mt-2">Coba ganti kata kunci pencarian atau pilih kategori lain.</p></div>
        );
        return (
            <div className="grid grid-cols-2 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                {displayedProducts.map(product => <ProductCard key={product.id} product={product} onProductClick={() => openProductModal(product)} />)}
            </div>
        );
    };

    return (
        <div className="min-h-screen bg-slate-50">
            <header className="sticky top-0 z-40 bg-white/80 backdrop-blur-md shadow-md p-4 flex justify-between items-center">
                <h1 className="text-xl sm:text-2xl font-extrabold text-gray-800 whitespace-nowrap">
                    Menu <span className="text-indigo-600">(Meja {tableNumber})</span>
                </h1>
                <div className="flex items-center gap-3 w-full sm:w-auto justify-end">
                    <div className="relative w-full max-w-xs hidden sm:block">
                        <input type="text" placeholder="Cari menu..." className="w-full pl-10 pr-4 py-2 rounded-full border border-gray-300 focus:ring-2 focus:ring-indigo-400" value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} />
                        <MagnifyingGlassIcon className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                    </div>
                    <button onClick={() => setIsCartOpen(true)} className="relative bg-indigo-600 hover:bg-indigo-700 text-white font-bold py-2 px-4 rounded-full shadow-lg transition-transform hover:scale-105 flex items-center shrink-0">
                        <ShoppingCartIcon className="w-6 h-6" />
                        {cart.length > 0 && (
                            <span className="absolute -top-1 -right-1 bg-red-600 text-white text-xs font-bold rounded-full h-5 w-5 flex items-center justify-center border-2 border-white">
                                {cart.length}
                            </span>
                        )}
                    </button>
                </div>
            </header>
            
            <CategoryHorizontalNav />

            <div className="max-w-screen-2xl mx-auto flex">
                <CategorySidebar />
                <main className="flex-grow p-4 md:p-6 lg:p-8">
                    <div className="relative w-full mb-6 sm:hidden">
                        <input type="text" placeholder="Cari menu..." className="w-full pl-10 pr-4 py-2 rounded-full border border-gray-300 focus:ring-2 focus:ring-indigo-400" value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} />
                        <MagnifyingGlassIcon className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                    </div>
                    <MainContent />
                </main>
            </div>

            {showProductModal && selectedProduct && (
                <ProductDetailModal
                    product={selectedProduct}
                    onClose={closeProductModal}
                    onAddToCart={addToCart}
                />
            )}

            {isCartOpen && (
                <CartSidePanel
                    isCartOpen={isCartOpen}
                    onClose={() => setIsCartOpen(false)}
                    cart={cart}
                    updateCartItemQuantity={updateCartItemQuantity}
                    removeCartItem={removeCartItem}
                    calculateCartTotal={() => cart.reduce((total, item) => total + item.total_item_price, 0)}
                    customerName={customerName}
                    setCustomerName={setCustomerName}
                    handleCheckout={handleCheckout}
                />
            )}
        </div>
    );
}

export default OrderPage;
