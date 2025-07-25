import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';
import Swal from 'sweetalert2';
import {
  PencilSquareIcon, TrashIcon, ArrowLeftIcon, CheckCircleIcon,
  XCircleIcon, PlusCircleIcon
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
  });
  const [productImage, setProductImage] = useState(null);
  const [previewImage, setPreviewImage] = useState(null);
  const [clearExistingImage, setClearExistingImage] = useState(false);
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
    fetchProducts();
    fetchCategories();
  }, []);

  const fetchProducts = async () => {
    setLoading(true);
    setError('');
    try {
      const response = await axios.get(`${API_URL}/api/products`, getAuthHeader());
      setProducts(response.data);
    } catch (err) {
      console.error('Error fetching products:', err);
      setError(err.response?.data?.message || 'Failed to fetch products.');
      Swal.fire('Error', 'Failed to fetch products. Please login again.', 'error');
      if (err.response && (err.response.status === 401 || err.response.status === 403)) {
        localStorage.removeItem('token');
        navigate('/admin/login');
      }
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
      } else {
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
    } catch (err) {
      console.error('Error saving product:', err);
      Swal.fire('Error', err.response?.data?.message || 'Failed to save product.', 'error');
    }
  };

  const resetFormAndSelection = () => {
    setForm({
      name: '', description: '', price: '', category_id: '', is_available: true,
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
    });
    if (product.image_url) {
        setPreviewImage(product.image_url); 
    } else {
        setPreviewImage(null);
    }
    setProductImage(null);
    setClearExistingImage(false);
  };

  const handleDelete = async (id) => {
    Swal.fire({
      title: 'Are you sure?',
      text: "You won't be able to revert this!",
      icon: 'warning',
      showCancelButton: true,
      confirmButtonColor: '#3085d6',
      cancelButtonColor: '#d33',
      confirmButtonText: 'Yes, delete it!'
    }).then(async (result) => {
      if (result.isConfirmed) {
        try {
          await axios.delete(`${API_URL}/api/products/${id}`, getAuthHeader());
          Swal.fire('Deleted!', 'Product has been deleted.', 'success');
          fetchProducts();
        } catch (err) {
          console.error('Error deleting product:', err);
          Swal.fire('Error', err.response?.data?.message || 'Failed to delete product.', 'error');
        }
      }
    });
  };

  return (
    <div className="p-6 md:p-8 lg:p-10 bg-gray-50 min-h-full w-full">
      <div className="max-w-8xl mx-auto bg-white rounded-xl shadow-2xl p-6 md:p-8 lg:ml-3">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-6 pb-4 border-b border-gray-200">
          <h1 className="text-3xl sm:text-4xl font-extrabold text-gray-800 mb-4 sm:mb-0">
            Manajemen Produk
          </h1>
          <button
            onClick={() => navigate('/admin')}
            className="flex items-center px-4 py-2 bg-gray-600 text-white font-semibold rounded-lg shadow-md hover:bg-gray-700 focus:outline-none focus:ring-2 focus:ring-gray-500 focus:ring-opacity-75 transition duration-300"
          >
            <ArrowLeftIcon className="w-5 h-5 mr-2" />
            Kembali ke Dashboard
          </button>
        </div>

        <div className="mb-10 p-5 border border-blue-200 rounded-xl bg-blue-50 shadow-md">
          <h2 className="text-2xl font-bold text-blue-800 mb-6 text-center">
            {selectedProduct ? 'Edit Produk' : 'Tambah Produk Baru'}
          </h2>
          <form onSubmit={handleSubmit}>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
              <div>
                <label htmlFor="name" className="block text-gray-700 text-sm font-bold mb-2">Nama Produk</label>
                <input
                  type="text"
                  id="name"
                  name="name"
                  value={form.name}
                  onChange={handleChange}
                  className="shadow-sm appearance-none border border-gray-300 rounded-lg w-full py-2.5 px-3 text-gray-800 leading-tight focus:outline-none focus:ring-2 focus:ring-blue-400 focus:border-transparent transition duration-200"
                  required
                />
              </div>
              <div>
                <label htmlFor="price" className="block text-gray-700 text-sm font-bold mb-2">Harga Dasar (Rp)</label>
                <input
                  type="number"
                  id="price"
                  name="price"
                  value={form.price}
                  onChange={handleChange}
                  className="shadow-sm appearance-none border border-gray-300 rounded-lg w-full py-2.5 px-3 text-gray-800 leading-tight focus:outline-none focus:ring-2 focus:ring-blue-400 focus:border-transparent transition duration-200"
                  required
                  step="0.01"
                />
              </div>
              <div>
                <label htmlFor="category_id" className="block text-gray-700 text-sm font-bold mb-2">Kategori</label>
                <select
                  id="category_id"
                  name="category_id"
                  value={form.category_id}
                  onChange={handleChange}
                  className="shadow-sm border border-gray-300 rounded-lg w-full py-2.5 px-3 text-gray-800 leading-tight focus:outline-none focus:ring-2 focus:ring-blue-400 focus:border-transparent transition duration-200 bg-white"
                  required
                >
                  <option value="">Pilih Kategori</option>
                  {categories.map(cat => (
                    <option key={cat.id} value={cat.id}>{cat.name}</option>
                  ))}
                </select>
              </div>
              <div>
                <label htmlFor="productImage" className="block text-gray-700 text-sm font-bold mb-2">Gambar Produk (PNG/JPG/JPEG, maks 5MB)</label>
                <input
                  type="file"
                  id="productImage"
                  name="productImage"
                  accept="image/png, image/jpeg, image/jpg"
                  onChange={handleImageChange}
                  className="block w-full text-sm text-gray-700
                    file:mr-3 file:py-2 file:px-4
                    file:rounded-lg file:border-0
                    file:text-sm file:font-semibold
                    file:bg-blue-500 file:text-white
                    hover:file:bg-blue-600 transition-colors duration-200"
                />
                {previewImage && (
                    <div className="mt-3">
                        <p className="text-sm text-gray-600 mb-1">Preview:</p>
                        <img src={previewImage} alt="Preview" className="w-24 h-24 object-cover rounded-lg border border-gray-300 shadow-sm" />
                    </div>
                )}
                {selectedProduct && selectedProduct.image_url && !productImage && (
                    <div className="mt-3 flex items-center">
                        <input
                            type="checkbox"
                            id="clearExistingImage"
                            checked={clearExistingImage}
                            onChange={handleClearImageToggle}
                            className="mr-2 h-4 w-4 text-red-600 focus:ring-red-500 border-gray-300 rounded"
                        />
                        <label htmlFor="clearExistingImage" className="text-gray-700 text-sm font-bold">Hapus Gambar yang Ada</label>
                    </div>
                )}
              </div>
            </div>
            <div className="mb-6">
              <label htmlFor="description" className="block text-gray-700 text-sm font-bold mb-2">Deskripsi (Opsional)</label>
              <textarea
                id="description"
                name="description"
                value={form.description}
                onChange={handleChange}
                className="shadow-sm appearance-none border border-gray-300 rounded-lg w-full py-2.5 px-3 text-gray-800 leading-tight focus:outline-none focus:ring-2 focus:ring-blue-400 focus:border-transparent transition duration-200"
                rows="3"
                placeholder="Tambahkan deskripsi produk..."
              ></textarea>
            </div>
            <div className="mb-8 flex items-center justify-start">
              <input
                type="checkbox"
                id="is_available"
                name="is_available"
                checked={form.is_available}
                onChange={handleChange}
                className="mr-2 h-5 w-5 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
              />
              <label htmlFor="is_available" className="text-gray-800 font-bold text-base">Tersedia untuk Pelanggan?</label>
            </div>
            <div className="flex justify-end gap-4">
              <button
                type="submit"
                className="flex items-center px-6 py-2.5 bg-blue-600 text-white font-bold rounded-lg shadow-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-opacity-75 transition duration-300"
              >
                {selectedProduct ? 'Update Produk' : 'Tambah Produk'}
              </button>
              {selectedProduct && (
                <button
                  type="button"
                  onClick={resetFormAndSelection}
                  className="flex items-center px-6 py-2.5 bg-gray-500 text-white font-bold rounded-lg shadow-md hover:bg-gray-600 focus:outline-none focus:ring-2 focus:ring-gray-400 focus:ring-opacity-75 transition duration-300"
                >
                  Batal Edit
                </button>
              )}
            </div>
          </form>
        </div>

        {loading ? (
          <div className="text-center py-10">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
            <p className="text-gray-600">Memuat produk...</p>
          </div>
        ) : error ? (
          <div className="text-center py-10 text-red-600">
            <p>Error: {error}</p>
          </div>
        ) : products.length === 0 ? (
          <div className="text-center py-10 text-gray-600">
            <p>Belum ada produk. Tambahkan produk pertama Anda!</p>
          </div>
        ) : (
          <>
            <h2 className="text-2xl font-bold text-gray-800 mb-6 text-center">Daftar Produk</h2>
            <div className="hidden lg:block overflow-x-auto rounded-lg shadow-md mb-10">
              <table className="min-w-full bg-white border border-gray-200">
                <thead className="bg-gray-100">
                  <tr className="text-gray-700 uppercase text-sm leading-normal">
                    <th className="py-3 px-6 text-left">Gambar</th>
                    <th className="py-3 px-6 text-left">Nama</th>
                    <th className="py-3 px-6 text-left">Kategori</th>
                    <th className="py-3 px-6 text-left">Harga</th>
                    <th className="py-3 px-6 text-left">Tersedia</th>
                    <th className="py-3 px-6 text-center">Aksi</th>
                  </tr>
                </thead>
                <tbody className="text-gray-700 text-sm font-light">
                  {products.map((product) => (
                    <tr key={product.id} className="border-b border-gray-200 hover:bg-gray-50 transition-colors duration-150">
                      <td className="py-3 px-6 text-left">
                        {product.image_url ? (
                          <img src={product.image_url} alt={product.name} className="w-16 h-16 object-cover rounded-md border border-gray-200" />
                        ) : (
                          <span className="text-gray-400 text-sm">No Image</span>
                        )}
                      </td>
                      <td className="py-3 px-6 text-left whitespace-nowrap">{product.name}</td>
                      <td className="py-3 px-6 text-left">{product.category_name}</td>
                      <td className="py-3 px-6 text-left">Rp{parseFloat(product.price).toLocaleString('id-ID')}</td>
                      <td className="py-3 px-6 text-left">
                        {product.is_available ? (
                          <CheckCircleIcon className="w-6 h-6 text-green-500 inline-block mr-1" />
                        ) : (
                          <XCircleIcon className="w-6 h-6 text-red-500 inline-block mr-1" />
                        )}
                      </td>
                      <td className="py-3 px-6 text-center">
                        <div className="flex item-center justify-center space-x-2">
                          <button
                            onClick={() => handleEdit(product)}
                            className="p-2 rounded-full bg-yellow-500 text-white hover:bg-yellow-600 focus:outline-none focus:ring-2 focus:ring-yellow-400 transition duration-150"
                            title="Edit Produk"
                          >
                            <PencilSquareIcon className="w-5 h-5" />
                          </button>
                          <button
                            onClick={() => handleDelete(product.id)}
                            className="p-2 rounded-full bg-red-500 text-white hover:bg-red-600 focus:outline-none focus:ring-2 focus:ring-red-400 transition duration-150"
                            title="Hapus Produk"
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

            <div className="grid grid-cols-1 md:grid-cols-2 lg:hidden gap-6 mb-10">
              {products.map((product) => (
                <div key={product.id} className="bg-white rounded-xl shadow-md p-4 transition-all duration-300 hover:shadow-lg hover:scale-[1.02]">
                  <div className="flex items-center space-x-4 mb-4">
                    {product.image_url ? (
                      <img src={product.image_url} alt={product.name} className="w-20 h-20 object-cover rounded-lg border border-gray-200" />
                    ) : (
                      <div className="w-20 h-20 bg-gray-200 rounded-lg flex items-center justify-center text-gray-500 text-xs">No Image</div>
                    )}
                    <div className="flex-1">
                      <h3 className="text-lg font-bold text-gray-800">{product.name}</h3>
                      <p className="text-sm text-gray-600">Kategori: {product.category_name}</p>
                      <p className="text-base font-semibold text-blue-600">Rp{parseFloat(product.price).toLocaleString('id-ID')}</p>
                    </div>
                  </div>
                  <div className="flex justify-between items-center border-t border-gray-100 pt-4">
                    <div className="flex items-center text-sm font-medium">
                      {product.is_available ? (
                        <span className="text-green-600 flex items-center">
                          <CheckCircleIcon className="w-5 h-5 mr-1" /> Tersedia
                        </span>
                      ) : (
                        <span className="text-red-600 flex items-center">
                          <XCircleIcon className="w-5 h-5 mr-1" /> Tidak Tersedia
                        </span>
                      )}
                    </div>
                    <div className="flex space-x-2">
                      <button
                        onClick={() => handleEdit(product)}
                        className="p-2 rounded-full bg-yellow-500 text-white hover:bg-yellow-600 focus:outline-none focus:ring-2 focus:ring-yellow-400 transition duration-150"
                        title="Edit Produk"
                      >
                        <PencilSquareIcon className="w-5 h-5" />
                      </button>
                      <button
                        onClick={() => handleDelete(product.id)}
                        className="p-2 rounded-full bg-red-500 text-white hover:bg-red-600 focus:outline-none focus:ring-2 focus:ring-red-400 transition duration-150"
                        title="Hapus Produk"
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
    </div>
  );
}

export default ProductManagement;