import React from 'react';

function ProductCard({ product, onProductClick }) {
  return (
    <div
      key={product.id}
      className="group bg-white rounded-3xl shadow-md overflow-hidden cursor-pointer
                 border border-gray-100
                 hover:shadow-xl hover:-translate-y-1.5 transition-all duration-300 
                 flex flex-col"
      onClick={() => onProductClick(product)}
    >
      <div className="w-full aspect-square bg-gray-100 overflow-hidden">
        {product.image_url ? (
          <img 
            src={product.image_url} 
            alt={product.name} 
            className="w-full h-full object-cover"
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center">
            <span className="text-gray-400 text-xs text-center p-2">Gambar tidak tersedia</span>
          </div>
        )}
      </div>

      <div className="p-5 flex flex-col flex-grow">
        <h3 className="text-lg font-bold text-gray-900 mb-1 leading-tight line-clamp-2">
          {product.name}
        </h3>
        
        <p className="text-sm text-gray-500 mb-4 line-clamp-2 flex-grow">
            {product.description || 'Klik untuk melihat detail produk.'}
        </p>

        <div className="mt-auto">
          <p className="text-orange-600 font-extrabold text-xl">
            Rp{parseFloat(product.price).toLocaleString('id-ID')}
          </p>
        </div>
      </div>
    </div>
  );
}

export default ProductCard;