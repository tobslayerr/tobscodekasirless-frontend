import React from 'react';
import { XMarkIcon, MinusIcon, PlusIcon, ShoppingCartIcon, CreditCardIcon, BanknotesIcon, TrashIcon } from '@heroicons/react/24/solid';

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
            {/* Backdrop */}
            <div
                className={`fixed inset-0 bg-black z-[1050] transition-opacity duration-300 ${isCartOpen ? 'bg-opacity-60 backdrop-blur-sm' : 'bg-opacity-0 pointer-events-none'}`}
                onClick={onClose}
            ></div>

            {/* Side Panel */}
            <div
                className={`fixed top-0 right-0 h-full w-full max-w-md bg-white shadow-2xl z-[1100]
                           transform transition-transform duration-300 ease-in-out flex flex-col
                           ${isCartOpen ? 'translate-x-0' : 'translate-x-full'}`}
            >
                {/* Header */}
                <header className="p-5 border-b border-slate-200 flex justify-between items-center flex-shrink-0">
                    <h2 className="text-2xl font-bold text-slate-800 flex items-center gap-2">
                        <ShoppingCartIcon className="w-7 h-7 text-indigo-600"/>
                        Keranjang Anda
                    </h2>
                    <button
                        onClick={onClose}
                        className="p-2 rounded-full text-slate-500 hover:bg-slate-100 transition-colors"
                    >
                        <XMarkIcon className="w-6 h-6" />
                    </button>
                </header>

                {/* Daftar Item */}
                <div className="flex-grow overflow-y-auto p-4">
                    {cart.length === 0 ? (
                        <div className="flex flex-col items-center justify-center h-full text-center text-slate-500">
                            <ShoppingCartIcon className="w-24 h-24 text-slate-200" />
                            <h3 className="mt-4 text-xl font-semibold text-slate-700">Keranjang masih kosong</h3>
                            <p className="mt-1 text-sm">Ayo pilih menu favoritmu!</p>
                        </div>
                    ) : (
                        <div className="divide-y divide-slate-200">
                            {cart.map((item, index) => (
                                <div key={index} className="flex items-start py-4">
                                    <img
                                        src={item.product_image || `https://ui-avatars.com/api/?name=${item.product_name.replace(/\s/g, '+')}&background=e0e7ff&color=4338ca`}
                                        alt={item.product_name}
                                        className="w-20 h-20 object-cover rounded-lg mr-4 border border-slate-100"
                                    />
                                    <div className="flex-grow">
                                        <h3 className="font-bold text-slate-800 text-base">{item.product_name}</h3>
                                        {item.display_addons && item.display_addons.length > 0 && (
                                            <div className="text-xs text-slate-500 mt-1 space-y-0.5">
                                                {item.display_addons.map((addon, idx) => (
                                                    <p key={idx}>- {addon.value}</p>
                                                ))}
                                            </div>
                                        )}
                                        {item.notes && (
                                            <p className="text-xs text-indigo-700 bg-indigo-50 rounded px-2 py-1 italic mt-2">
                                                "{item.notes}"
                                            </p>
                                        )}
                                        <div className="flex items-center justify-between mt-3">
                                            <div className="flex items-center">
                                                <button onClick={() => updateCartItemQuantity(index, -1)} className="p-2 bg-slate-200 text-slate-700 rounded-l-md hover:bg-slate-300 transition-colors">
                                                    <MinusIcon className="w-4 h-4" />
                                                </button>
                                                <span className="font-bold text-base text-slate-800 w-10 text-center bg-white border-y border-slate-200">{item.quantity}</span>
                                                <button onClick={() => updateCartItemQuantity(index, 1)} className="p-2 bg-slate-200 text-slate-700 rounded-r-md hover:bg-slate-300 transition-colors">
                                                    <PlusIcon className="w-4 h-4" />
                                                </button>
                                            </div>
                                            <p className="text-base font-bold text-slate-800 whitespace-nowrap">
                                                Rp{item.total_item_price.toLocaleString('id-ID')}
                                            </p>
                                        </div>
                                    </div>
                                    <button onClick={() => removeCartItem(index)} className="ml-2 p-2 text-slate-400 hover:text-red-500 hover:bg-red-50 rounded-full transition-colors">
                                        <TrashIcon className="w-5 h-5"/>
                                    </button>
                                </div>
                            ))}
                        </div>
                    )}
                </div>

                {/* Footer Checkout */}
                <footer className="p-5 border-t border-slate-200 bg-slate-50 flex-shrink-0">
                    <div className="mb-4">
                        <label htmlFor="customerName" className="block text-slate-700 text-sm font-bold mb-2">Nama Pemesan</label>
                        <input
                            type="text"
                            id="customerName"
                            value={customerName}
                            onChange={(e) => setCustomerName(e.target.value)}
                            className="appearance-none border border-slate-300 rounded-lg w-full py-3 px-4 text-slate-800 leading-tight focus:outline-none focus:ring-2 focus:ring-indigo-500 transition-all"
                            placeholder="Tulis nama Anda di sini..."
                            required
                        />
                    </div>
                    <div className="flex justify-between items-center mb-4">
                        <span className="text-lg font-bold text-slate-800">Total:</span>
                        <span className="text-2xl font-extrabold text-indigo-600">
                            Rp{calculateCartTotal().toLocaleString('id-ID')}
                        </span>
                    </div>
                    <div className="flex flex-col gap-3">
                        <button
                            onClick={() => handleCheckout('xendit')}
                            disabled={cart.length === 0 || !customerName.trim()}
                            className="w-full py-3.5 bg-indigo-600 hover:bg-indigo-700 text-white font-bold rounded-xl shadow-lg disabled:opacity-50 disabled:cursor-not-allowed transition-all transform hover:scale-[1.02] flex items-center justify-center gap-2"
                        >
                            <CreditCardIcon className="w-5 h-5"/> Bayar Digital
                        </button>
                        <button
                            onClick={() => handleCheckout('cash')}
                            disabled={cart.length === 0 || !customerName.trim()}
                            className="w-full py-3.5 bg-white border-2 border-indigo-600 text-indigo-600 hover:bg-indigo-50 font-bold rounded-xl disabled:opacity-50 disabled:cursor-not-allowed transition-all transform hover:scale-[1.02] flex items-center justify-center gap-2"
                        >
                            <BanknotesIcon className="w-5 h-5"/> Bayar di Kasir
                        </button>
                    </div>
                </footer>
            </div>
        </>
    );
}

export default CartSidePanel;
