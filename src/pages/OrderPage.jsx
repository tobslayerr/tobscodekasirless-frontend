import React, { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import axios from 'axios';
import Swal from 'sweetalert2';
import {
  ShoppingCartIcon, MagnifyingGlassIcon, MapPinIcon, 
  PhoneIcon, GlobeAltIcon, TagIcon
} from '@heroicons/react/24/solid';


import ProductCard from '../components/ProductCard';
import ProductDetailModal from '../components/ProductDetailModal';
import CartSidePanel from '../components/CartSidePanel';

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
  const [selectedAddons, setSelectedAddons] = useState({});
  const [productQuantity, setProductQuantity] = useState(1);
  const [productNotes, setProductNotes] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [tableNumber, setTableNumber] = useState('');
  const API_URL = import.meta.env.VITE_SERVER_URL;
  const searchInputRef = useRef(null);

  useEffect(() => {
    fetchData();
  }, [tableUuid]);

  const fetchData = async () => {
    setLoading(true);
    setError('');
    try {
      const [fetchedProducts, fetchedCategories, fetchedTableNumber] = await Promise.all([
        fetchProducts(),
        fetchCategories(),
        fetchTableNumber(),
      ]);
      setProducts(fetchedProducts);
      setCategories(fetchedCategories);
      setTableNumber(fetchedTableNumber);
    } catch (err) {
      console.error('Error fetching initial data:', err);
      setError('Gagal memuat menu. Mohon coba lagi.');
      Swal.fire({
        icon: 'error',
        title: 'Gagal Memuat Menu',
        text: 'Terjadi kesalahan saat memuat menu. Silakan periksa koneksi atau coba lagi.',
        confirmButtonText: 'OK'
      });
    } finally {
      setLoading(false);
    }
  };

  const fetchProducts = async () => {
    try {
      const response = await axios.get(`${API_URL}/api/products`);
      return response.data.filter(p => p.is_available && p.name);
    } catch (err) {
      console.error('Error fetching products:', err);
      throw err;
    }
  };

  const fetchCategories = async () => {
    try {
      const response = await axios.get(`${API_URL}/api/products/categories`);
      return response.data;
    } catch (err) {
      console.error('Error fetching categories:', err);
      throw err;
    }
  };

  const fetchTableNumber = async () => {
    try {
      const response = await axios.get(`${API_URL}/api/tables/uuid/${tableUuid}`);
      return response.data.table_number;
    } catch (err) {
      console.error('Error fetching table number:', err);
      return 'Tidak Ditemukan';
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
      console.error('Error fetching addon details for product:', err);
      return {};
    }
  };

  const openProductModal = async (product) => {
    Swal.fire({
      title: 'Memuat Opsi Produk...',
      text: 'Mohon tunggu',
      allowOutsideClick: false,
      didOpen: () => Swal.showLoading()
    });
    const addons = await fetchAddonDetails(product.id);
    Swal.close();
    setSelectedProduct({ ...product, fullAddons: addons });
    setProductQuantity(1);
    setProductNotes('');
    const defaultAddons = {};
    Object.keys(addons).forEach(optionId => {
      if (addons[optionId].values && addons[optionId].values.length > 0) {
        const defaultOptionValue = addons[optionId].values.find(v => parseFloat(v.price_impact) === 0) || addons[optionId].values[0];
        defaultAddons[optionId] = {
          id: defaultOptionValue.id,
          price_impact: parseFloat(defaultOptionValue.price_impact)
        };
      }
    });
    setSelectedAddons(defaultAddons);
    setShowProductModal(true);
  };

  const closeProductModal = () => {
    setShowProductModal(false);
    setSelectedProduct(null);
  };

  const handleAddonClick = (optionId, valueId, valuePriceImpact) => {
    setSelectedAddons(prev => ({
      ...prev,
      [optionId]: { id: valueId, price_impact: parseFloat(valuePriceImpact) }
    }));
  };

  const calculateProductTotalPrice = () => {
    if (!selectedProduct) return 0;
    let total = parseFloat(selectedProduct.price);
    Object.values(selectedAddons).forEach(addon => {
      total += parseFloat(addon.price_impact);
    });
    return total * productQuantity;
  };

  const addToCart = (quantity, notes, addons) => {
    if (!selectedProduct) return;
    const requiredAddonOptions = Object.keys(selectedProduct.fullAddons);
    const selectedAddonOptions = Object.keys(addons);
    if (requiredAddonOptions.length > selectedAddonOptions.length) {
      Swal.fire('Peringatan', 'Mohon pilih semua opsi yang tersedia untuk produk ini.', 'warning');
      return;
    }
    for (const optionId of requiredAddonOptions) {
      if (!addons[optionId]) {
        Swal.fire('Peringatan', `Mohon pilih opsi untuk ${selectedProduct.fullAddons[optionId].name}.`, 'warning');
        return;
      }
    }
    const addonsForBackend = Object.keys(addons).map(optionId => {
      const value = addons[optionId];
      const optionDetails = selectedProduct.fullAddons[optionId];
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
      product_id: selectedProduct.id,
      product_name: selectedProduct.name,
      base_price: parseFloat(selectedProduct.price),
      quantity: quantity,
      notes: notes,
      selected_addons: addonsForBackend,
      product_image: selectedProduct.image_url,
      total_item_price: (parseFloat(selectedProduct.price) + Object.values(addons).reduce((sum, addon) => sum + parseFloat(addon.price_impact), 0)) * quantity,
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
    newCart[index].quantity += delta;
    if (newCart[index].quantity <= 0) {
      newCart.splice(index, 1);
    } else {
      newCart[index].total_item_price = (newCart[index].base_price + newCart[index].selected_addons.reduce((sum, addon) => sum + parseFloat(addon.price_impact), 0)) * newCart[index].quantity;
    }
    setCart(newCart);
  };
  
  const removeCartItem = (indexToRemove) => {
    Swal.fire({
        title: 'Yakin Hapus Item Ini?',
        text: "Item akan dihapus dari keranjang.",
        icon: 'warning',
        showCancelButton: true,
        confirmButtonColor: '#d33',
        cancelButtonColor: '#3085d6',
        confirmButtonText: 'Ya, Hapus!',
        cancelButtonText: 'Batal'
    }).then((result) => {
        if (result.isConfirmed) {
            setCart(prev => prev.filter((_, index) => index !== indexToRemove));
        }
    });
  };

  const calculateCartTotal = () => {
    return cart.reduce((total, item) => total + item.total_item_price, 0);
  };

  const handleCheckout = async (paymentMethod) => {
    if (!customerName.trim()) {
      Swal.fire('Peringatan', 'Mohon masukkan nama Anda.', 'warning');
      return;
    }
    if (cart.length === 0) {
      Swal.fire('Peringatan', 'Keranjang Anda kosong!', 'warning');
      return;
    }
    Swal.fire({
      title: 'Memproses Pesanan...',
      text: 'Mohon tunggu, pesanan Anda sedang diproses.',
      allowOutsideClick: false,
      didOpen: () => { Swal.showLoading(); }
    });
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
      const { orderUuid: newOrderUuid, xenditCheckoutUrl, message } = response.data;
      Swal.close();
      setIsCartOpen(false);
      if (paymentMethod === 'xendit' && xenditCheckoutUrl) {
        Swal.fire({
          icon: 'success',
          title: 'Pesanan Dibuat!',
          html: `<p>${message}</p><p>Anda akan diarahkan ke Xendit untuk pembayaran.</p>`,
          confirmButtonText: 'Lanjut ke Pembayaran',
        }).then(() => {
          window.location.href = xenditCheckoutUrl;
        });
      } else if (paymentMethod === 'cash') {
        Swal.fire({
          icon: 'success',
          title: 'Pesanan Dibuat!',
          html: `<p>${message}</p><p>Mohon tunjukkan Order ID ini ke kasir: <br/><strong>${newOrderUuid}</strong></p>`,
          confirmButtonText: 'OK',
        }).then(() => {
          navigate(`/order-status/${newOrderUuid}`);
          setCart([]);
          setCustomerName('');
        });
      }
    } catch (err) {
      Swal.close();
      console.error('Order creation failed:', err.response?.data || err);
      Swal.fire('Error', err.response?.data?.message || 'Gagal membuat pesanan. Silakan coba lagi.', 'error');
    }
  };

  const displayedProducts = products.filter(product => {
    const matchesCategory = activeCategory === 'all' || product.category_id === activeCategory;
    const matchesSearch = product.name.toLowerCase().includes(searchTerm.toLowerCase()) || product.description?.toLowerCase().includes(searchTerm.toLowerCase());
    return matchesCategory && matchesSearch;
  });


  return (
    <div className="min-h-screen bg-orange-50 font-sans">

      <div className="text-center p-6 md:p-10 bg-white shadow-sm">
        <h1 className="text-3xl sm:text-4xl lg:text-5xl font-extrabold text-gray-800 tracking-tight">
          Selamat Datang di Cafe Kami
        </h1>
        <p className="mt-2 text-lg text-gray-600">
          Anda memesan dari <span className="font-bold text-orange-600">Meja {tableNumber}</span>
        </p>
      </div>

      <nav className="sticky top-0 z-40 bg-white/80 backdrop-blur-md shadow-md py-3 px-4">
        <div className="max-w-7xl mx-auto flex flex-col sm:flex-row items-center gap-4">
          <div className="relative w-full sm:w-auto sm:flex-grow max-w-lg">
            <input
              type="text"
              placeholder="Cari kopi atau cemilan favoritmu..."
              className="w-full pl-10 pr-4 py-2.5 rounded-full border border-gray-300 bg-gray-50 focus:ring-2 focus:ring-orange-500 focus:border-orange-500 transition-all duration-300"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              ref={searchInputRef}
            />
            <MagnifyingGlassIcon className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
          </div>
          <div className="w-full sm:w-auto overflow-x-auto pb-2">
             <div className="flex items-center space-x-3 whitespace-nowrap">
                <button
                  onClick={() => setActiveCategory('all')}
                  className={`px-5 py-2 rounded-full text-sm font-semibold transition-all duration-300 flex items-center gap-2 ${activeCategory === 'all' ? 'bg-orange-600 text-white shadow-lg' : 'bg-white text-gray-700 hover:bg-orange-100'}`}
                >
                  <TagIcon className="w-4 h-4" /> Semua
                </button>
                {categories.map(cat => (
                  <button
                    key={cat.id}
                    onClick={() => setActiveCategory(cat.id)}
                    className={`px-5 py-2 rounded-full text-sm font-semibold transition-all duration-300 ${activeCategory === cat.id ? 'bg-orange-600 text-white shadow-lg' : 'bg-white text-gray-700 hover:bg-orange-100'}`}
                  >
                    {cat.name}
                  </button>
                ))}
            </div>
          </div>
        </div>
      </nav>

      <main className="flex-grow p-4 md:p-6 lg:p-8 max-w-7xl mx-auto">
        {loading ? (
          <div className="w-full text-center py-20">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-orange-600 mx-auto mb-4"></div>
            <p className="text-gray-600 text-lg">Memuat menu...</p>
          </div>
        ) : error ? (
          <div className="w-full text-center py-20 text-red-600 bg-red-50 p-8 rounded-lg">
            <p className="font-bold text-xl">Oops! Terjadi Kesalahan</p>
            <p>{error}</p>
          </div>
        ) : displayedProducts.length === 0 ? (
          <div className="w-full text-center py-20 text-gray-600">
            <p className="text-xl font-medium">Yah, produk tidak ditemukan...</p>
            <p className="mt-2">Coba ganti kategori atau kata kunci pencarian Anda.</p>
          </div>
        ) : (
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4 sm:gap-6">
            {displayedProducts.map(product => (
              <ProductCard
                key={product.id}
                product={product}
                API_URL={API_URL}
                onProductClick={openProductModal}
              />
            ))}
          </div>
        )}
      </main>

      <button
        onClick={() => setIsCartOpen(true)}
        className="fixed bottom-6 right-6 z-50 bg-orange-600 hover:bg-orange-700 text-white font-bold h-16 w-16 rounded-full shadow-xl transform hover:scale-110 transition-all duration-300 flex items-center justify-center"
        aria-label={`Buka Keranjang (${cart.length} item)`}
      >
        <ShoppingCartIcon className="w-8 h-8" />
        {cart.length > 0 && (
          <span className="absolute -top-1 -right-1 bg-red-600 text-white text-xs font-bold rounded-full h-6 w-6 flex items-center justify-center border-2 border-white">
            {cart.length}
          </span>
        )}
      </button>

      {showProductModal && selectedProduct && (
        <ProductDetailModal
          product={selectedProduct}
          API_URL={API_URL}
          onClose={closeProductModal}
          onAddToCart={addToCart}
          productQuantity={productQuantity}
          setProductQuantity={setProductQuantity}
          productNotes={productNotes}
          setProductNotes={setProductNotes}
          selectedAddons={selectedAddons}
          handleAddonClick={handleAddonClick}
          calculateProductTotalPrice={calculateProductTotalPrice}
        />
      )}
      {isCartOpen && (
        <CartSidePanel
          isCartOpen={isCartOpen}
          onClose={() => setIsCartOpen(false)}
          cart={cart}
          API_URL={API_URL}
          updateCartItemQuantity={updateCartItemQuantity}
          removeCartItem={removeCartItem}
          calculateCartTotal={calculateCartTotal}
          customerName={customerName}
          setCustomerName={setCustomerName}
          handleCheckout={handleCheckout}
        />
      )}

      <footer className="bg-white text-gray-800 p-8 mt-12 border-t border-gray-200">
        <div className="max-w-6xl mx-auto grid grid-cols-1 md:grid-cols-3 gap-8 text-center md:text-left">
          <div>
            <h3 className="text-lg font-bold mb-3 text-orange-600">Sistem Kasir Modern</h3>
            <p className="text-sm text-gray-500">
              Pengalaman pemesanan kopi yang cepat, mudah, dan efisien. Scan QR, pilih menu, bayar, dan nikmati!
            </p>
          </div>
          <div>
            <h3 className="text-lg font-bold mb-3">Kontak Kami</h3>
            <ul className="space-y-2 text-sm text-gray-500">
              <li className="flex items-center justify-center md:justify-start">
                <MapPinIcon className="w-4 h-4 mr-2 text-orange-400" />
                South Jakarta, Jakarta, Indonesia
              </li>
              <li className="flex items-center justify-center md:justify-start">
                <PhoneIcon className="w-4 h-4 mr-2 text-orange-400" />
                (021) 1234 5678
              </li>
            </ul>
          </div>
          <div>
            <h3 className="text-lg font-bold mb-12">Jam Operasional</h3>
            <p className="text-sm text-gray-500">Setiap hari, 24 Jam</p>
            <p className="text-sm text-gray-500 mt-4">
              <GlobeAltIcon className="w-4 h-4 inline-block mr-2 text-orange-400" />
              Temukan kami di media sosial!
            </p>
          </div>
        </div>
        <div className="border-t border-gray-200 mt-8 pt-6 text-center text-sm text-gray-500">
          © 2025 TobsCode. All rights reserved.
        </div>
      </footer>
    </div>
  );
}

export default OrderPage;