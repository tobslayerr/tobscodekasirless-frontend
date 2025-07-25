import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';
import Swal from 'sweetalert2';
import {
  ArrowLeftIcon, PlusCircleIcon, PencilSquareIcon, TrashIcon,
  LinkIcon, MinusCircleIcon, TagIcon, AdjustmentsHorizontalIcon
} from '@heroicons/react/24/solid';

function AddonManagement() {
  const [addonOptions, setAddonOptions] = useState([]);
  const [addonValues, setAddonValues] = useState([]);
  const [products, setProducts] = useState([]);

  const [newOptionName, setNewOptionName] = useState('');
  const [newAddonValueForm, setNewAddonValueForm] = useState({
    addon_option_id: '',
    value: '',
    price_impact: 0,
  });
  const [selectedAddonValue, setSelectedAddonValue] = useState(null);

  const [selectedProductForAddons, setSelectedProductForAddons] = useState('');
  const [productAddonOptions, setProductAddonOptions] = useState([]);

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const navigate = useNavigate();
  const API_URL = import.meta.env.VITE_SERVER_URL;

  const getAuthHeader = () => {
    const token = localStorage.getItem('token');
    return {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    };
  };

  useEffect(() => {
    fetchAllAddonData();
  }, []);

  const fetchAllAddonData = async () => {
    setLoading(true);
    setError('');
    try {
      await Promise.all([
        fetchAddonOptions(),
        fetchAllAddonValues(),
        fetchProducts(),
      ]);
    } catch (err) {
      console.error('Error fetching all addon data:', err);
      setError(err.response?.data?.message || 'Failed to load addon data.');
      Swal.fire('Error', 'Failed to load addon data. Please login again.', 'error');
      if (err.response && (err.response.status === 401 || err.response.status === 403)) {
        localStorage.removeItem('token');
        navigate('/admin/login');
      }
    } finally {
      setLoading(false);
    }
  };

  const fetchAddonOptions = async () => {
    const response = await axios.get(`${API_URL}/api/addons/options`, getAuthHeader());
    setAddonOptions(response.data);
  };

  const fetchAllAddonValues = async () => {
    const response = await axios.get(`${API_URL}/api/addons/values`, getAuthHeader());
    setAddonValues(response.data);
  };

  const fetchProducts = async () => {
    const response = await axios.get(`${API_URL}/api/products`, getAuthHeader());
    setProducts(response.data);
  };

  const handleAddOption = async (e) => {
    e.preventDefault();
    if (!newOptionName.trim()) {
      Swal.fire('Warning', 'Addon option name cannot be empty.', 'warning');
      return;
    }
    Swal.fire({ title: 'Adding Option...', text: 'Please wait...', allowOutsideClick: false, didOpen: () => { Swal.showLoading(); } });
    try {
      await axios.post(`${API_URL}/api/addons/options`, { name: newOptionName }, getAuthHeader());
      Swal.fire('Success', 'Addon option added successfully!', 'success');
      setNewOptionName('');
      fetchAddonOptions();
    } catch (err) {
      console.error('Error adding addon option:', err);
      Swal.fire('Error', err.response?.data?.message || 'Failed to add addon option.', 'error');
    }
  };

  const handleAddValueChange = (e) => {
    const { name, value } = e.target;
    setNewAddonValueForm({
      ...newAddonValueForm,
      [name]: name === 'price_impact' ? parseFloat(value) : value,
    });
  };

  const handleAddValueSubmit = async (e) => {
    e.preventDefault();
    if (!newAddonValueForm.addon_option_id || !newAddonValueForm.value.trim()) {
      Swal.fire('Warning', 'Please select an option and provide a value.', 'warning');
      return;
    }
    Swal.fire({ title: selectedAddonValue ? 'Updating Value...' : 'Adding Value...', text: 'Please wait...', allowOutsideClick: false, didOpen: () => { Swal.showLoading(); } });

    try {
      if (selectedAddonValue) {
        await axios.put(`${API_URL}/api/addons/values/${selectedAddonValue.id}`, newAddonValueForm, getAuthHeader());
      } else {
        await axios.post(`${API_URL}/api/addons/values`, newAddonValueForm, getAuthHeader());
      }
      Swal.fire('Success', selectedAddonValue ? 'Addon value updated successfully!' : 'Addon value added successfully!', 'success');
      resetAddonValueForm();
      fetchAllAddonValues();
    } catch (err) {
      console.error('Error saving addon value:', err);
      Swal.fire('Error', err.response?.data?.message || 'Failed to save addon value.', 'error');
    }
  };

  const resetAddonValueForm = () => {
    setSelectedAddonValue(null);
    setNewAddonValueForm({
      addon_option_id: '', value: '', price_impact: 0,
    });
  };

  const handleEditAddonValue = (value) => {
    setSelectedAddonValue(value);
    setNewAddonValueForm({
      addon_option_id: value.addon_option_id,
      value: value.value,
      price_impact: parseFloat(value.price_impact),
    });
  };

  const handleDeleteAddonValue = async (id) => {
    Swal.fire({
      title: 'Are you sure?', text: "You won't be able to revert this!", icon: 'warning',
      showCancelButton: true, confirmButtonColor: '#3085d6', cancelButtonColor: '#d33', confirmButtonText: 'Yes, delete it!'
    }).then(async (result) => {
      if (result.isConfirmed) {
        try {
          await axios.delete(`${API_URL}/api/addons/values/${id}`, getAuthHeader());
          Swal.fire('Deleted!', 'Addon value deleted successfully!', 'success');
          fetchAllAddonValues();
        } catch (err) {
          console.error('Error deleting addon value:', err);
          Swal.fire('Error', err.response?.data?.message || 'Failed to delete addon value.', 'error');
        }
      }
    });
  };

  useEffect(() => {
    if (selectedProductForAddons) {
      fetchProductAddonOptions(selectedProductForAddons);
    } else {
      setProductAddonOptions([]);
    }
  }, [selectedProductForAddons]);

  const fetchProductAddonOptions = async (productId) => {
    try {
      const response = await axios.get(`${API_URL}/api/addons/product/${productId}`, getAuthHeader());
      setProductAddonOptions(response.data);
    } catch (err) {
      console.error('Error fetching product addon options:', err);
      Swal.fire('Error', 'Failed to fetch product addon options.', 'error');
      setProductAddonOptions([]);
    }
  };

  const handleAssignAddonToProduct = async (optionId, optionName) => {
    if (!selectedProductForAddons) {
      Swal.fire('Warning', 'Please select a product first.', 'warning');
      return;
    }
    Swal.fire({ title: 'Assigning Addon...', text: 'Please wait...', allowOutsideClick: false, didOpen: () => { Swal.showLoading(); } });
    try {
      await axios.post(`${API_URL}/api/addons/product/${selectedProductForAddons}`, { addon_option_id: optionId }, getAuthHeader());
      Swal.fire('Success', `Addon option "${optionName}" assigned to product!`, 'success');
      fetchProductAddonOptions(selectedProductForAddons);
    } catch (err) {
      console.error('Error assigning addon:', err);
      Swal.fire('Error', err.response?.data?.message || 'Failed to assign addon option.', 'error');
    }
  };

  const handleRemoveAddonFromProduct = async (optionId, optionName) => {
    if (!selectedProductForAddons) return;
    Swal.fire({
      title: 'Are you sure?', text: `Remove "${optionName}" from this product?`, icon: 'warning',
      showCancelButton: true, confirmButtonColor: '#3085d6', cancelButtonColor: '#d33', confirmButtonText: 'Yes, remove it!'
    }).then(async (result) => {
      if (result.isConfirmed) {
        try {
          await axios.delete(`${API_URL}/api/addons/product/${selectedProductForAddons}/${optionId}`, getAuthHeader());
          Swal.fire('Removed!', 'Addon option removed from product!', 'success');
          fetchProductAddonOptions(selectedProductForAddons);
        } catch (err) {
          console.error('Error removing addon:', err);
          Swal.fire('Error', err.response?.data?.message || 'Failed to remove addon option.', 'error');
        }
      }
    });
  };

  return (
    <div className="p-6 md:p-8 lg:p-10 bg-gray-50 min-h-full w-full">
      <div className="max-w-8xl mx-auto bg-white rounded-xl shadow-2xl p-6 md:p-8">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-6 pb-4 border-b border-gray-200">
          <h1 className="text-3xl sm:text-4xl font-extrabold text-gray-800 mb-4 sm:mb-0">
            Manajemen Addons
          </h1>
          <button
            onClick={() => navigate('/admin')}
            className="flex items-center px-4 py-2 bg-gray-600 text-white font-semibold rounded-lg shadow-md hover:bg-gray-700 focus:outline-none focus:ring-2 focus:ring-gray-500 focus:ring-opacity-75 transition duration-300"
          >
            <ArrowLeftIcon className="w-5 h-5 mr-2" />
            Kembali ke Dashboard
          </button>
        </div>

        {loading ? (
          <div className="text-center py-10">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-600 mx-auto mb-4"></div>
            <p className="text-gray-600">Memuat data addon...</p>
          </div>
        ) : error ? (
          <div className="text-center py-10 text-red-600">
            <p>Error: {error}</p>
          </div>
        ) : (
          <>
            <div className="mb-10 p-5 border border-purple-200 rounded-xl bg-purple-50 shadow-md">
              <h2 className="text-2xl font-bold text-purple-800 mb-6 text-center">
                Kelola Opsi Addon
              </h2>
              <form onSubmit={handleAddOption} className="flex flex-col md:flex-row gap-4 mb-6">
                <input
                  type="text"
                  placeholder="Nama Opsi Baru (Ex: Warna, Tekstur)"
                  value={newOptionName}
                  onChange={(e) => setNewOptionName(e.target.value)}
                  className="shadow-sm appearance-none border border-gray-300 rounded-lg flex-grow py-2.5 px-3 text-gray-800 leading-tight focus:outline-none focus:ring-2 focus:ring-purple-400 focus:border-transparent transition duration-200"
                  required
                />
                <button
                  type="submit"
                  className="flex-shrink-0 flex items-center justify-center px-6 py-2.5 bg-blue-600 text-white font-bold rounded-lg shadow-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-opacity-75 transition duration-300"
                >
                  <PlusCircleIcon className="w-5 h-5 mr-2" /> Tambah Opsi
                </button>
              </form>
              
              <h3 className="text-xl font-semibold text-gray-800 mb-4">Daftar Opsi Addon</h3>
              {addonOptions.length === 0 ? (
                <p className="text-gray-600 text-center py-4">Belum ada opsi addon.</p>
              ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                  {addonOptions.map(option => (
                    <div key={option.id} className="bg-white rounded-lg shadow-sm p-4 flex items-center justify-between border border-gray-200">
                      <div className="flex items-center">
                        <TagIcon className="w-5 h-5 text-purple-500 mr-2" />
                        <span className="font-medium text-gray-800">{option.name}</span>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            <div className="mb-10 p-5 border border-green-200 rounded-xl bg-green-50 shadow-md">
              <h2 className="text-2xl font-bold text-green-800 mb-6 text-center">
                {selectedAddonValue ? 'Edit Nilai Addon' : 'Tambah Nilai Addon Baru'}
              </h2>
              <form onSubmit={handleAddValueSubmit}>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
                  <div>
                    <label htmlFor="addon_option_id" className="block text-gray-700 text-sm font-bold mb-2">Pilih Opsi</label>
                    <select
                      id="addon_option_id"
                      name="addon_option_id"
                      value={newAddonValueForm.addon_option_id}
                      onChange={handleAddValueChange}
                      className="shadow-sm border border-gray-300 rounded-lg w-full py-2.5 px-3 text-gray-800 leading-tight focus:outline-none focus:ring-2 focus:ring-green-400 focus:border-transparent transition duration-200 bg-white"
                      required
                    >
                      <option value="">-- Pilih Opsi Addon --</option>
                      {addonOptions.map(option => (
                        <option key={option.id} value={option.id}>{option.name}</option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label htmlFor="value" className="block text-gray-700 text-sm font-bold mb-2">Nilai</label>
                    <input
                      type="text"
                      id="value"
                      name="value"
                      value={newAddonValueForm.value}
                      onChange={handleAddValueChange}
                      className="shadow-sm appearance-none border border-gray-300 rounded-lg w-full py-2.5 px-3 text-gray-800 leading-tight focus:outline-none focus:ring-2 focus:ring-green-400 focus:border-transparent transition duration-200"
                      placeholder="Ex: Regular, Normal, Dine-in"
                      required
                    />
                  </div>
                  <div>
                    <label htmlFor="price_impact" className="block text-gray-700 text-sm font-bold mb-2">Dampak Harga (Rp)</label>
                    <input
                      type="number"
                      id="price_impact"
                      name="price_impact"
                      value={newAddonValueForm.price_impact}
                      onChange={handleAddValueChange}
                      className="shadow-sm appearance-none border border-gray-300 rounded-lg w-full py-2.5 px-3 text-gray-800 leading-tight focus:outline-none focus:ring-2 focus:ring-green-400 focus:border-transparent transition duration-200"
                      step="0.01"
                      placeholder="0 untuk tidak ada dampak"
                    />
                  </div>
                </div>
                <div className="flex justify-end gap-4">
                  <button
                    type="submit"
                    className="flex items-center px-6 py-2.5 bg-green-600 text-white font-bold rounded-lg shadow-md hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-green-500 focus:ring-opacity-75 transition duration-300"
                  >
                    {selectedAddonValue ? 'Update Nilai' : 'Tambah Nilai'}
                  </button>
                  {selectedAddonValue && (
                    <button
                      type="button"
                      onClick={resetAddonValueForm}
                      className="flex items-center px-6 py-2.5 bg-gray-500 text-white font-bold rounded-lg shadow-md hover:bg-gray-600 focus:outline-none focus:ring-2 focus:ring-gray-400 focus:ring-opacity-75 transition duration-300"
                    >
                      Batal Edit
                    </button>
                  )}
                </div>
              </form>

              <h3 className="text-xl font-semibold text-gray-800 my-6">Daftar Nilai Addon</h3>
              {addonValues.length === 0 ? (
                <p className="text-gray-600 text-center py-4">Belum ada nilai addon.</p>
              ) : (
                <>
                  <div className="hidden lg:block overflow-x-auto rounded-lg shadow-md mb-10">
                    <table className="min-w-full bg-white border border-gray-200">
                      <thead className="bg-gray-100">
                        <tr className="text-gray-700 uppercase text-sm leading-normal">
                          <th className="py-3 px-6 text-left">Opsi</th>
                          <th className="py-3 px-6 text-left">Nilai</th>
                          <th className="py-3 px-6 text-left">Dampak Harga</th>
                          <th className="py-3 px-6 text-center">Aksi</th>
                        </tr>
                      </thead>
                      <tbody className="text-gray-700 text-sm font-light">
                        {addonValues.map(val => (
                          <tr key={val.id} className="border-b border-gray-200 hover:bg-gray-50 transition-colors duration-150">
                            <td className="py-3 px-6 text-left">{val.option_name}</td>
                            <td className="py-3 px-6 text-left">{val.value}</td>
                            <td className="py-3 px-6 text-left">Rp{parseFloat(val.price_impact).toLocaleString('id-ID')}</td>
                            <td className="py-3 px-6 text-center">
                              <div className="flex item-center justify-center space-x-2">
                                <button
                                  onClick={() => handleEditAddonValue(val)}
                                  className="p-2 rounded-full bg-yellow-500 text-white hover:bg-yellow-600 focus:outline-none focus:ring-2 focus:ring-yellow-400 transition duration-150"
                                  title="Edit Nilai"
                                >
                                  <PencilSquareIcon className="w-5 h-5" />
                                </button>
                                <button
                                  onClick={() => handleDeleteAddonValue(val.id)}
                                  className="p-2 rounded-full bg-red-500 text-white hover:bg-red-600 focus:outline-none focus:ring-2 focus:ring-red-400 transition duration-150"
                                  title="Hapus Nilai"
                                >
                                  <TrashIcon className="w-5 h-5" />
                                </button>
                              </div>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 lg:hidden gap-4">
                    {addonValues.map(val => (
                      <div key={val.id} className="bg-white rounded-xl shadow-md p-4 transition-all duration-300 hover:shadow-lg hover:scale-[1.02]">
                        <div className="flex items-center justify-between mb-3">
                          <h3 className="text-lg font-bold text-gray-800 flex items-center">
                            <AdjustmentsHorizontalIcon className="w-5 h-5 text-green-500 mr-2" />
                            {val.value}
                          </h3>
                          <span className="text-sm text-gray-600">{val.option_name}</span>
                        </div>
                        <div className="flex justify-between items-center border-t border-gray-100 pt-3">
                          <p className="text-base font-semibold text-blue-600">Rp{parseFloat(val.price_impact).toLocaleString('id-ID')}</p>
                          <div className="flex space-x-2">
                            <button
                              onClick={() => handleEditAddonValue(val)}
                              className="p-2 rounded-full bg-yellow-500 text-white hover:bg-yellow-600 focus:outline-none focus:ring-2 focus:ring-yellow-400 transition duration-150"
                              title="Edit Nilai"
                            >
                              <PencilSquareIcon className="w-5 h-5" />
                            </button>
                            <button
                              onClick={() => handleDeleteAddonValue(val.id)}
                              className="p-2 rounded-full bg-red-500 text-white hover:bg-red-600 focus:outline-none focus:ring-2 focus:ring-red-400 transition duration-150"
                              title="Hapus Nilai"
                            >
                              <TrashIcon className="w-5 h-5" />
                            </button>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </>
              )}
            </div>

            <div className="mb-10 p-5 border border-indigo-200 rounded-xl bg-indigo-50 shadow-md">
              <h2 className="text-2xl font-bold text-indigo-800 mb-6 text-center">
                Kaitkan Opsi Addon ke Produk
              </h2>
              <div className="mb-6">
                <label htmlFor="select_product" className="block text-gray-700 text-sm font-bold mb-2">Pilih Produk</label>
                <select
                  id="select_product"
                  value={selectedProductForAddons}
                  onChange={(e) => setSelectedProductForAddons(e.target.value)}
                  className="shadow-sm border border-gray-300 rounded-lg w-full py-2.5 px-3 text-gray-800 leading-tight focus:outline-none focus:ring-2 focus:ring-indigo-400 focus:border-transparent transition duration-200 bg-white"
                >
                  <option value="">-- Pilih Produk --</option>
                  {products.map(product => (
                    <option key={product.id} value={product.id}>{product.name}</option>
                  ))}
                </select>
              </div>

              {selectedProductForAddons && (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <h3 className="text-xl font-semibold text-gray-800 mb-4">Opsi Belum Terkait</h3>
                    {addonOptions.filter(option => !productAddonOptions.some(pao => pao.addon_option_id === option.id)).length === 0 ? (
                      <p className="text-gray-600 text-sm">Semua opsi addon sudah terkait atau tidak ada opsi.</p>
                    ) : (
                      <div className="space-y-3">
                        {addonOptions
                          .filter(option => !productAddonOptions.some(pao => pao.addon_option_id === option.id))
                          .map(option => (
                            <div key={option.id} className="bg-white rounded-lg shadow-sm p-3 flex items-center justify-between border border-gray-200">
                              <span className="font-medium text-gray-800">{option.name}</span>
                              <button
                                onClick={() => handleAssignAddonToProduct(option.id, option.name)}
                                className="p-2 rounded-full bg-indigo-500 text-white hover:bg-indigo-600 focus:outline-none focus:ring-2 focus:ring-indigo-400 transition duration-150"
                                title="Kaitkan Opsi"
                              >
                                <LinkIcon className="w-5 h-5" />
                              </button>
                            </div>
                          ))}
                      </div>
                    )}
                  </div>
                  <div>
                    <h3 className="text-xl font-semibold text-gray-800 mb-4">Opsi Sudah Terkait</h3>
                    {productAddonOptions.length === 0 ? (
                      <p className="text-gray-600 text-sm">Belum ada opsi addon yang terkait dengan produk ini.</p>
                    ) : (
                      <div className="space-y-3">
                        {productAddonOptions.map(pao => (
                          <div key={pao.addon_option_id} className="bg-white rounded-lg shadow-sm p-3 flex items-center justify-between border border-gray-200">
                            <span className="font-medium text-gray-800">{pao.addon_option_name}</span>
                            <button
                              onClick={() => handleRemoveAddonFromProduct(pao.addon_option_id, pao.addon_option_name)}
                              className="p-2 rounded-full bg-red-500 text-white hover:bg-red-600 focus:outline-none focus:ring-2 focus:ring-red-400 transition duration-150"
                              title="Hapus Kaitan"
                            >
                              <MinusCircleIcon className="w-5 h-5" />
                            </button>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              )}
            </div>
          </>
        )}
      </div>
    </div>
  );
}

export default AddonManagement;