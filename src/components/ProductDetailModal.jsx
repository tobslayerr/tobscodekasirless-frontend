import React, { useState, useEffect } from 'react';
import { XMarkIcon, MinusIcon, PlusIcon, ShoppingCartIcon } from '@heroicons/react/24/solid';

function ProductDetailModal({
  product,
  onClose,
  onAddToCart,
}) {
  const [localQuantity, setLocalQuantity] = useState(1);
  const [localNotes, setLocalNotes] = useState('');
  const [localSelectedAddons, setLocalSelectedAddons] = useState({});

  useEffect(() => {
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
    setLocalQuantity(1);
    setLocalNotes('');
  }, [product]);

  const calculateLocalProductTotalPrice = () => {
    if (!product) return 0;
    let total = parseFloat(product.price);
    Object.values(localSelectedAddons).forEach(addon => {
      total += parseFloat(addon.price_impact);
    });
    return total * localQuantity;
  };

  const handleAddToCartLocal = () => {
    onAddToCart(localQuantity, localNotes, localSelectedAddons);
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-70 flex items-center justify-center p-4 z-[1000] animate-fade-in-up">
      
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg flex flex-col max-h-[90vh]">
        
        <div className="flex justify-between items-center p-5 border-b border-gray-200">
            <h2 className="text-2xl font-bold text-gray-800">{product.name}</h2>
            <button
              onClick={onClose}
              className="p-2 rounded-full bg-gray-100 hover:bg-gray-200 text-gray-600 transition-all duration-200"
            >
              <XMarkIcon className="w-6 h-6" />
            </button>
        </div>

        <div className="overflow-y-auto p-6 space-y-6">
          <div className="w-full h-64 bg-gray-100 rounded-xl overflow-hidden">
             <img src={product.image_url || `https://ui-avatars.com/api/?name=${product.name}&background=f97316&color=fff`} alt={product.name} className="w-full h-full object-cover" />
          </div>
          
          {product.description && (
            <p className="text-gray-600 text-base">{product.description}</p>
          )}

          {Object.keys(product.fullAddons).length > 0 && (
            <div className="space-y-5">
              {Object.values(product.fullAddons).map(option => (
                <div key={option.name}>
                  <p className="text-lg font-semibold text-gray-700 mb-3">{option.name}:</p>
                  <div className="flex flex-wrap gap-3">
                    {option.values.map(val => (
                      <button
                        key={val.id}
                        onClick={() => setLocalSelectedAddons(prev => ({
                            ...prev,
                            [val.addon_option_id]: { id: val.id, price_impact: parseFloat(val.price_impact) }
                        }))}
                        className={`px-4 py-2.5 rounded-lg text-sm font-medium border-2 transition-all duration-200
                                  ${localSelectedAddons[val.addon_option_id]?.id === val.id 
                                    ? 'bg-orange-600 text-white border-orange-600 shadow-md' 
                                    : 'bg-white text-gray-800 border-gray-200 hover:border-orange-400'}`}
                      >
                        {val.value} {val.price_impact > 0 ? `(+Rp${parseFloat(val.price_impact).toLocaleString('id-ID')})` : ''}
                      </button>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          )}

          <div>
            <label htmlFor="notes" className="block text-lg font-semibold text-gray-700 mb-3">Catatan (Opsional)</label>
            <textarea
              id="notes"
              value={localNotes}
              onChange={(e) => setLocalNotes(e.target.value)}
              rows="3"
              className="w-full border-gray-300 rounded-lg p-3 text-base focus:ring-2 focus:ring-orange-500 focus:border-orange-500 transition-all duration-200"
              placeholder="Masukkan Catatan"
            ></textarea>
          </div>
        </div>

        <div className="mt-auto p-5 border-t border-gray-200 bg-white sticky bottom-0">
          <div className="flex items-center justify-between gap-4">
             <div className="flex items-center">
                <button
                  onClick={() => setLocalQuantity(prev => Math.max(1, prev - 1))}
                  className="bg-orange-100 text-orange-800 font-bold h-12 w-12 rounded-full hover:bg-orange-200 transition-all duration-200 flex items-center justify-center"
                >
                  <MinusIcon className="w-6 h-6" />
                </button>
                <span className="font-bold text-2xl text-gray-800 w-16 text-center">{localQuantity}</span>
                <button
                  onClick={() => setLocalQuantity(prev => prev + 1)}
                  className="bg-orange-100 text-orange-800 font-bold h-12 w-12 rounded-full hover:bg-orange-200 transition-all duration-200 flex items-center justify-center"
                >
                  <PlusIcon className="w-6 h-6" />
                </button>
             </div>
             <button
              onClick={handleAddToCartLocal}
              className="flex-grow py-4 px-5 bg-orange-600 hover:bg-orange-700 text-white font-bold rounded-xl shadow-lg transform hover:scale-[1.02] transition-all duration-200 flex items-center justify-center"
            >
              <ShoppingCartIcon className="w-6 h-6 mr-3" />
              <span>Tambah - Rp{calculateLocalProductTotalPrice().toLocaleString('id-ID')}</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

export default ProductDetailModal;