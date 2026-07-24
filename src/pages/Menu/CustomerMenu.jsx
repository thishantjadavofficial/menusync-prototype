import React, { useState, useEffect } from 'react'
import { useSearchParams } from 'react-router-dom'
import { supabase } from '../../lib/supabase'
import Cart from './components/Cart'
import { QrCode } from 'lucide-react'

export default function CustomerMenu() {
  const [searchParams] = useSearchParams()
  const tableId = searchParams.get('tableId')
  const tableNum = searchParams.get('tableNum') || 'Unknown Table'

  const [restaurantId, setRestaurantId] = useState(null)
  const [brand, setBrand] = useState(null)
  const [categories, setCategories] = useState([])
  const [dishes, setDishes] = useState([])
  const [activeCategory, setActiveCategory] = useState(null)
  const [errorMsg, setErrorMsg] = useState(null)
  
  const [cart, setCart] = useState({}) // { dishId: { ...dish, quantity: X } }
  const [isCartOpen, setIsCartOpen] = useState(false)
  const [isOrdering, setIsOrdering] = useState(false)
  const [orderSuccess, setOrderSuccess] = useState(false)
  
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetchData()
  }, [])

  const fetchData = async () => {
    if (!tableId) {
      setErrorMsg("Invalid Menu Link. Please scan a table QR code.")
      setLoading(false)
      return
    }

    // 1. Fetch the table to infer the restaurant_id
    const { data: tableData, error: tableError } = await supabase
      .from('tables')
      .select('restaurant_id')
      .eq('id', tableId)
      .single()

    if (tableError || !tableData) {
      setErrorMsg("Table not found. The QR code may be old or invalid.")
      setLoading(false)
      return
    }

    const fetchedRestId = tableData.restaurant_id
    setRestaurantId(fetchedRestId)

    // 2. Fetch all menu data for this specific restaurant
    const [brandRes, catRes, dishRes] = await Promise.all([
      supabase.from('restaurants').select('*').eq('id', fetchedRestId).single(),
      supabase.from('categories').select('*').eq('restaurant_id', fetchedRestId).order('created_at'),
      supabase.from('dishes').select('*, categories!inner(restaurant_id)').eq('categories.restaurant_id', fetchedRestId).order('created_at')
    ])
    
    if (brandRes.data) setBrand(brandRes.data)
    if (catRes.data) {
      setCategories(catRes.data)
      if (catRes.data.length > 0) setActiveCategory(catRes.data[0].id)
    }
    if (dishRes.data) setDishes(dishRes.data)
    
    setLoading(false)
  }

  const addToCart = (dish) => {
    setCart(prev => {
      const current = prev[dish.id]
      return {
        ...prev,
        [dish.id]: {
          ...dish,
          quantity: current ? current.quantity + 1 : 1
        }
      }
    })
  }

  const removeFromCart = (dishId) => {
    setCart(prev => {
      const current = prev[dishId]
      if (!current) return prev
      if (current.quantity === 1) {
        const newCart = { ...prev }
        delete newCart[dishId]
        return newCart
      }
      return {
        ...prev,
        [dishId]: {
          ...current,
          quantity: current.quantity - 1
        }
      }
    })
  }

  const placeOrder = async () => {
    if (!tableId || !restaurantId || Object.keys(cart).length === 0) return
    
    setIsOrdering(true)
    
    // 1. Create order linked to the correct restaurant
    const { data: order, error: orderError } = await supabase
      .from('orders')
      .insert([{
        restaurant_id: restaurantId,
        table_id: tableId,
        table_number: tableNum,
        status: 'pending'
      }])
      .select()
      .single()
      
    if (order && !orderError) {
      // 2. Insert items
      const itemsToInsert = Object.values(cart).map(item => ({
        order_id: order.id,
        dish_name: item.name,
        quantity: item.quantity,
        price: item.price
      }))
      
      await supabase.from('order_items').insert(itemsToInsert)
      
      setOrderSuccess(true)
      setIsCartOpen(false)
      setCart({})
    } else {
      console.error("Order error", orderError)
      alert("Failed to place order. Please try again.")
    }
    
    setIsOrdering(false)
  }

  if (loading) {
    return <div className="min-h-screen flex items-center justify-center bg-gray-50 text-gray-500 animate-pulse">Loading Menu...</div>
  }

  if (errorMsg) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-gray-50 text-center p-6">
        <QrCode size={64} className="text-gray-300 mb-6" />
        <h2 className="text-2xl font-bold text-gray-800 mb-2">Oops!</h2>
        <p className="text-gray-500">{errorMsg}</p>
      </div>
    )
  }

  if (!brand) return null

  return (
    <div className="min-h-screen bg-gray-50 font-sans pb-24">
      {/* Header */}
      <header 
        className="pt-10 pb-6 px-6 text-white text-center shadow-md relative"
        style={{ backgroundColor: brand.secondary_color }}
      >
        <div className="flex flex-col items-center">
          {brand.logo_url ? (
            <img src={brand.logo_url} alt="Logo" className="w-20 h-20 rounded-full object-cover mb-3 border-2 border-white/20 shadow-lg" />
          ) : (
            <div className="w-20 h-20 rounded-full bg-white/10 flex items-center justify-center mb-3 border-2 border-white/20 text-3xl font-bold shadow-lg">
              {brand.name.charAt(0)}
            </div>
          )}
          <h1 className="text-2xl font-bold tracking-tight mb-3">{brand.name}</h1>
          <div className="bg-white/20 px-4 py-1.5 rounded-full text-sm font-medium border border-white/10 backdrop-blur-md">
            Seated at: {tableNum}
          </div>
        </div>
      </header>

      {/* Category Tabs */}
      <div className="sticky top-0 z-30 bg-white/80 backdrop-blur-md shadow-sm border-b border-gray-100 overflow-x-auto">
        <div className="flex px-4 py-3 gap-3 min-w-max">
          {categories.map(cat => (
            <button
              key={cat.id}
              onClick={() => setActiveCategory(cat.id)}
              className={`px-5 py-2 rounded-full font-medium transition-all duration-200 ${
                activeCategory === cat.id 
                  ? 'text-white shadow-md' 
                  : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
              }`}
              style={activeCategory === cat.id ? { backgroundColor: brand.primary_color } : {}}
            >
              {cat.name}
            </button>
          ))}
        </div>
      </div>

      {/* Dishes List */}
      <div className="p-4 max-w-3xl mx-auto space-y-4">
        {dishes.filter(d => d.category_id === activeCategory).length === 0 ? (
          <div className="text-center py-12 text-gray-400 bg-white rounded-2xl border border-gray-200 border-dashed">
            No dishes in this category yet.
          </div>
        ) : (
          dishes.filter(d => d.category_id === activeCategory).map(dish => {
            const quantity = cart[dish.id]?.quantity || 0
            
            return (
              <div key={dish.id} className="bg-white p-4 rounded-2xl shadow-sm border border-gray-100 flex justify-between items-center hover:shadow-md transition-shadow">
                <div className="flex-1 pr-4">
                  <h3 className="font-bold text-gray-900 text-lg leading-tight mb-1">{dish.name}</h3>
                  <div className="font-bold" style={{ color: brand.primary_color }}>₹{dish.price}</div>
                </div>
                
                <div>
                  {quantity === 0 ? (
                    <button 
                      onClick={() => addToCart(dish)}
                      className="px-6 py-2.5 rounded-xl text-white font-semibold text-sm shadow-sm transition-transform active:scale-95"
                      style={{ backgroundColor: brand.primary_color }}
                    >
                      ADD
                    </button>
                  ) : (
                    <div className="flex items-center bg-gray-100 rounded-xl overflow-hidden border border-gray-200 shadow-inner">
                      <button 
                        onClick={() => removeFromCart(dish.id)}
                        className="w-10 h-10 flex items-center justify-center text-gray-700 hover:bg-gray-200 active:bg-gray-300 font-bold transition-colors"
                      >
                        -
                      </button>
                      <span className="w-10 text-center font-bold text-gray-900">{quantity}</span>
                      <button 
                        onClick={() => addToCart(dish)}
                        className="w-10 h-10 flex items-center justify-center text-white hover:opacity-90 active:opacity-80 font-bold transition-opacity"
                        style={{ backgroundColor: brand.primary_color }}
                      >
                        +
                      </button>
                    </div>
                  )}
                </div>
              </div>
            )
          })
        )}
      </div>

      <Cart 
        cart={cart}
        isCartOpen={isCartOpen}
        toggleCart={() => setIsCartOpen(!isCartOpen)}
        brand={brand}
        placeOrder={placeOrder}
        isOrdering={isOrdering}
        orderSuccess={orderSuccess}
      />
    </div>
  )
}
