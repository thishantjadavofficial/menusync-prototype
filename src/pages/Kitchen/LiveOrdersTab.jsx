import React, { useEffect, useState, useRef } from 'react'
import { supabase, getRestaurantId } from '../../lib/supabase'
import { CheckCircle2, Clock, ChefHat } from 'lucide-react'

// Simple beep sound using Web Audio API
const playChime = () => {
  try {
    const audioCtx = new (window.AudioContext || window.webkitAudioContext)()
    const oscillator = audioCtx.createOscillator()
    const gainNode = audioCtx.createGain()
    
    oscillator.type = 'sine'
    oscillator.frequency.setValueAtTime(523.25, audioCtx.currentTime) // C5
    oscillator.frequency.exponentialRampToValueAtTime(1046.50, audioCtx.currentTime + 0.1) // C6
    
    gainNode.gain.setValueAtTime(0.5, audioCtx.currentTime)
    gainNode.gain.exponentialRampToValueAtTime(0.01, audioCtx.currentTime + 0.5)
    
    oscillator.connect(gainNode)
    gainNode.connect(audioCtx.destination)
    
    oscillator.start()
    oscillator.stop(audioCtx.currentTime + 0.5)
  } catch (err) {
    console.error("Audio playback failed", err)
  }
}

export default function LiveOrdersTab() {
  const [orders, setOrders] = useState([])
  const [loading, setLoading] = useState(true)

  // Fetch initial orders
  useEffect(() => {
    fetchOrders()
    
    // Subscribe to new orders
    const subscription = supabase
      .channel('public:orders')
      .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'orders', filter: `restaurant_id=eq.${getRestaurantId()}` }, payload => {
        const newOrder = payload.new
        // Fetch order items for the new order
        fetchOrderItems(newOrder).then(orderWithItems => {
          setOrders(prev => [orderWithItems, ...prev])
          playChime()
        })
      })
      .on('postgres_changes', { event: 'UPDATE', schema: 'public', table: 'orders', filter: `restaurant_id=eq.${getRestaurantId()}` }, payload => {
        const updatedOrder = payload.new
        setOrders(prev => {
          // If marked completed, we can either remove it or just update status
          // The prompt says "move to a completed tab or scroll to top". We'll just filter out completed for a cleaner KDS, 
          // or keep them at the bottom. Let's filter out pending ones to keep it clean.
          if (updatedOrder.status === 'completed') {
            return prev.filter(o => o.id !== updatedOrder.id)
          }
          return prev.map(o => o.id === updatedOrder.id ? { ...o, ...updatedOrder } : o)
        })
      })
      .subscribe()

    return () => {
      supabase.removeChannel(subscription)
    }
  }, [])

  const fetchOrders = async () => {
    setLoading(true)
    const { data: ordersData, error: ordersError } = await supabase
      .from('orders')
      .select('*')
      .eq('restaurant_id', getRestaurantId())
      .eq('status', 'pending')
      .order('created_at', { ascending: true }) // Oldest first (highest priority)

    if (ordersData) {
      // Fetch items for all these orders
      const ordersWithItems = await Promise.all(ordersData.map(fetchOrderItems))
      setOrders(ordersWithItems)
    }
    setLoading(false)
  }

  const fetchOrderItems = async (order) => {
    const { data: items } = await supabase
      .from('order_items')
      .select('*')
      .eq('order_id', order.id)
    return { ...order, items: items || [] }
  }

  const markServed = async (orderId) => {
    await supabase
      .from('orders')
      .update({ status: 'completed' })
      .eq('id', orderId)
  }

  if (loading) {
    return <div className="flex items-center justify-center h-64 text-gray-400">Loading orders...</div>
  }

  return (
    <div className="flex flex-col h-full">
      <div className="flex justify-between items-center mb-6">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Live Orders</h2>
          <p className="text-gray-500">Real-time Kitchen Display System</p>
        </div>
        <div className="bg-red-50 text-red-600 px-4 py-2 rounded-lg font-semibold flex items-center gap-2 shadow-sm border border-red-100">
          <ChefHat size={20} />
          {orders.length} Pending
        </div>
      </div>

      {orders.length === 0 ? (
        <div className="flex-1 flex flex-col items-center justify-center text-gray-400 bg-white rounded-2xl border border-gray-200 border-dashed">
          <ChefHat size={48} className="mb-4 text-gray-300" />
          <p className="text-lg font-medium text-gray-500">No pending orders</p>
          <p className="text-sm">Waiting for new orders to arrive...</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 auto-rows-max">
          {orders.map((order) => {
            const timeStr = new Date(order.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
            
            return (
              <div key={order.id} className="bg-white rounded-2xl shadow-sm border border-gray-200 overflow-hidden flex flex-col hover:shadow-md transition-shadow">
                <div className="bg-gray-50 p-4 border-b border-gray-200 flex justify-between items-center">
                  <div className="flex flex-col">
                    <span className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1">Table</span>
                    <span className="text-xl font-bold text-gray-900">{order.table_number}</span>
                  </div>
                  <div className="flex items-center gap-1.5 text-gray-500 bg-white px-3 py-1.5 rounded-full border border-gray-200 text-sm font-medium shadow-sm">
                    <Clock size={16} />
                    {timeStr}
                  </div>
                </div>
                
                <div className="p-4 flex-1">
                  <ul className="space-y-3">
                    {order.items?.map((item, idx) => (
                      <li key={idx} className="flex justify-between items-start border-b border-gray-50 pb-2 last:border-0 last:pb-0">
                        <div className="flex items-start gap-2">
                          <span className="font-semibold text-gray-900 min-w-[24px]">x{item.quantity}</span>
                          <span className="text-gray-700">{item.dish_name}</span>
                        </div>
                      </li>
                    ))}
                  </ul>
                </div>
                
                <div className="p-4 bg-gray-50 border-t border-gray-100">
                  <button
                    onClick={() => markServed(order.id)}
                    className="w-full bg-red-600 hover:bg-red-700 text-white font-medium py-3 rounded-xl flex items-center justify-center gap-2 transition-colors shadow-sm"
                  >
                    <CheckCircle2 size={20} />
                    Mark Served
                  </button>
                </div>
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}
