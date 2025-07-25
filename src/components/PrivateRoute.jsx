import React from 'react';
import { Navigate } from 'react-router-dom';
import Swal from 'sweetalert2';

const PrivateRouteByRole = ({ children, allowedRoles }) => {
  const token = localStorage.getItem('token');

  if (!token) {
    if (allowedRoles.includes('admin')) return <Navigate to="/admin/login" replace />;
    if (allowedRoles.includes('cashier')) return <Navigate to="/cashier/login" replace />;
    if (allowedRoles.includes('kitchen')) return <Navigate to="/kitchen/login" replace />;
    return <Navigate to="/" replace />; 
  }

  try {
    const decodedToken = JSON.parse(atob(token.split('.')[1])); 
    if (!allowedRoles.includes(decodedToken.role)) {
      Swal.fire('Akses Ditolak', 'Anda tidak memiliki izin untuk mengakses halaman ini.', 'error');
      if (decodedToken.role === 'admin') return <Navigate to="/admin" replace />;
      if (decodedToken.role === 'cashier') return <Navigate to="/cashier" replace />;
      if (decodedToken.role === 'kitchen') return <Navigate to="/kitchen" replace />;
      return <Navigate to="/" replace />;
    }
    return children;
  } catch (error) {
    console.error("Invalid token format:", error);
    localStorage.removeItem('token');
    return <Navigate to="/admin/login" replace />;
  }
};

export default PrivateRouteByRole;