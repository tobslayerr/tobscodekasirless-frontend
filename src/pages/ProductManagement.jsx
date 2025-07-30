import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';
import Swal from 'sweetalert2';
import {
    ArrowLeftIcon, PlusIcon, PencilSquareIcon, TrashIcon,
    CheckCircleIcon, XCircleIcon, TagIcon, ArchiveBoxIcon, ShoppingBagIcon, XMarkIcon, EyeIcon
} from '@heroicons/react/24/solid';

function ProductManagement() {
    const [products, setProducts] = useState([]);
    const [categories, setCategories] = useState([]);
    const [selectedProduct, setSelectedProduct] = useState(null);
    const [form, setForm] = useState({
        name: '',
        description: '',
        price: '',
        category_id: '',
        is_available: true,
        current_stock: 0,
    });
    const [productImage, setProductImage] = useState(null);
    const [previewImage, setPreviewImage] = useState(null);
    const [clearExistingImage, setClearExistingImage] = useState(false);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const [isCategoryProductModalOpen, setIsCategoryProductModalOpen] = useState(false);
    const [selectedCategory, setSelectedCategory] = useState(null);
    const [categoryProducts, setCategoryProducts] = useState([]);
    const [currentPage, setCurrentPage] = useState(1);
    const [totalPages, setTotalPages] = useState(1);
    const PRODUCTS_PER_PAGE = 10;
    const navigate = useNavigate();
    const API_URL = import.meta.env.VITE_SERVER_URL;

    const getAuthHeader = () => ({ headers: { Authorization: `Bearer ${localStorage.getItem('token')}` } });

    useEffect(() => {
        fetchProducts();
        fetchCategories();
    }, []);

    useEffect(() => {
        if (isCategoryProductModalOpen && selectedCategory) {
            fetchProductsByCategory(selectedCategory.id, currentPage);
        }
    }, [isCategoryProductModalOpen, selectedCategory, currentPage]);

    const fetchProducts = async () => {
        setLoading(true);
        setError('');
        try {
            const response = await axios.get(`${API_URL}/api/products`, {
                ...getAuthHeader(),
                params: { limit: 9999 }
            });
            setProducts(Array.isArray(response.data.products) ? response.data.products : []);
        } catch (err) {
            console.error('Error fetching products:', err);
            setError(err.response?.data?.message || 'Failed to fetch products.');
            Swal.fire('Error', 'Failed to fetch products. Please login again.', 'error');
            if (err.response && [401, 403].includes(err.response.status)) {
                localStorage.removeItem('token');
                navigate('/admin/login');
            }
            setProducts([]);
        } finally {
            setLoading(false);
        }
    };

    const fetchCategories = async () => {
        try {
            const response = await axios.get(`${API_URL}/api/products/categories`, getAuthHeader());
            setCategories(response.data);
        } catch (err) {
            console.error('Error fetching categories:', err);
            Swal.fire('Error', 'Failed to fetch categories.', 'error');
        }
    };

    const fetchProductsByCategory = async (categoryId, page) => {
        setCategoryProducts([]);
        try {
            const response = await axios.get(`${API_URL}/api/products`, {
                ...getAuthHeader(),
                params: { category_id: categoryId, page: page, limit: PRODUCTS_PER_PAGE }
            });
            setCategoryProducts(Array.isArray(response.data.products) ? response.data.products : []);
            setTotalPages(Math.ceil(response.data.total_count / PRODUCTS_PER_PAGE));
        } catch (err) {
            console.error('Error fetching products by category for modal:', err);
            Swal.fire('Error', 'Failed to fetch products for this category in modal.', 'error');
        }
    };

    const handleChange = (e) => {
        const { name, value, type, checked } = e.target;
        setForm(prevForm => ({
            ...prevForm,
            [name]: type === 'checkbox' ? checked : value,
        }));
    };

    const handleImageChange = (e) => {
        const file = e.target.files[0];
        setProductImage(file);
        if (file) {
            setPreviewImage(URL.createObjectURL(file));
            setClearExistingImage(false);
        } else {
            setPreviewImage(null);
        }
    };

    const handleClearImageToggle = (e) => {
        setClearExistingImage(e.target.checked);
        if (e.target.checked) {
            setProductImage(null);
            setPreviewImage(null);
        } else {
            if (selectedProduct && selectedProduct.image_url) {
                setPreviewImage(selectedProduct.image_url);
            }
        }
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        Swal.fire({
            title: selectedProduct ? 'Updating Product...' : 'Adding Product...',
            text: 'Please wait...',
            allowOutsideClick: false,
            didOpen: () => { Swal.showLoading(); }
        });

        const formData = new FormData();
        for (const key in form) {
            if (key === 'is_available') {
                formData.append(key, form[key] ? '1' : '0');
            } else if (key !== 'current_stock') {
                formData.append(key, form[key]);
            }
        }
        if (productImage) {
            formData.append('productImage', productImage);
        }
        if (clearExistingImage && !productImage) {
            formData.append('clear_image', 'true');
        }

        try {
            if (selectedProduct) {
                await axios.put(`${API_URL}/api/products/${selectedProduct.id}`, formData, getAuthHeader());
            } else {
                await axios.post(`${API_URL}/api/products`, formData, getAuthHeader());
            }
            Swal.fire('Success', selectedProduct ? 'Product updated successfully!' : 'Product added successfully!', 'success');
            resetFormAndSelection();
            fetchProducts();
            if (isCategoryProductModalOpen && selectedCategory) {
                fetchProductsByCategory(selectedCategory.id, currentPage);
            }
        } catch (err) {
            console.error('Error saving product:', err);
            Swal.fire('Error', err.response?.data?.message || 'Failed to save product.', 'error');
        }
    };

    const resetFormAndSelection = () => {
        setForm({
            name: '', description: '', price: '', category_id: '', is_available: true, current_stock: 0,
        });
        setProductImage(null);
        setPreviewImage(null);
        setClearExistingImage(false);
        setSelectedProduct(null);
    };

    const handleEdit = (product) => {
        setSelectedProduct(product);
        setForm({
            name: product.name,
            description: product.description || '',
            price: product.price,
            category_id: product.category_id || '',
            is_available: product.is_available === 1 ? true : false,
            current_stock: product.current_stock || 0,
        });
        setPreviewImage(product.image_url || null);
        setProductImage(null);
        setClearExistingImage(false);
        window.scrollTo({ top: 0, behavior: 'smooth' });
    };

    const handleDelete = async (id, productName) => {
        Swal.fire({
            title: `Delete ${productName}?`,
            text: "You won't be able to revert this!",
            icon: 'warning',
            showCancelButton: true,
            confirmButtonColor: '#d33',
            cancelButtonColor: '#6b7280',
            confirmButtonText: 'Yes, delete it!'
        }).then(async (result) => {
            if (result.isConfirmed) {
                try {
                    await axios.delete(`${API_URL}/api/products/${id}`, getAuthHeader());
                    Swal.fire('Deleted!', 'Product has been deleted.', 'success');
                    fetchProducts();
                    if (isCategoryProductModalOpen && selectedCategory) {
                        fetchProductsByCategory(selectedCategory.id, currentPage);
                    }
                } catch (err) {
                    console.error('Error deleting product:', err);
                    Swal.fire('Error', err.response?.data?.message || 'Failed to delete product.', 'error');
                }
            }
        });
    };

    const [isCategoryModalOpen, setIsCategoryModalOpen] = useState(false);
    const [newCategoryName, setNewCategoryName] = useState('');
    const [editingCategory, setEditingCategory] = useState(null);

    const openCategoryFormModal = (category = null) => {
        setEditingCategory(category);
        setNewCategoryName(category ? category.name : '');
        setIsCategoryModalOpen(true);
    };

    const closeCategoryFormModal = () => {
        setIsCategoryModalOpen(false);
        setEditingCategory(null);
        setNewCategoryName('');
    };

    const handleSaveCategory = async (e) => {
        e.preventDefault();
        if (!newCategoryName.trim()) {
            Swal.fire('Warning', 'Category name cannot be empty.', 'warning');
            return;
        }
        Swal.fire({ title: 'Saving Category...', allowOutsideClick: false, didOpen: () => Swal.showLoading() });
        try {
            if (editingCategory) {
                await axios.put(`${API_URL}/api/products/categories/${editingCategory.id}`, { name: newCategoryName }, getAuthHeader());
                Swal.fire('Success', 'Category updated successfully!', 'success');
            } else {
                await axios.post(`${API_URL}/api/products/categories`, { name: newCategoryName }, getAuthHeader());
                Swal.fire('Success', 'Category added successfully!', 'success');
            }
            closeCategoryFormModal();
            fetchCategories();
        } catch (err) {
            console.error('Error saving category:', err);
            Swal.fire('Error', err.response?.data?.message || 'Failed to save category.', 'error');
        }
    };

    const handleDeleteCategory = async (id, name) => {
        Swal.fire({
            title: `Delete Category: ${name}?`,
            text: "Products in this category will become unassigned. This action cannot be undone!",
            icon: 'warning',
            showCancelButton: true,
            confirmButtonColor: '#d33',
            cancelButtonColor: '#6b7280',
            confirmButtonText: 'Yes, delete it!'
        }).then(async (result) => {
            if (result.isConfirmed) {
                try {
                    await axios.delete(`${API_URL}/api/products/categories/${id}`, getAuthHeader());
                    Swal.fire('Deleted!', 'Category has been deleted.', 'success');
                    fetchCategories();
                    fetchProducts();
                } catch (err) {
                    console.error('Error deleting category:', err);
                    Swal.fire('Error', err.response?.data?.message || 'Failed to delete category.', 'error');
                }
            }
        });
    };

    const openCategoryProductModal = (category) => {
        setSelectedCategory(category);
        setCurrentPage(1);
        setIsCategoryProductModalOpen(true);
    };

    const closeCategoryProductModal = () => {
        setIsCategoryProductModalOpen(false);
        setSelectedCategory(null);
        setCategoryProducts([]);
        setCurrentPage(1);
        setTotalPages(1);
    };


    return (
        <div className="p-4 sm:p-6 lg:p-8 bg-slate-50 min-h-screen">
            <header className="max-w-7xl mx-auto mb-8">
                <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center">
                    <div>
                        <h1 className="text-3xl sm:text-4xl font-extrabold text-slate-800 tracking-tight">
                            Manajemen Produk
                        </h1>
                        <p className="mt-1 text-slate-500">Tambah, edit, dan kelola semua produk Anda di sini.</p>
                    </div>
                    <button
                        onClick={() => navigate('/admin')}
                        className="mt-4 sm:mt-0 px-4 py-2 bg-white border border-slate-300 text-slate-700 font-semibold rounded-lg shadow-sm hover:bg-slate-100 transition-all flex items-center gap-2"
                    >
                        <ArrowLeftIcon className="w-5 h-5" /> Kembali
                    </button>
                </div>
            </header>

            <main className="max-w-7xl mx-auto grid grid-cols-1 lg:grid-cols-3 gap-8">
                {/* Kolom Kiri: Form Produk */}
                <div className="lg:col-span-2">
                    <div className="bg-white p-6 sm:p-8 rounded-2xl shadow-lg border border-slate-200">
                        <h2 className="text-2xl font-bold text-blue-800 mb-1">
                            {selectedProduct ? 'Edit Produk' : 'Tambah Produk Baru'}
                        </h2>
                        <p className="text-slate-500 mb-6">{selectedProduct ? `Mengedit: ${selectedProduct.name}` : 'Isi detail produk di bawah ini.'}</p>
                        
                        <form onSubmit={handleSubmit} className="space-y-6">
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                <div>
                                    <label htmlFor="name" className="block text-sm font-bold mb-2 text-slate-700">Nama Produk</label>
                                    <input type="text" id="name" name="name" value={form.name} onChange={handleChange} className="w-full form-input rounded-lg border-slate-300 focus:ring-2 focus:ring-blue-400 focus:border-blue-500" required />
                                </div>
                                <div>
                                    <label htmlFor="price" className="block text-sm font-bold mb-2 text-slate-700">Harga (Rp)</label>
                                    <input type="number" id="price" name="price" value={form.price} onChange={handleChange} className="w-full form-input rounded-lg border-slate-300 focus:ring-2 focus:ring-blue-400 focus:border-blue-500" required step="0.01" />
                                </div>
                                <div>
                                    <label htmlFor="category_id" className="block text-sm font-bold mb-2 text-slate-700">Kategori</label>
                                    <select id="category_id" name="category_id" value={form.category_id} onChange={handleChange} className="w-full form-select rounded-lg border-slate-300 focus:ring-2 focus:ring-blue-400 focus:border-blue-500 bg-white" required>
                                        <option value="">Pilih Kategori</option>
                                        {categories.map(cat => <option key={cat.id} value={cat.id}>{cat.name}</option>)}
                                    </select>
                                </div>
                                <div>
                                     <label htmlFor="is_available" className="block text-sm font-bold mb-2 text-slate-700">Ketersediaan</label>
                                     <div className="flex items-center p-3 border border-slate-300 rounded-lg bg-slate-50">
                                        <input type="checkbox" id="is_available" name="is_available" checked={form.is_available} onChange={handleChange} className="h-5 w-5 text-blue-600 focus:ring-blue-500 border-gray-300 rounded" />
                                        <label htmlFor="is_available" className="ml-3 text-slate-800 font-medium">Tersedia untuk Pelanggan</label>
                                    </div>
                                </div>
                            </div>

                            <div>
                                <label htmlFor="description" className="block text-sm font-bold mb-2 text-slate-700">Deskripsi (Opsional)</label>
                                <textarea id="description" name="description" value={form.description} onChange={handleChange} className="w-full form-textarea rounded-lg border-slate-300 focus:ring-2 focus:ring-blue-400 focus:border-blue-500" rows="3"></textarea>
                            </div>

                            <div>
                                <label className="block text-sm font-bold text-slate-700">Gambar Produk</label>
                                <div className="mt-2 flex items-center gap-4">
                                    {previewImage ? 
                                        <img src={previewImage} alt="Preview" className="w-20 h-20 object-cover rounded-lg border border-slate-300" />
                                        : 
                                        <div className="w-20 h-20 bg-slate-100 rounded-lg flex items-center justify-center border border-dashed">
                                            <ArchiveBoxIcon className="w-8 h-8 text-slate-400"/>
                                        </div>
                                    }
                                    <div className="flex-grow">
                                        <input type="file" id="productImage" name="productImage" accept="image/png, image/jpeg, image/jpg" onChange={handleImageChange} className="block w-full text-sm text-slate-700 file:mr-3 file:py-2 file:px-4 file:rounded-lg file:border-0 file:text-sm file:font-semibold file:bg-blue-100 file:text-blue-700 hover:file:bg-blue-200 transition-colors duration-200" />
                                        <p className="text-xs text-slate-500 mt-1">PNG, JPG, JPEG. Maks 5MB.</p>
                                        {selectedProduct && selectedProduct.image_url && !productImage && (
                                            <div className="mt-2 flex items-center">
                                                <input type="checkbox" id="clearExistingImage" checked={clearExistingImage} onChange={handleClearImageToggle} className="mr-2 h-4 w-4 text-red-600 focus:ring-red-500 border-gray-300 rounded" />
                                                <label htmlFor="clearExistingImage" className="text-slate-700 text-sm font-medium">Hapus Gambar yang Ada</label>
                                            </div>
                                        )}
                                    </div>
                                </div>
                            </div>
                            
                            <div className="flex justify-end gap-4 pt-4 border-t border-slate-200">
                                {selectedProduct && (
                                    <button type="button" onClick={resetFormAndSelection} className="px-6 py-2.5 bg-slate-200 text-slate-800 font-bold rounded-lg hover:bg-slate-300 transition-all">
                                        Batal Edit
                                    </button>
                                )}
                                <button type="submit" className="px-6 py-2.5 bg-blue-600 text-white font-bold rounded-lg shadow-md hover:bg-blue-700 transition-all flex items-center gap-2">
                                    {selectedProduct ? 'Update Produk' : <><PlusIcon className="w-5 h-5" /> Tambah Produk</>}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>

                {/* Kolom Kanan: Manajemen Kategori */}
                <aside className="lg:col-span-1 space-y-8">
                    <div className="bg-white p-6 rounded-2xl shadow-lg border border-slate-200">
                        <div className="flex justify-between items-center mb-4">
                            <h3 className="text-xl font-bold text-slate-800">Kategori</h3>
                            <button onClick={() => openCategoryFormModal()} className="px-3 py-1.5 bg-indigo-600 text-white text-sm font-semibold rounded-lg shadow-sm hover:bg-indigo-700 transition-all flex items-center gap-2">
                                <PlusIcon className="w-4 h-4" /> Tambah
                            </button>
                        </div>
                        <div className="space-y-3 max-h-[60vh] overflow-y-auto pr-2">
                            {categories.length === 0 ? (
                                <p className="text-center text-slate-500 py-4">Belum ada kategori.</p>
                            ) : (
                                categories.map(cat => (
                                    <div key={cat.id} className="p-3 rounded-lg bg-slate-50 border border-slate-200">
                                        <div className="flex justify-between items-center">
                                            <p className="font-semibold text-slate-800 flex-grow">{cat.name}</p>
                                            <div className="flex gap-2 flex-shrink-0">
                                                <button onClick={() => openCategoryFormModal(cat)} className="p-2 rounded-md text-slate-500 hover:bg-yellow-100 hover:text-yellow-600 transition-colors"><PencilSquareIcon className="w-5 h-5" /></button>
                                                <button onClick={() => handleDeleteCategory(cat.id, cat.name)} className="p-2 rounded-md text-slate-500 hover:bg-red-100 hover:text-red-600 transition-colors"><TrashIcon className="w-5 h-5" /></button>
                                            </div>
                                        </div>
                                        <button onClick={() => openCategoryProductModal(cat)} className="mt-2 w-full text-center px-3 py-1.5 bg-blue-500 text-white text-sm font-semibold rounded-md shadow-sm hover:bg-blue-600 transition-all flex items-center justify-center gap-2">
                                            <EyeIcon className="w-4 h-4"/> Lihat Produk
                                        </button>
                                    </div>
                                ))
                            )}
                        </div>
                    </div>
                </aside>
            </main>

            {/* Modal Produk per Kategori */}
            {isCategoryProductModalOpen && selectedCategory && (
                <div className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4 transition-opacity duration-300" onClick={closeCategoryProductModal}>
                    <div className="bg-slate-50 rounded-2xl shadow-xl w-full max-w-3xl max-h-[90vh] flex flex-col" onClick={(e) => e.stopPropagation()}>
                        <div className="flex justify-between items-center p-5 border-b bg-white rounded-t-2xl">
                            <h2 className="text-xl font-bold text-slate-800">Produk di Kategori: {selectedCategory.name}</h2>
                            <button onClick={closeCategoryProductModal} className="p-2 rounded-full hover:bg-slate-100"><XMarkIcon className="w-6 h-6 text-slate-500" /></button>
                        </div>
                        <div className="p-5 flex-grow overflow-y-auto">
                            {categoryProducts.length === 0 ? (
                                <p className="text-center text-slate-500 py-10">Tidak ada produk dalam kategori ini.</p>
                            ) : (
                                <div className="space-y-4">
                                    {categoryProducts.map(product => (
                                        <div key={product.id} className="flex items-center justify-between gap-4 p-4 border rounded-xl bg-white shadow-sm">
                                            <div className="flex items-center gap-4 flex-grow">
                                                <div className="w-16 h-16 bg-slate-200 rounded-lg flex-shrink-0 flex items-center justify-center overflow-hidden">
                                                    {product.image_url ? <img src={product.image_url} alt={product.name} className="w-full h-full object-cover" /> : <ArchiveBoxIcon className="w-8 h-8 text-slate-400" />}
                                                </div>
                                                <div className='w-full'>
                                                    <p className="font-bold text-slate-800 text-lg">{product.name}</p>
                                                    <div className="flex items-center justify-between text-sm text-slate-500 mt-1">
                                                        <span>Stok: <span className="font-semibold text-slate-700">{product.current_stock !== null ? product.current_stock : 'N/A'}</span></span>
                                                        <span>Harga: <span className="font-semibold text-slate-700">Rp {Number(product.price).toLocaleString('id-ID')}</span></span>
                                                    </div>
                                                </div>
                                            </div>
                                            <div className="flex flex-col sm:flex-row items-center gap-2 flex-shrink-0">
                                                <button onClick={() => { handleEdit(product); closeCategoryProductModal(); }} className="w-full sm:w-auto px-3 py-1.5 bg-yellow-100 text-yellow-800 text-sm font-semibold rounded-lg hover:bg-yellow-200 transition-all flex items-center gap-2">
                                                    <PencilSquareIcon className="w-4 h-4" /> Edit
                                                </button>
                                                <button onClick={() => handleDelete(product.id, product.name)} className="w-full sm:w-auto px-3 py-1.5 bg-red-100 text-red-800 text-sm font-semibold rounded-lg hover:bg-red-200 transition-all flex items-center gap-2">
                                                    <TrashIcon className="w-4 h-4" /> Hapus
                                                </button>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </div>
                        {totalPages > 1 && (
                            <div className="p-4 border-t border-slate-200 flex justify-center items-center gap-2 bg-white rounded-b-2xl">
                                <button onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))} disabled={currentPage === 1} className="px-4 py-2 bg-white border border-slate-300 rounded-lg text-slate-700 disabled:opacity-50 hover:bg-slate-50 transition-colors">Previous</button>
                                <span className="text-sm text-slate-700 font-medium">Page {currentPage} of {totalPages}</span>
                                <button onClick={() => setCurrentPage(prev => Math.min(totalPages, prev + 1))} disabled={currentPage === totalPages} className="px-4 py-2 bg-white border border-slate-300 rounded-lg text-slate-700 disabled:opacity-50 hover:bg-slate-50 transition-colors">Next</button>
                            </div>
                        )}
                    </div>
                </div>
            )}

            {/* Modal Tambah/Edit Kategori */}
            {isCategoryModalOpen && (
                <div className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4" onClick={closeCategoryFormModal}>
                    <div className="bg-white rounded-2xl shadow-xl w-full max-w-md" onClick={(e) => e.stopPropagation()}>
                        <div className="flex justify-between items-center p-5 border-b">
                            <h2 className="text-xl font-bold text-slate-800">{editingCategory ? 'Edit Kategori' : 'Kategori Baru'}</h2>
                            <button onClick={closeCategoryFormModal} className="p-2 rounded-full hover:bg-slate-100"><XMarkIcon className="w-6 h-6 text-slate-500" /></button>
                        </div>
                        <form onSubmit={handleSaveCategory} className="p-5">
                            <label htmlFor="categoryName" className="block text-sm font-medium text-slate-700 mb-2">Nama Kategori</label>
                            <input type="text" id="categoryName" value={newCategoryName} onChange={e => setNewCategoryName(e.target.value)} className="w-full form-input rounded-lg border-slate-300 focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500" required autoFocus />
                            <div className="mt-6 flex justify-end gap-3">
                                <button type="button" onClick={closeCategoryFormModal} className="px-5 py-2 bg-slate-200 text-slate-800 font-semibold rounded-lg hover:bg-slate-300 transition-colors">Batal</button>
                                <button type="submit" className="px-5 py-2 bg-indigo-600 text-white font-semibold rounded-lg hover:bg-indigo-700 transition-colors">{editingCategory ? 'Update' : 'Simpan'}</button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
}

export default ProductManagement;
