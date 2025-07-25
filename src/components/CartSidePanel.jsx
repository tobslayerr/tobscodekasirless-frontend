import React from 'react';
import { XMarkIcon, MinusIcon, PlusIcon, ShoppingCartIcon, CreditCardIcon, BanknotesIcon } from '@heroicons/react/24/solid';

function CartSidePanel({
  isCartOpen,
  onClose,
  cart,
  updateCartItemQuantity,
  removeCartItem,
  calculateCartTotal,
  customerName,
  setCustomerName,
  handleCheckout
}) {
  return (
    <>
      {isCartOpen && (
        <div
          className="fixed inset-0 bg-black bg-opacity-60 z-[1050] backdrop-blur-sm"
          onClick={onClose}
        ></div>
      )}
      <div
        className={`fixed top-0 right-0 h-full w-full max-w-md bg-orange-50 shadow-2xl z-[1100]
                  transform transition-transform duration-300 ease-in-out flex flex-col
                  ${isCartOpen ? 'translate-x-0' : 'translate-x-full'}`}
      >
        <div className="p-5 border-b border-orange-200 flex justify-between items-center flex-shrink-0">
          <h2 className="text-2xl font-bold text-orange-900">Pesanan Anda</h2>
          <button
            onClick={onClose}
            className="p-2 rounded-full bg-orange-100 hover:bg-orange-200 text-orange-800 transition-all duration-200"
          >
            <XMarkIcon className="w-6 h-6" />
          </button>
        </div>
        <div className="flex-grow overflow-y-auto p-4 bg-white">
          {cart.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-full text-center text-gray-500">
                <ShoppingCartIcon className="w-24 h-24 text-orange-200" />
                <h3 className="mt-4 text-xl font-semibold text-gray-700">Keranjang masih kosong</h3>
                <p className="mt-1 text-sm">Ayo pilih menu favoritmu!</p>
            </div>
          ) : (
            <div className="space-y-4">
              {cart.map((item, index) => (
                <div
                  key={index}
                  className="flex items-start bg-white rounded-xl p-4 shadow-md transition-shadow hover:shadow-lg"
                >
                  <img
                    src={item.product_image || `https://ui-avatars.com/api/?name=${item.product_name}&background=f97316&color=fff`}
                    alt={item.product_name}
                    className="w-20 h-20 object-cover rounded-lg mr-4 border border-gray-100"
                  />
                  <div className="flex-grow">
                    <h3 className="font-bold text-gray-800 text-lg">
                      {item.product_name}
                    </h3>
                    {item.display_addons && item.display_addons.length > 0 && (
                      <div className="text-xs text-gray-500 mt-1 space-y-0.5">
                        {item.display_addons.map((addon, idx) => (
                          <p key={idx}>
                            - {addon.value}{' '}
                            {addon.price_impact > 0 && `(+Rp${parseFloat(addon.price_impact).toLocaleString('id-ID')})`}
                          </p>
                        ))}
                      </div>
                    )}
                    {item.notes && (
                      <p className="text-xs text-orange-700 bg-orange-100 rounded px-2 py-1 italic mt-2">
                        "{item.notes}"
                      </p>
                    )}
                    <div className="flex items-center mt-3">
                      <button
                        onClick={() => updateCartItemQuantity(index, -1)}
                        className="bg-orange-100 text-orange-800 font-bold h-8 w-8 rounded-full hover:bg-orange-200 transition-all duration-200 flex items-center justify-center"
                      >
                        <MinusIcon className="w-4 h-4" />
                      </button>
                      <span className="font-bold text-lg text-gray-800 w-12 text-center">
                        {item.quantity}
                      </span>
                      <button
                        onClick={() => updateCartItemQuantity(index, 1)}
                        className="bg-orange-100 text-orange-800 font-bold h-8 w-8 rounded-full hover:bg-orange-200 transition-all duration-200 flex items-center justify-center"
                      >
                        <PlusIcon className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                  <div className="flex flex-col items-end justify-between h-full ml-2">
                    <p className="text-lg font-bold text-orange-600 whitespace-nowrap">
                      Rp{item.total_item_price.toLocaleString('id-ID')}
                    </p>
                    <button
                      onClick={() => removeCartItem(index)}
                      className="text-gray-400 hover:text-red-500 text-xs mt-1 transition-colors duration-200 font-medium"
                    >
                      Hapus
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
        <div className="p-5 border-t border-orange-200 bg-orange-50 flex-shrink-0">
          <div className="mb-4">
            <label htmlFor="customerName" className="block text-gray-700 text-sm font-bold mb-2">
              Nama Pemesan
            </label>
            <input
              type="text"
              id="customerName"
              value={customerName}
              onChange={(e) => setCustomerName(e.target.value)}
              className="appearance-none border border-orange-200 rounded-lg w-full py-3 px-4 text-gray-800 leading-tight focus:outline-none focus:ring-2 focus:ring-orange-500 transition-all duration-200"
              placeholder="Tulis nama Anda di sini..."
              required
            />
          </div>
          <div className="flex justify-between items-center mb-4">
            <span className="text-xl font-bold text-gray-800">Total:</span>
            <span className="text-2xl font-extrabold text-orange-600">
              Rp{calculateCartTotal().toLocaleString('id-ID')}
            </span>
          </div>
          <div className="flex flex-col gap-3">
             <button
              onClick={() => handleCheckout('xendit')}
              disabled={cart.length === 0 || !customerName.trim()}
              className="w-full py-3.5 bg-orange-600 hover:bg-orange-700 text-white font-bold rounded-xl shadow-lg disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200 transform hover:scale-[1.02] flex items-center justify-center gap-2"
            >
              <CreditCardIcon className="w-5 h-5"/> Bayar Digital
            </button>
            <button
              onClick={() => handleCheckout('cash')}
              disabled={cart.length === 0 || !customerName.trim()}
              className="w-full py-3.5 bg-white border border-orange-600 text-orange-600 hover:bg-orange-100 font-bold rounded-xl disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200 transform hover:scale-[1.02] flex items-center justify-center gap-2"
            >
              <BanknotesIcon className="w-5 h-5"/> Bayar di Kasir
            </button>
          </div>
        </div>
      </div>
    </>
  );
}

export default CartSidePanel;