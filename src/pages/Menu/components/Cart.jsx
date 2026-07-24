import React from 'react'
import { ShoppingBag, X } from 'lucide-react'

export default function Cart({ cart, toggleCart, isCartOpen, brand, placeOrder, isOrdering, orderSuccess }) {
  const totalItems = Object.values(cart).reduce((sum, item) => sum + item.quantity, 0)
  const totalPrice = Object.values(cart).reduce((sum, item) => sum + (item.price * item.quantity), 0)

  if (orderSuccess) {
    return (
      <div className="fixed inset-0 z-50 bg-white flex flex-col items-center justify-center p-6 text-center animate-in fade-in duration-300">
        <div 
          className="w-24 h-24 rounded-full flex items-center justify-center mb-6 text-white shadow-xl"
          style={{ backgroundColor: brand.primary_color }}
        >
          <CheckCircle className="w-12 h-12" />
        </div>
        <h2 className="text-3xl font-bold text-gray-900 mb-2">Order Sent!</h2>
        <p className="text-gray-500 text-lg">Your meal is being prepared in the kitchen.</p>
      </div>
    )
  }

  return (
    <>
      {/* Overlay Backdrop for Desktop (when open) */}
      {isCartOpen && (
        <div 
          className="hidden md:block fixed inset-0 bg-black/40 z-40 animate-in fade-in duration-200"
          onClick={toggleCart}
        />
      )}

      {/* Floating Bottom Bar */}
      {totalItems > 0 && !isCartOpen && (
        <div className="fixed bottom-6 left-4 right-4 z-40 md:left-auto md:right-8 md:w-[320px] animate-in slide-in-from-bottom-8 duration-300">
          <button 
            onClick={toggleCart}
            className="w-full text-white p-4 rounded-2xl flex justify-between items-center shadow-2xl backdrop-blur-md bg-opacity-95 transition-transform hover:scale-105 active:scale-[0.98]" 
            style={{ backgroundColor: brand.primary_color }}
          >
            <div className="flex items-center gap-3">
              <div className="bg-white/20 px-3 py-1 rounded-full text-sm font-bold">
                {totalItems} {totalItems === 1 ? 'Item' : 'Items'}
              </div>
            </div>
            <span className="font-bold flex items-center gap-2">
              View Order (₹{totalPrice}) &rarr;
            </span>
          </button>
        </div>
      )}

      {/* Cart Modal / Slide-out Drawer */}
      {isCartOpen && (
        <div className="fixed inset-0 z-50 bg-white flex flex-col md:inset-y-0 md:left-auto md:right-0 md:w-[400px] md:shadow-2xl animate-in slide-in-from-bottom md:slide-in-from-right duration-300">
          <div className="p-4 flex items-center justify-between border-b border-gray-100 shrink-0" style={{ backgroundColor: brand.secondary_color }}>
            <h3 className="text-white font-bold text-lg flex items-center gap-2">
              <ShoppingBag size={20} /> Your Order
            </h3>
            <button onClick={toggleCart} className="text-white/80 hover:text-white p-2">
              <X size={24} />
            </button>
          </div>

          <div className="flex-1 overflow-y-auto p-4 bg-gray-50">
            {totalItems === 0 ? (
              <div className="h-full flex flex-col items-center justify-center text-gray-400">
                <ShoppingBag size={48} className="mb-4 opacity-50" />
                <p>Your cart is empty</p>
              </div>
            ) : (
              <div className="space-y-3">
                {Object.values(cart).map(item => (
                  <div key={item.id} className="bg-white p-4 rounded-xl shadow-sm border border-gray-100 flex justify-between items-center">
                    <div>
                      <h4 className="font-bold text-gray-900">{item.name}</h4>
                      <p className="text-sm text-gray-500">₹{item.price} x {item.quantity}</p>
                    </div>
                    <div className="font-bold text-gray-900">
                      ₹{item.price * item.quantity}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {totalItems > 0 && (
            <div className="p-6 bg-white border-t border-gray-100 shadow-[0_-4px_20px_rgba(0,0,0,0.05)] shrink-0">
              <div className="flex justify-between items-center mb-6 text-xl font-bold">
                <span>Total Amount</span>
                <span style={{ color: brand.primary_color }}>₹{totalPrice}</span>
              </div>
              <button 
                onClick={placeOrder}
                disabled={isOrdering}
                className="w-full text-white py-4 rounded-xl font-bold text-lg shadow-lg disabled:opacity-70 transition-transform active:scale-[0.98]"
                style={{ backgroundColor: brand.primary_color }}
              >
                {isOrdering ? 'Sending to Kitchen...' : 'Place Order'}
              </button>
            </div>
          )}
        </div>
      )}
    </>
  )
}

function CheckCircle(props) {
  return (
    <svg {...props} xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"></path>
      <polyline points="22 4 12 14.01 9 11.01"></polyline>
    </svg>
  )
}
