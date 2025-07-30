import React, { useState, useEffect, useMemo } from 'react';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';
import Swal from 'sweetalert2';
import {
    ArrowLeftIcon, PlusIcon, PencilSquareIcon, TrashIcon,
    LinkIcon, MinusCircleIcon, TagIcon, AdjustmentsHorizontalIcon, XMarkIcon,
    ShoppingBagIcon, ArchiveBoxIcon, ChevronRightIcon
} from '@heroicons/react/24/solid';

function AddonManagement() {
    const [addonOptions, setAddonOptions] = useState([]);
    const [addonValues, setAddonValues] = useState([]);
    const [categories, setCategories] = useState([]);
    const [loading, setLoading] = useState(true);
    
    // State untuk UI
    const [activeTab, setActiveTab] = useState('manage');
    
    // State untuk Tab "Manage"
    const [selectedOption, setSelectedOption] = useState(null);
    const [isOptionModalOpen, setIsOptionModalOpen] = useState(false);
    const [optionFormName, setOptionFormName] = useState('');
    const [isValueModalOpen, setIsValueModalOpen] = useState(false);
    const [valueForm, setValueForm] = useState({ value: '', price_impact: 0 });
    const [editingValue, setEditingValue] = useState(null);

    // State untuk Tab "Assign"
    const [selectedCategory, setSelectedCategory] = useState(null);
    const [productsForAssignment, setProductsForAssignment] = useState([]);
    const [selectedProduct, setSelectedProduct] = useState(null);
    const [productAddons, setProductAddons] = useState([]);
    const [assignPage, setAssignPage] = useState(1);
    const [assignTotalPages, setAssignTotalPages] = useState(1);
    const PRODUCTS_PER_PAGE = 10;
    const [isProductsLoading, setIsProductsLoading] = useState(false);


    const navigate = useNavigate();
    const API_URL = import.meta.env.VITE_SERVER_URL;

    const getAuthHeader = () => ({ headers: { Authorization: `Bearer ${localStorage.getItem('token')}` } });

    useEffect(() => {
        const fetchAllData = async () => {
            setLoading(true);
            try {
                const [optionsRes, valuesRes, categoriesRes] = await Promise.all([
                    axios.get(`${API_URL}/api/addons/options`, getAuthHeader()),
                    axios.get(`${API_URL}/api/addons/values`, getAuthHeader()),
                    axios.get(`${API_URL}/api/products/categories`, getAuthHeader()),
                ]);
                setAddonOptions(optionsRes.data);
                setAddonValues(valuesRes.data);
                setCategories(categoriesRes.data);
            } catch (err) {
                handleApiError(err, 'Failed to load initial data.');
            } finally {
                setLoading(false);
            }
        };
        fetchAllData();
    }, []);

    useEffect(() => {
        if (selectedProduct) {
            const fetchProductAddons = async () => {
                try {
                    const response = await axios.get(`${API_URL}/api/addons/product/${selectedProduct.id}`, getAuthHeader());
                    setProductAddons(response.data);
                } catch (err) {
                    handleApiError(err, 'Failed to fetch product addons.');
                }
            };
            fetchProductAddons();
        } else {
            setProductAddons([]);
        }
    }, [selectedProduct]);
    
    useEffect(() => {
        if (selectedCategory) {
            fetchProductsForAssignment(selectedCategory.id, assignPage);
        }
    }, [selectedCategory, assignPage]);
    
    const fetchProductsForAssignment = async (categoryId, page) => {
        setIsProductsLoading(true);
        setProductsForAssignment([]);
        try {
            const response = await axios.get(`${API_URL}/api/products`, {
                ...getAuthHeader(),
                params: { category_id: categoryId, page: page, limit: PRODUCTS_PER_PAGE }
            });
            setProductsForAssignment(Array.isArray(response.data.products) ? response.data.products : []);
            setAssignTotalPages(Math.ceil(response.data.total_count / PRODUCTS_PER_PAGE));
        } catch (err) {
            handleApiError(err, 'Failed to fetch products for this category.');
        } finally {
            setIsProductsLoading(false);
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
    
    const handleSaveOption = async (e) => {
        e.preventDefault();
        Swal.fire({ title: 'Saving Option...', allowOutsideClick: false, didOpen: () => Swal.showLoading() });
        try {
            await axios.post(`${API_URL}/api/addons/options`, { name: optionFormName }, getAuthHeader());
            Swal.fire('Success!', 'Addon option has been created.', 'success');
            const res = await axios.get(`${API_URL}/api/addons/options`, getAuthHeader());
            setAddonOptions(res.data);
            closeModal();
        } catch (err) { handleApiError(err, 'Failed to save option.'); }
    };
    
    const handleDeleteOption = (id, optionName) => {
        Swal.fire({
            title: `Delete Addon Option: ${optionName}?`,
            text: "This will delete all associated values and product assignments!",
            icon: 'warning',
            showCancelButton: true,
            confirmButtonColor: '#d33',
            cancelButtonColor: '#6b7280',
            confirmButtonText: 'Yes, delete it!'
        }).then(async (result) => {
            if (result.isConfirmed) {
                try {
                    await axios.delete(`${API_URL}/api/addons/options/${id}`, getAuthHeader());
                    Swal.fire('Deleted!', 'Addon option has been deleted.', 'success');
                    const resOptions = await axios.get(`${API_URL}/api/addons/options`, getAuthHeader());
                    setAddonOptions(resOptions.data);
                    if (selectedOption?.id === id) setSelectedOption(null);
                    
                    const resValues = await axios.get(`${API_URL}/api/addons/values`, getAuthHeader());
                    setAddonValues(resValues.data);

                    if (selectedProduct) {
                        const resProductAddons = await axios.get(`${API_URL}/api/addons/product/${selectedProduct.id}`, getAuthHeader());
                        setProductAddons(resProductAddons.data);
                    }
                } catch (err) {
                    handleApiError(err, 'Failed to delete addon option.');
                }
            }
        });
    };

    const handleSaveValue = async (e) => {
        e.preventDefault();
        const optionIdToUse = editingValue ? editingValue.addon_option_id : selectedOption.id;
        if (!optionIdToUse || !valueForm.value.trim()) {
            Swal.fire('Warning', 'Please select an option and provide a value.', 'warning');
            return;
        }

        const action = editingValue ? 'Updating' : 'Adding';
        const url = editingValue ? `${API_URL}/api/addons/values/${editingValue.id}` : `${API_URL}/api/addons/values`;
        const method = editingValue ? 'put' : 'post';
        const data = { ...valueForm, addon_option_id: optionIdToUse };
        
        Swal.fire({ title: `${action} Value...`, allowOutsideClick: false, didOpen: () => Swal.showLoading() });

        try {
            await axios[method](url, data, getAuthHeader());
            Swal.fire('Success!', `Addon value has been ${action.toLowerCase()}ed.`, 'success');
            closeModal();
            const res = await axios.get(`${API_URL}/api/addons/values`, getAuthHeader());
            setAddonValues(res.data);
        } catch (err) { handleApiError(err, 'Failed to save value.'); }
    };
    
    const handleDeleteValue = (id) => {
        Swal.fire({ title: 'Are you sure?', text: "You won't be able to revert this!", icon: 'warning', showCancelButton: true, confirmButtonColor: '#d33', confirmButtonText: 'Yes, delete it!' })
            .then(async (result) => {
                if (result.isConfirmed) {
                    try {
                        await axios.delete(`${API_URL}/api/addons/values/${id}`, getAuthHeader());
                        Swal.fire('Deleted!', 'Addon value has been deleted.', 'success');
                        const res = await axios.get(`${API_URL}/api/addons/values`, getAuthHeader());
                        setAddonValues(res.data);
                    } catch (err) { handleApiError(err, 'Failed to delete value.'); }
                }
            });
    };

    const handleLinkToggle = async (addonOptionId) => {
        if (!selectedProduct) return;
        
        const isLinked = productAddons.some(pa => pa.addon_option_id === addonOptionId);
        const action = isLinked ? 'Unlinking' : 'Linking';
        const url = isLinked
            ? `${API_URL}/api/addons/product/${selectedProduct.id}/${addonOptionId}`
            : `${API_URL}/api/addons/product/${selectedProduct.id}`;
        const method = isLinked ? 'delete' : 'post';
        const data = isLinked ? {} : { addon_option_id: addonOptionId };

        try {
            if (method === 'delete') {
                await axios.delete(url, getAuthHeader());
            } else {
                await axios.post(url, data, getAuthHeader());
            }
            const response = await axios.get(`${API_URL}/api/addons/product/${selectedProduct.id}`, getAuthHeader());
            setProductAddons(response.data);
            Swal.fire({
                toast: true,
                position: 'top-end',
                icon: 'success',
                title: `Successfully ${action.toLowerCase()}ed`,
                showConfirmButton: false,
                timer: 2000
            });
        } catch (err) { 
            handleApiError(err, `Failed to ${action.toLowerCase()} addon.`); 
        }
    };

    const filteredValues = useMemo(() => {
        return selectedOption ? addonValues.filter(v => v.addon_option_id === selectedOption.id) : [];
    }, [selectedOption, addonValues]);
    
    const handleSelectCategory = (category) => {
        setSelectedCategory(category);
        setSelectedProduct(null);
        setAssignPage(1);
    };

    const closeModal = () => {
        setIsOptionModalOpen(false);
        setIsValueModalOpen(false);
        setEditingValue(null);
        setValueForm({ value: '', price_impact: 0 });
        setOptionFormName('');
    };

    // Helper rendering components
    const LoadingSpinner = () => <div className="animate-spin rounded-full h-12 w-12 border-b-4 border-indigo-600"></div>;
    const Placeholder = ({ icon, title, text }) => (
        <div className="text-center flex flex-col justify-center items-center h-full p-8 text-slate-500">
            {icon}
            <h3 className="mt-4 text-lg font-semibold text-slate-700">{title}</h3>
            <p className="text-sm">{text}</p>
        </div>
    );

    if (loading) {
        return <div className="w-full h-screen flex items-center justify-center bg-slate-50"><LoadingSpinner /></div>;
    }

    return (
        <div className="p-4 sm:p-6 lg:p-8 bg-slate-50 min-h-screen">
            <header className="mb-8 flex flex-col md:flex-row justify-between md:items-center gap-4">
                <div>
                    <h1 className="text-3xl sm:text-4xl font-extrabold text-slate-800 tracking-tight">Manajemen Addon</h1>
                    <p className="text-slate-500 mt-1">Kelola opsi, nilai, dan penetapannya ke produk.</p>
                </div>
                <button
                  onClick={() => navigate('/admin')}
                  className="mt-4 sm:mt-0 px-4 py-2 bg-white border border-slate-300 text-slate-700 font-semibold rounded-lg shadow-sm hover:bg-slate-100 transition-all flex items-center gap-2"
                >
                  <ArrowLeftIcon className="w-5 h-5" /> Kembali
              </button>
            </header>

            <div className="mb-6 border-b border-slate-200">
                <nav className="-mb-px flex space-x-6" aria-label="Tabs">
                    <button onClick={() => setActiveTab('manage')} className={`py-4 px-1 border-b-2 font-medium text-base ${activeTab === 'manage' ? 'border-indigo-500 text-indigo-600' : 'border-transparent text-slate-500 hover:text-slate-700 hover:border-slate-300'}`}>
                        Kelola Opsi & Nilai
                    </button>
                    <button onClick={() => setActiveTab('assign')} className={`py-4 px-1 border-b-2 font-medium text-base ${activeTab === 'assign' ? 'border-indigo-500 text-indigo-600' : 'border-transparent text-slate-500 hover:text-slate-700 hover:border-slate-300'}`}>
                        Tetapkan ke Produk
                    </button>
                </nav>
            </div>

            {/* KONTEN TAB */}
            <div className="mt-8">
                {activeTab === 'manage' && (
                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 items-start">
                        {/* Kolom Opsi Addon */}
                        <div className="bg-white p-6 rounded-2xl shadow-lg border border-slate-200">
                            <div className="flex justify-between items-center mb-4">
                                <h2 className="text-xl font-bold text-slate-800">Opsi Addon</h2>
                                <button onClick={() => setIsOptionModalOpen(true)} className="px-3 py-1.5 bg-indigo-600 text-white text-sm font-semibold rounded-lg shadow-sm hover:bg-indigo-700 transition-all flex items-center gap-2"><PlusIcon className="w-4 h-4"/>Baru</button>
                            </div>
                            <div className="space-y-2">
                                {addonOptions.map(opt => (
                                    <div key={opt.id} onClick={() => setSelectedOption(opt)} className={`p-3 rounded-lg cursor-pointer transition-all flex justify-between items-center ${selectedOption?.id === opt.id ? 'bg-indigo-100 ring-2 ring-indigo-300' : 'bg-slate-50 hover:bg-indigo-50'}`}>
                                        <p className="font-semibold text-slate-700 flex-grow">{opt.name}</p>
                                        <button onClick={(e) => { e.stopPropagation(); handleDeleteOption(opt.id, opt.name) }} className="ml-2 p-1.5 rounded-full text-slate-400 hover:bg-red-100 hover:text-red-600"><TrashIcon className="w-5 h-5"/></button>
                                    </div>
                                ))}
                            </div>
                        </div>
                        {/* Kolom Nilai Addon */}
                        <div className="bg-white p-6 rounded-2xl shadow-lg border border-slate-200 min-h-[24rem]">
                            {!selectedOption ? (
                                <Placeholder icon={<TagIcon className="w-16 h-16 text-slate-300"/>} title="Pilih sebuah Opsi" text="Pilih opsi di sebelah kiri untuk mengelola nilainya."/>
                            ) : (
                                <>
                                    <div className="flex justify-between items-center mb-4">
                                        <h2 className="text-xl font-bold text-slate-800">Nilai untuk: <span className="text-indigo-600">{selectedOption.name}</span></h2>
                                        <button onClick={() => setIsValueModalOpen(true)} className="px-3 py-1.5 bg-indigo-600 text-white text-sm font-semibold rounded-lg shadow-sm hover:bg-indigo-700 transition-all flex items-center gap-2"><PlusIcon className="w-4 h-4"/>Baru</button>
                                    </div>
                                    <div className="space-y-2">
                                        {filteredValues.map(val => (
                                            <div key={val.id} className="p-3 rounded-lg bg-slate-50 flex justify-between items-center">
                                                <div>
                                                    <p className="font-medium text-slate-700">{val.value}</p>
                                                    <p className="text-sm text-slate-500">Dampak Harga: Rp {parseFloat(val.price_impact).toLocaleString('id-ID')}</p>
                                                </div>
                                                <div className="flex gap-1">
                                                    <button onClick={() => { setEditingValue(val); setIsValueModalOpen(true); }} className="p-1.5 rounded-md text-slate-500 hover:bg-yellow-100 hover:text-yellow-600"><PencilSquareIcon className="w-5 h-5"/></button>
                                                    <button onClick={() => handleDeleteValue(val.id)} className="p-1.5 rounded-md text-slate-500 hover:bg-red-100 hover:text-red-600"><TrashIcon className="w-5 h-5"/></button>
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                </>
                            )}
                        </div>
                    </div>
                )}
                
                {activeTab === 'assign' && (
                    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 items-start">
                        {/* Panel 1: Kategori */}
                        <div className="bg-white rounded-2xl shadow-lg border border-slate-200 lg:h-[75vh] flex flex-col">
                            <h2 className="text-lg font-bold text-slate-800 p-4 border-b">1. Pilih Kategori</h2>
                            <div className="overflow-y-auto flex-grow">
                                {categories.map(cat => (
                                    <button key={cat.id} onClick={() => handleSelectCategory(cat)} className={`w-full text-left p-4 flex justify-between items-center transition-colors ${selectedCategory?.id === cat.id ? 'bg-indigo-100 text-indigo-800 font-semibold' : 'hover:bg-slate-50'}`}>
                                        {cat.name} <ChevronRightIcon className="w-5 h-5 text-slate-400"/>
                                    </button>
                                ))}
                            </div>
                        </div>

                        {/* Panel 2: Produk */}
                        <div className="bg-white rounded-2xl shadow-lg border border-slate-200 lg:h-[75vh] flex flex-col">
                            <h2 className="text-lg font-bold text-slate-800 p-4 border-b">2. Pilih Produk</h2>
                            <div className="overflow-y-auto flex-grow">
                                {!selectedCategory ? (
                                    <Placeholder icon={<ShoppingBagIcon className="w-16 h-16 text-slate-300"/>} title="Pilih Kategori" text="Produk akan muncul di sini."/>
                                ) : isProductsLoading ? (
                                    <div className="flex justify-center items-center h-full"><LoadingSpinner /></div>
                                ) : (
                                    productsForAssignment.map(prod => (
                                        <button key={prod.id} onClick={() => setSelectedProduct(prod)} className={`w-full text-left p-4 flex items-center gap-3 transition-colors ${selectedProduct?.id === prod.id ? 'bg-indigo-100' : 'hover:bg-slate-50'}`}>
                                            <div className="w-10 h-10 bg-slate-200 rounded flex-shrink-0 flex items-center justify-center overflow-hidden">
                                                {prod.image_url ? <img src={prod.image_url} alt={prod.name} className="w-full h-full object-cover"/> : <ArchiveBoxIcon className="w-6 h-6 text-slate-400"/>}
                                            </div>
                                            <span className={`font-medium ${selectedProduct?.id === prod.id ? 'text-indigo-800' : 'text-slate-700'}`}>{prod.name}</span>
                                        </button>
                                    ))
                                )}
                            </div>
                             {assignTotalPages > 1 && (
                                <div className="p-2 border-t flex justify-center items-center gap-2">
                                    <button onClick={() => setAssignPage(p => Math.max(1, p - 1))} disabled={assignPage === 1} className="px-3 py-1 bg-white border border-slate-300 rounded text-sm disabled:opacity-50">Prev</button>
                                    <span className="text-sm">Page {assignPage} of {assignTotalPages}</span>
                                    <button onClick={() => setAssignPage(p => Math.min(assignTotalPages, p + 1))} disabled={assignPage === assignTotalPages} className="px-3 py-1 bg-white border border-slate-300 rounded text-sm disabled:opacity-50">Next</button>
                                </div>
                            )}
                        </div>

                        {/* Panel 3: Assign Addons */}
                        <div className="bg-white rounded-2xl shadow-lg border border-slate-200 lg:h-[75vh] flex flex-col">
                             <h2 className="text-lg font-bold text-slate-800 p-4 border-b">3. Tetapkan Addon</h2>
                             <div className="overflow-y-auto flex-grow p-4">
                                {!selectedProduct ? (
                                     <Placeholder icon={<AdjustmentsHorizontalIcon className="w-16 h-16 text-slate-300"/>} title="Pilih Produk" text="Opsi addon akan muncul di sini."/>
                                ) : (
                                    <div className="space-y-3">
                                        <p className="text-center font-semibold mb-3">Addon untuk: <span className="text-indigo-600">{selectedProduct.name}</span></p>
                                        {addonOptions.map(opt => {
                                            const isLinked = productAddons.some(pa => pa.addon_option_id === opt.id);
                                            return (
                                                <div key={opt.id} className="p-3 rounded-lg bg-slate-50 flex justify-between items-center">
                                                    <p className="font-medium text-slate-700">{opt.name}</p>
                                                    <button onClick={() => handleLinkToggle(opt.id)} className={`p-2 rounded-full transition-all ${isLinked ? 'bg-red-100 text-red-700 hover:bg-red-200' : 'bg-green-100 text-green-700 hover:bg-green-200'}`}>
                                                        {isLinked ? <MinusCircleIcon className="w-6 h-6"/> : <LinkIcon className="w-6 h-6"/>}
                                                    </button>
                                                </div>
                                            )
                                        })}
                                    </div>
                                )}
                             </div>
                        </div>
                    </div>
                )}
            </div>

            {/* MODALS */}
            {isOptionModalOpen && (
                <div className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4" onClick={closeModal}>
                    <div className="bg-white rounded-2xl shadow-xl w-full max-w-md" onClick={e => e.stopPropagation()}>
                        <div className="flex justify-between items-center p-5 border-b"><h2 className="text-xl font-bold text-slate-800">Opsi Addon Baru</h2><button onClick={closeModal} className="p-2 rounded-full hover:bg-slate-100"><XMarkIcon className="w-6 h-6 text-slate-500"/></button></div>
                        <form onSubmit={handleSaveOption} className="p-5">
                            <label className="block text-sm font-medium text-slate-700 mb-2">Nama Opsi</label>
                            <input type="text" placeholder="cth: Ukuran, Level Gula" value={optionFormName} onChange={e => setOptionFormName(e.target.value)} className="w-full form-input rounded-lg border-slate-300 focus:ring-indigo-500" required autoFocus/>
                            <div className="mt-6 flex justify-end gap-3">
                                <button type="button" onClick={closeModal} className="px-4 py-2 bg-slate-200 text-slate-800 font-semibold rounded-lg">Batal</button>
                                <button type="submit" className="px-4 py-2 bg-indigo-600 text-white font-semibold rounded-lg">Simpan Opsi</button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
            {isValueModalOpen && (
                <div className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4" onClick={closeModal}>
                    <div className="bg-white rounded-2xl shadow-xl w-full max-w-md" onClick={e => e.stopPropagation()}>
                        <div className="flex justify-between items-center p-5 border-b"><h2 className="text-xl font-bold text-slate-800">{editingValue ? 'Edit' : 'Buat'} Nilai Addon</h2><button onClick={closeModal} className="p-2 rounded-full hover:bg-slate-100"><XMarkIcon className="w-6 h-6 text-slate-500"/></button></div>
                        <form onSubmit={handleSaveValue} className="p-5 space-y-4">
                            <div>
                                <label className="block text-sm font-medium text-slate-700 mb-2">Nama Nilai</label>
                                <input type="text" placeholder="cth: Reguler, Besar" value={valueForm.value} onChange={e => setValueForm({...valueForm, value: e.target.value})} className="w-full form-input rounded-lg border-slate-300 focus:ring-indigo-500" required autoFocus/>
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-slate-700 mb-2">Dampak Harga (Rp)</label>
                                <input type="number" step="500" placeholder="0" value={valueForm.price_impact} onChange={e => setValueForm({...valueForm, price_impact: e.target.value})} className="w-full form-input rounded-lg border-slate-300 focus:ring-indigo-500" required/>
                            </div>
                            <div className="mt-6 flex justify-end gap-3 border-t pt-5">
                                <button type="button" onClick={closeModal} className="px-4 py-2 bg-slate-200 text-slate-800 font-semibold rounded-lg">Batal</button>
                                <button type="submit" className="px-4 py-2 bg-indigo-600 text-white font-semibold rounded-lg">{editingValue ? 'Update' : 'Simpan'} Nilai</button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
}

export default AddonManagement;
