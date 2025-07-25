import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';
import jsPDF from 'jspdf';
import 'jspdf-autotable';
import Swal from 'sweetalert2';
import {
    PlusIcon, PencilIcon, TrashIcon, QrCodeIcon, ArrowPathIcon, DocumentArrowDownIcon, XMarkIcon
} from '@heroicons/react/24/solid';

function TableManagement() {
    const [tables, setTables] = useState([]);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [editingTable, setEditingTable] = useState(null);
    const [tableNumber, setTableNumber] = useState('');
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const navigate = useNavigate();

    const API_URL = import.meta.env.VITE_SERVER_URL;
    const CLIENT_URL = import.meta.env.VITE_CLIENT_URL;

    const getAuthHeader = () => ({ headers: { Authorization: `Bearer ${localStorage.getItem('token')}` } });

    useEffect(() => {
        fetchTables();
    }, []);

    const fetchTables = async () => {
        setLoading(true);
        try {
            const response = await axios.get(`${API_URL}/api/tables`, getAuthHeader());
            setTables(response.data.sort((a, b) => a.table_number.localeCompare(b.table_number, undefined, { numeric: true })));
        } catch (err) {
            handleApiError(err, 'Failed to fetch tables.');
        } finally {
            setLoading(false);
        }
    };

    const handleApiError = (err, defaultMessage) => {
        console.error('API Error:', err);
        const message = err.response?.data?.message || defaultMessage;
        Swal.fire('Error', message, 'error');
        if (err.response && [401, 403].includes(err.response.status)) {
            localStorage.removeItem('token');
            navigate('/admin/login');
        }
    };

    const openModalForNew = () => {
        setEditingTable(null);
        setTableNumber('');
        setIsModalOpen(true);
    };

    const openModalForEdit = (table) => {
        setEditingTable(table);
        setTableNumber(table.table_number);
        setIsModalOpen(true);
    };

    const closeModal = () => {
        setIsModalOpen(false);
        setEditingTable(null);
        setTableNumber('');
    };

    const handleFormSubmit = async (e) => {
        e.preventDefault();
        if (!tableNumber.trim()) {
            Swal.fire('Warning', 'Table number cannot be empty.', 'warning');
            return;
        }

        const action = editingTable ? 'Updating' : 'Adding';
        const url = editingTable ? `${API_URL}/api/tables/${editingTable.id}` : `${API_URL}/api/tables`;
        const method = editingTable ? 'put' : 'post';

        Swal.fire({ title: `${action} Table...`, allowOutsideClick: false, didOpen: () => Swal.showLoading() });

        try {
            await axios[method](url, { table_number: tableNumber }, getAuthHeader());
            Swal.fire('Success', `Table ${action.toLowerCase()} successfully!`, 'success');
            closeModal();
            fetchTables();
        } catch (err) {
            handleApiError(err, `Failed to ${action.toLowerCase()} table.`);
        }
    };

    const handleDeleteTable = (id, number) => {
        Swal.fire({
            title: `Delete Table ${number}?`,
            text: "This action cannot be undone.",
            icon: 'warning',
            showCancelButton: true,
            confirmButtonColor: '#d33',
            cancelButtonColor: '#6b7280',
            confirmButtonText: 'Yes, delete it!'
        }).then(async (result) => {
            if (result.isConfirmed) {
                try {
                    await axios.delete(`${API_URL}/api/tables/${id}`, getAuthHeader());
                    Swal.fire('Deleted!', 'Table has been deleted.', 'success');
                    fetchTables();
                } catch (err) {
                    handleApiError(err, 'Failed to delete table.');
                }
            }
        });
    };
    
    const handleRegenerateQr = async (id) => {
        Swal.fire({ title: 'Regenerating QR...', allowOutsideClick: false, didOpen: () => Swal.showLoading() });
        try {
            await axios.post(`${API_URL}/api/tables/${id}/regenerate-qr`, {}, getAuthHeader());
            Swal.fire('Success', 'QR Code regenerated successfully!', 'success');
            fetchTables();
        } catch (err) {
            handleApiError(err, 'Failed to regenerate QR code.');
        }
    };

    const downloadQrCode = (qrDataFromDb, filename) => {
        const finalUrl = qrDataFromDb; 

        fetch(finalUrl)
            .then(response => {
                if (!response.ok) {
                    throw new Error(`HTTP error! Status: ${response.status} for URL: ${finalUrl}`);
                }
                return response.blob();
            })
            .then(blob => new Promise((resolve) => {
                const reader = new FileReader();
                reader.onloadend = () => {
                    const blobUrl = window.URL.createObjectURL(blob);
                    const link = document.createElement('a');
                    link.href = blobUrl;
                    link.download = filename;
                    document.body.appendChild(link);
                    link.click();
                    document.body.removeChild(link);
                    window.URL.revokeObjectURL(blobUrl);
                    resolve(); // Resolve the promise once download is triggered
                };
                reader.readAsDataURL(blob); // Read as Data URL to ensure cross-origin compatibility
            }))
            .catch(error => {
                console.error('Error fetching QR for download:', error);
                Swal.fire('Error', `Gagal mengunduh QR Code: ${error.message}. Coba regenerate QR code meja ini.`, 'error');
            });
    };

    const generateAllQrPdf = async () => {
        if (tables.length === 0) return;
        Swal.fire({ title: 'Generating PDF...', text: 'Fetching all QR codes, this may take a moment.', allowOutsideClick: false, didOpen: () => Swal.showLoading() });

        const imagePromises = tables.map(table => {
            if (table.qr_code_url) {
                return fetch(table.qr_code_url)
                    .then(res => res.blob())
                    .then(blob => new Promise((resolve) => {
                        const reader = new FileReader();
                        reader.onloadend = () => resolve({ tableNumber: table.table_number, qrData: reader.result });
                        reader.readAsDataURL(blob);
                    }))
                    .catch(err => {
                        console.error(`Failed to load QR for Table ${table.table_number}:`, err);
                        return { tableNumber: table.table_number, qrData: null };
                    });
            }
            return Promise.resolve(null);
        });

        const results = await Promise.all(imagePromises);
        const doc = new jsPDF();
        
        doc.setFont('helvetica', 'bold');
        doc.setFontSize(20);
        doc.text('All Table QR Codes', doc.internal.pageSize.getWidth() / 2, 20, { align: 'center' });

        const qrSize = 80;
        const pageMargin = 15;
        const cols = 2;
        const cardWidth = (doc.internal.pageSize.getWidth() - pageMargin * (cols + 1)) / cols;
        const cardHeight = qrSize + 20;

        let x = pageMargin;
        let y = 30;

        results.forEach((res, index) => {
            if (y + cardHeight + pageMargin > doc.internal.pageSize.getHeight()) {
                doc.addPage();
                y = pageMargin;
                x = pageMargin;
            }
            
            doc.setDrawColor(200);
            doc.roundedRect(x, y, cardWidth, cardHeight, 5, 5, 'S');
            
            doc.setFontSize(14);
            doc.setFont('helvetica', 'bold');
            doc.text(`Table ${res.tableNumber}`, x + cardWidth / 2, y + 12, { align: 'center' });
            
            if (res.qrData) {
                doc.addImage(res.qrData, 'PNG', x + (cardWidth - qrSize) / 2, y + 15, qrSize, qrSize);
            } else {
                doc.setFontSize(10);
                doc.setFont('helvetica', 'normal');
                doc.text('Error loading QR', x + cardWidth / 2, y + cardHeight / 2, { align: 'center' });
            }

            if ((index + 1) % cols === 0) {
                x = pageMargin;
                y += cardHeight + pageMargin;
            } else {
                x += cardWidth + pageMargin;
            }
        });

        doc.save('All_Table_QR_Codes.pdf');
        Swal.close();
    };

    if (loading) {
        return (
            <div className="w-full h-full min-h-screen flex items-center justify-center bg-slate-50">
                <div className="animate-spin rounded-full h-16 w-16 border-b-4 border-indigo-600"></div>
            </div>
        );
    }

    return (
        <div className="p-4 sm:p-6 lg:p-8 bg-slate-50 min-h-full">
            <header className="mb-8 flex flex-col md:flex-row justify-between md:items-center gap-4">
                <div>
                    <h1 className="text-4xl font-extrabold text-slate-900">Table Management</h1>
                    <p className="text-slate-500 mt-1">Add, edit, and manage all your tables and their QR codes.</p>
                </div>
                <div className="flex items-center gap-3">
                    <button onClick={generateAllQrPdf} disabled={tables.length === 0} className="px-4 py-2 bg-white border border-slate-300 text-slate-700 font-semibold rounded-lg shadow-sm hover:bg-slate-100 transition-all flex items-center gap-2 disabled:opacity-50">
                        <DocumentArrowDownIcon className="w-5 h-5" /> Download All QR
                    </button>
                    <button onClick={openModalForNew} className="px-4 py-2 bg-indigo-600 text-white font-semibold rounded-lg shadow-md hover:bg-indigo-700 transition-all flex items-center gap-2">
                        <PlusIcon className="w-5 h-5" /> Add New Table
                    </button>
                </div>
            </header>

            {tables.length === 0 ? (
                <div className="text-center py-20 bg-white rounded-2xl shadow-md border border-slate-200">
                    <QrCodeIcon className="w-16 h-16 mx-auto text-slate-300" />
                    <h3 className="mt-4 text-xl font-semibold text-slate-700">No Tables Found</h3>
                    <p className="mt-1 text-slate-500">Start by adding your first table.</p>
                </div>
            ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
                    {tables.map(table => (
                        <div key={table.id} className="bg-white rounded-2xl shadow-md border border-slate-200 p-5 flex flex-col text-center">
                            <h3 className="text-2xl font-bold text-slate-800">Table {table.table_number}</h3>
                            <p className="text-xs text-slate-400 font-mono mb-4">{table.uuid}</p>
                            <div className="w-40 h-40 mx-auto bg-slate-100 rounded-lg flex items-center justify-center p-2">
                                {table.qr_code_url ?
                                    <img src={table.qr_code_url} alt={`QR for Table ${table.table_number}`} className="w-full h-full object-contain" />
                                    : <p className="text-xs text-slate-500">QR not generated</p>
                                }
                            </div>
                            <div className="mt-auto pt-5 flex justify-center items-center gap-2">
                                <button onClick={() => openModalForEdit(table)} title="Edit" className="h-10 w-10 flex items-center justify-center rounded-full bg-slate-100 text-slate-600 hover:bg-yellow-100 hover:text-yellow-700 transition-all"><PencilIcon className="w-5 h-5" /></button>
                                <button onClick={() => downloadQrCode(table.qr_code_url, `QR_Table_${table.table_number}.png`)} title="Download QR" className="h-10 w-10 flex items-center justify-center rounded-full bg-slate-100 text-slate-600 hover:bg-blue-100 hover:text-blue-700 transition-all"><DocumentArrowDownIcon className="w-5 h-5" /></button>
                                <button onClick={() => handleRegenerateQr(table.id)} title="Regenerate QR" className="h-10 w-10 flex items-center justify-center rounded-full bg-slate-100 text-slate-600 hover:bg-green-100 hover:text-green-700 transition-all"><ArrowPathIcon className="w-5 h-5" /></button>
                                <button onClick={() => handleDeleteTable(table.id, table.table_number)} title="Delete" className="h-10 w-10 flex items-center justify-center rounded-full bg-slate-100 text-slate-600 hover:bg-red-100 hover:text-red-700 transition-all"><TrashIcon className="w-5 h-5" /></button>
                            </div>
                        </div>
                    ))}
                </div>
            )}
            
            {isModalOpen && (
                <div className="fixed inset-0 bg-black bg-opacity-60 z-50 flex items-center justify-center p-4">
                    <div className="bg-white rounded-2xl shadow-xl w-full max-w-md" onClick={(e) => e.stopPropagation()}>
                        <div className="flex justify-between items-center p-5 border-b border-slate-200">
                            <h2 className="text-xl font-bold text-slate-800">{editingTable ? `Edit Table ${editingTable.table_number}` : 'Add New Table'}</h2>
                            <button onClick={closeModal} className="p-1 rounded-full hover:bg-slate-100"><XMarkIcon className="w-6 h-6 text-slate-500"/></button>
                        </div>
                        <form onSubmit={handleFormSubmit} className="p-5">
                            <label htmlFor="tableNumber" className="block text-sm font-medium text-slate-700 mb-2">Table Number</label>
                            <input
                                id="tableNumber"
                                type="text"
                                placeholder="e.g., 1A, 2, VIP 3"
                                value={tableNumber}
                                onChange={(e) => setTableNumber(e.target.value)}
                                className="w-full form-input rounded-lg border-slate-300 focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                                required
                                autoFocus
                            />
                            <div className="mt-6 flex justify-end gap-3">
                                <button type="button" onClick={closeModal} className="px-4 py-2 bg-white border border-slate-300 text-slate-700 font-semibold rounded-lg shadow-sm hover:bg-slate-50 transition-all">Cancel</button>
                                <button type="submit" className="px-4 py-2 bg-indigo-600 text-white font-semibold rounded-lg shadow-md hover:bg-indigo-700 transition-all">{editingTable ? 'Update Table' : 'Add Table'}</button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
}

export default TableManagement;