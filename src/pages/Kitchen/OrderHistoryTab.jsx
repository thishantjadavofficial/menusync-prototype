import React, { useState, useEffect } from 'react'
import { supabase, getRestaurantId } from '../../lib/supabase'
import { Calendar, DollarSign, ShoppingBag, TrendingUp, ChevronDown, RefreshCw } from 'lucide-react'

export default function OrderHistoryTab() {
  const [orders, setOrders] = useState([])
  const [filteredOrders, setFilteredOrders] = useState([])
  const [loading, setLoading] = useState(true)
  const [filterPeriod, setFilterPeriod] = useState('this-week') // 'today', 'this-week', 'last-week', 'this-month', 'this-year', 'all'

  useEffect(() => {
    fetchOrderHistory()
  }, [])

  useEffect(() => {
    filterData()
  }, [orders, filterPeriod])

  const fetchOrderHistory = async () => {
    setLoading(true)
    const { data, error } = await supabase
      .from('orders')
      .select('*, order_items(*)')
      .eq('restaurant_id', getRestaurantId())
      .eq('status', 'completed')
      .order('created_at', { ascending: false })

    if (data) {
      // Calculate totals for each order
      const ordersWithTotals = data.map(order => {
        const total = order.order_items?.reduce((sum, item) => sum + (item.price * item.quantity), 0) || 0
        return { ...order, total }
      })
      setOrders(ordersWithTotals)
    }
    setLoading(false)
  }

  const filterData = () => {
    const now = new Date()
    
    // Helper dates
    const startOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate())
    
    const startOfThisWeek = new Date(now)
    startOfThisWeek.setDate(now.getDate() - now.getDay()) // Sunday
    startOfThisWeek.setHours(0,0,0,0)
    
    const startOfLastWeek = new Date(startOfThisWeek)
    startOfLastWeek.setDate(startOfLastWeek.getDate() - 7)
    const endOfLastWeek = new Date(startOfThisWeek)
    
    const startOfThisMonth = new Date(now.getFullYear(), now.getMonth(), 1)
    const startOfThisYear = new Date(now.getFullYear(), 0, 1)

    const filtered = orders.filter(order => {
      const orderDate = new Date(order.created_at)
      
      switch (filterPeriod) {
        case 'today':
          return orderDate >= startOfToday
        case 'this-week':
          return orderDate >= startOfThisWeek
        case 'last-week':
          return orderDate >= startOfLastWeek && orderDate < endOfLastWeek
        case 'this-month':
          return orderDate >= startOfThisMonth
        case 'this-year':
          return orderDate >= startOfThisYear
        case 'all':
        default:
          return true
      }
    })
    
    setFilteredOrders(filtered)
  }

  // Calculate Metrics
  const totalRevenue = filteredOrders.reduce((sum, o) => sum + o.total, 0)
  const totalOrdersCount = filteredOrders.length
  const averageOrderValue = totalOrdersCount > 0 ? (totalRevenue / totalOrdersCount).toFixed(2) : '0.00'

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-4">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Order History</h2>
          <p className="text-gray-500">Track sales performance and revenue records.</p>
        </div>

        {/* Filter Period Dropdown/Selector */}
        <div className="flex items-center gap-3">
          <button 
            onClick={fetchOrderHistory} 
            className="p-2 text-gray-600 bg-white border border-gray-200 rounded-xl hover:bg-gray-50 transition-colors shadow-sm"
            title="Refresh Data"
          >
            <RefreshCw size={20} className={loading ? "animate-spin" : ""} />
          </button>
          
          <div className="relative">
            <select
              value={filterPeriod}
              onChange={e => setFilterPeriod(e.target.value)}
              className="appearance-none bg-white border border-gray-200 text-gray-700 py-2.5 pl-4 pr-10 rounded-xl font-medium focus:outline-none focus:ring-2 focus:ring-emerald-500 shadow-sm cursor-pointer"
            >
              <option value="today">Today</option>
              <option value="this-week">This Week</option>
              <option value="last-week">Last Week</option>
              <option value="this-month">This Month</option>
              <option value="this-year">This Year</option>
              <option value="all">All Time</option>
            </select>
            <ChevronDown size={18} className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" />
          </div>
        </div>
      </div>

      {/* Analytics Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        
        {/* Total Revenue */}
        <div className="bg-white p-6 rounded-2xl border border-gray-100 shadow-sm flex items-center gap-5">
          <div className="w-12 h-12 bg-emerald-50 text-emerald-600 rounded-xl flex items-center justify-center">
            <DollarSign size={24} />
          </div>
          <div>
            <span className="text-xs font-semibold text-gray-400 uppercase tracking-wider block">Total Revenue</span>
            <span className="text-2xl font-bold text-gray-900">₹{totalRevenue.toFixed(2)}</span>
          </div>
        </div>

        {/* Total Orders */}
        <div className="bg-white p-6 rounded-2xl border border-gray-100 shadow-sm flex items-center gap-5">
          <div className="w-12 h-12 bg-blue-50 text-blue-600 rounded-xl flex items-center justify-center">
            <ShoppingBag size={24} />
          </div>
          <div>
            <span className="text-xs font-semibold text-gray-400 uppercase tracking-wider block">Completed Orders</span>
            <span className="text-2xl font-bold text-gray-900">{totalOrdersCount}</span>
          </div>
        </div>

        {/* Avg Order Value */}
        <div className="bg-white p-6 rounded-2xl border border-gray-100 shadow-sm flex items-center gap-5">
          <div className="w-12 h-12 bg-purple-50 text-purple-600 rounded-xl flex items-center justify-center">
            <TrendingUp size={24} />
          </div>
          <div>
            <span className="text-xs font-semibold text-gray-400 uppercase tracking-wider block">Avg. Order Value</span>
            <span className="text-2xl font-bold text-gray-900">₹{averageOrderValue}</span>
          </div>
        </div>

      </div>

      {/* Orders Table */}
      <div className="bg-white rounded-2xl border border-gray-200 overflow-hidden shadow-sm">
        <div className="p-5 border-b border-gray-100 flex justify-between items-center bg-gray-50">
          <h3 className="font-bold text-gray-900">Orders Log</h3>
          <span className="text-xs font-semibold text-gray-500 uppercase">showing {filteredOrders.length} orders</span>
        </div>

        {loading ? (
          <div className="p-8 text-center text-gray-400">Loading order history...</div>
        ) : filteredOrders.length === 0 ? (
          <div className="p-12 text-center text-gray-400">
            <Calendar size={48} className="mx-auto mb-4 opacity-50" />
            <p>No orders found for the selected period.</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-gray-200 text-xs font-semibold text-gray-500 uppercase bg-gray-50/50">
                  <th className="py-4 px-6">Order ID</th>
                  <th className="py-4 px-6">Date & Time</th>
                  <th className="py-4 px-6">Table</th>
                  <th className="py-4 px-6">Items</th>
                  <th className="py-4 px-6 text-right">Total Price</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100 text-sm">
                {filteredOrders.map(order => {
                  const itemsList = order.order_items?.map(i => `${i.dish_name} (x${i.quantity})`).join(', ')
                  const formattedDate = new Date(order.created_at).toLocaleString([], {
                    month: 'short',
                    day: 'numeric',
                    hour: '2-digit',
                    minute: '2-digit'
                  })
                  
                  return (
                    <tr key={order.id} className="hover:bg-gray-50/50 transition-colors">
                      <td className="py-4 px-6 font-mono text-xs text-gray-500">#{order.id.slice(0, 8)}</td>
                      <td className="py-4 px-6 text-gray-600">{formattedDate}</td>
                      <td className="py-4 px-6 font-semibold text-gray-900">{order.table_number}</td>
                      <td className="py-4 px-6 text-gray-600 max-w-xs truncate" title={itemsList}>
                        {itemsList || <span className="italic text-gray-400">No items</span>}
                      </td>
                      <td className="py-4 px-6 text-right font-bold text-emerald-600">₹{order.total.toFixed(2)}</td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  )
}
