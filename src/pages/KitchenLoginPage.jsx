import React, { useState } from 'react';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';
import Swal from 'sweetalert2';
import { UserCircleIcon, LockClosedIcon } from '@heroicons/react/24/solid';

function KitchenLoginPage() {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const navigate = useNavigate();

  const API_URL = import.meta.env.VITE_SERVER_URL;

  const handleSubmit = async (e) => {
    e.preventDefault();
    Swal.fire({
      title: 'Login Dapur...',
      text: 'Mohon tunggu...',
      allowOutsideClick: false,
      didOpen: () => { Swal.showLoading(); }
    });
    try {
      const response = await axios.post(`${API_URL}/api/auth/kitchen-login`, {
        username,
        password,
      });
      localStorage.setItem('token', response.data.token);
      Swal.fire('Login Berhasil!', response.data.message, 'success');
      navigate('/kitchen');
    } catch (err) {
      console.error('Login dapur failed:', err);
      Swal.fire('Login Gagal', err.response?.data?.message || 'Login gagal. Periksa kredensial Anda.', 'error');
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-red-100 to-rose-100 p-4">
      <div className="bg-white p-8 rounded-xl shadow-2xl w-full max-w-sm transform hover:scale-[1.01] transition-all duration-300">
        <h2 className="text-3xl font-extrabold text-center text-red-800 mb-6">Dapur Login</h2>
        <form onSubmit={handleSubmit}>
          <div className="mb-4">
            <label htmlFor="username" className="block text-gray-700 text-sm font-bold mb-2">
              <UserCircleIcon className="w-5 h-5 inline-block mr-1" /> Username
            </label>
            <input
              type="text"
              id="username"
              className="shadow-sm appearance-none border border-gray-300 rounded-lg w-full py-2.5 px-3 text-gray-800 leading-tight focus:outline-none focus:ring-2 focus:ring-red-400 focus:border-transparent transition duration-200"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              required
            />
          </div>
          <div className="mb-6">
            <label htmlFor="password" className="block text-gray-700 text-sm font-bold mb-2">
              <LockClosedIcon className="w-5 h-5 inline-block mr-1" /> Password
            </label>
            <input
              type="password"
              id="password"
              className="shadow-sm appearance-none border border-gray-300 rounded-lg w-full py-2.5 px-3 text-gray-800 leading-tight focus:outline-none focus:ring-2 focus:ring-red-400 focus:border-transparent transition duration-200 mb-3"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
            />
          </div>
          <div className="flex items-center justify-between">
            <button
              type="submit"
              className="bg-red-600 hover:bg-red-700 text-white font-bold py-2.5 px-4 rounded-lg focus:outline-none focus:shadow-outline w-full shadow-lg transform hover:scale-[1.01] transition duration-200"
            >
              Sign In
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

export default KitchenLoginPage;