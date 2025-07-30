import React, { useState, useEffect } from 'react';
import { XMarkIcon, MinusIcon, PlusIcon, ShoppingCartIcon } from '@heroicons/react/24/solid';
import Swal from 'sweetalert2';

function ProductDetailModal({ 
    product, 
    onClose, 
    onAddToCart, 
}) {
    const [localQuantity, setLocalQuantity] = useState(1);
    const [localNotes, setLocalNotes] = useState('');
    const [localSelectedAddons, setLocalSelectedAddons] = useState({});

    useEffect(() => {
        setLocalQuantity(1); 
        setLocalNotes('');

        const defaultAddons = {};
        if (product.fullAddons) {
            Object.keys(product.fullAddons).forEach(optionId => {
                const option = product.fullAddons[optionId];
                if (option.values && option.values.length > 0) {
                    const defaultOptionValue = option.values.find(v => parseFloat(v.price_impact) === 0) || option.values[0];
                    defaultAddons[optionId] = { 
                        id: defaultOptionValue.id, 
                        price_impact: parseFloat(defaultOptionValue.price_impact) 
                    };
                }
            });
        }
        setLocalSelectedAddons(defaultAddons);
    }, [product]);

    const handleLocalAddonClick = (optionId, valueId, valuePriceImpact) => {
        setLocalSelectedAddons(prev => ({
            ...prev,
            [optionId]: { id: valueId, price_impact: parseFloat(valuePriceImpact) }
        }));
    };

    const calculateLocalProductTotalPrice = () => {
        if (!product) return 0;
        let total = parseFloat(product.price);
        Object.values(localSelectedAddons).forEach(addon => {
            total += parseFloat(addon.price_impact);
        });
        return total * localQuantity;
    };

    const handleAddToCartLocal = () => {
        if (product.current_stock !== null && product.current_stock < localQuantity) {
            Swal.fire('Stok Tidak Cukup', `Maaf, stok ${product.name} hanya tersedia ${product.current_stock || 0} pcs.`, 'warning');
            return;
        }
        // Memanggil dengan 3 argumen, sesuai dengan versi lama
        onAddToCart(localQuantity, localNotes, localSelectedAddons);
    };

    return (
        <div className="fixed inset-0 bg-black bg-opacity-70 flex items-center justify-center p-4 z-[1000] animate-fade-in-up">
            <div className="bg-white rounded-xl shadow-2xl w-full max-w-md p-6 relative max-h-[90vh] overflow-y-auto">
                <button
                    onClick={onClose}
                    className="absolute top-4 right-4 p-2 rounded-full bg-gray-200 hover:bg-gray-300 text-gray-600 transition duration-200"
                >
                    <XMarkIcon className="w-6 h-6" />
                </button>
                <h2 className="text-2xl font-bold text-gray-800 mb-4 text-center">{product.name}</h2>
                {product.image_url ? (
                    <img src={product.image_url} alt={product.name} className="w-full h-56 object-cover mb-4 rounded-lg border border-gray-200" />
                ) : (
                    <div className="w-full h-56 bg-gray-200 flex items-center justify-center text-gray-500 mb-4 rounded-lg">No Image</div>
                )}
                
                <p className="text-gray-700 text-xl font-bold mb-2">Harga Dasar: Rp{parseFloat(product.price).toLocaleString('id-ID')}</p>
                {product.description && (
                    <p className="text-gray-600 text-sm mb-4">{product.description}</p>
                )}

                {Object.keys(product.fullAddons).length > 0 && (
                    <div className="mb-4 p-3 bg-gray-50 rounded-lg border border-gray-200">
                        <h3 className="font-semibold text-gray-800 mb-3">Pilih Opsi Tambahan:</h3>
                        {Object.values(product.fullAddons).map(option => (
                            <div key={option.name} className="mb-4 last:mb-0">
                                <p className="text-sm font-bold text-gray-700 mb-2">{option.name}:</p>
                                <div className="flex flex-wrap gap-2">
                                    {option.values.map(val => (
                                        <button
                                            key={val.id}
                                            onClick={() => handleLocalAddonClick(val.addon_option_id, val.id, val.price_impact)}
                                            className={`px-4 py-2 rounded-full text-sm font-medium border transition duration-200 ${localSelectedAddons[val.addon_option_id]?.id === val.id ? 'bg-blue-600 text-white border-blue-600 shadow-md' : 'bg-white text-gray-700 border-gray-300 hover:bg-blue-50 hover:border-blue-300'}`}
                                        >
                                            {val.value} {val.price_impact > 0 ? `(+Rp${parseFloat(val.price_impact).toLocaleString('id-ID')})` : ''}
                                        </button>
                                    ))}
                                </div>
                            </div>
                        ))}
                    </div>
                )}

                <div className="mb-6">
                    <label htmlFor="notes" className="block text-gray-700 text-sm font-bold mb-2">Catatan (Opsional):</label>
                    <textarea
                        id="notes"
                        value={localNotes}
                        onChange={(e) => setLocalNotes(e.target.value)}
                        rows="3"
                        className="w-full border border-gray-300 rounded-lg p-2 text-sm focus:ring-blue-500 focus:border-blue-500 shadow-sm transition duration-200"
                        placeholder="Misal: Kurangi es, tanpa gula, bungkus terpisah"
                    ></textarea>
                </div>

                <div className="flex items-center justify-between bg-blue-50 p-4 rounded-lg border border-blue-200 mb-6">
                    <span className="text-xl font-bold text-blue-800">Total Item: Rp{calculateLocalProductTotalPrice().toLocaleString('id-ID')}</span>
                    <div className="flex items-center">
                        <button
                            onClick={() => setLocalQuantity(prev => Math.max(1, prev - 1))}
                            className="bg-gray-200 text-gray-700 font-bold py-1.5 px-3 rounded-l-lg hover:bg-gray-300 transition duration-200"
                        >
                            <MinusIcon className="w-5 h-5" />
                        </button>
                        <span className="bg-gray-100 text-gray-800 font-bold py-1.5 px-4 text-lg">{localQuantity}</span>
                        <button
                            onClick={() => setLocalQuantity(prev => prev + 1)}
                            className="bg-gray-200 text-gray-700 font-bold py-1.5 px-3 rounded-r-lg hover:bg-gray-300 transition duration-200"
                        >
                            <PlusIcon className="w-5 h-5" />
                        </button>
                    </div>
                </div>

                <div className="flex justify-end space-x-4">
                    <button
                        onClick={handleAddToCartLocal}
                        disabled={product.current_stock !== null && product.current_stock <= 0}
                        className={`flex-grow py-3 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-lg shadow-lg transform hover:scale-[1.01] transition duration-200 flex items-center justify-center 
                                    ${product.current_stock !== null && product.current_stock <= 0 ? 'opacity-50 cursor-not-allowed' : ''}`
                                }
                    >
                        <ShoppingCartIcon className="w-6 h-6 mr-2" /> 
                        {product.current_stock !== null && product.current_stock <= 0 ? 'Stok Habis' : `Tambah - Rp${calculateLocalProductTotalPrice().toLocaleString('id-ID')}`}
                    </button>
                </div>
            </div>
        </div>
    );
}

export default ProductDetailModal;
