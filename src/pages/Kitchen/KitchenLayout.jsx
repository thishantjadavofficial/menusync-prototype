import React, { useState, useEffect } from 'react'
import { Outlet, NavLink } from 'react-router-dom'
import { LayoutDashboard, Palette, MenuSquare, QrCode, Receipt } from 'lucide-react'
import { clsx } from 'clsx'
import { supabase, RESTAURANT_ID } from '../../lib/supabase'

export default function KitchenLayout() {
  const [restaurantName, setRestaurantName] = useState('Loading...')

  const fetchRestaurant = async () => {
    const { data, error } = await supabase
      .from('restaurants')
      .select('*')
      .eq('id', RESTAURANT_ID)
      .single()
      
    if (data) {
      setRestaurantName(data.name)
    } else {
      const { data: newData, error: upsertError } = await supabase
        .from('restaurants')
        .upsert({
          id: RESTAURANT_ID,
          name: 'MenuSync Restaurant',
          primary_color: '#10B981',
          secondary_color: '#047857'
        })
        .select()
        .single()
        
      if (newData) setRestaurantName(newData.name)
      if (upsertError) console.error("Could not initialize restaurant:", upsertError)
    }
  }

  useEffect(() => {
    fetchRestaurant()
  }, [])

  const navItems = [
    { to: 'orders', icon: LayoutDashboard, label: 'Live Orders' },
    { to: 'brand', icon: Palette, label: 'Brand & UI' },
    { to: 'menu', icon: MenuSquare, label: 'Menu Builder' },
    { to: 'tables', icon: QrCode, label: 'Table & QR Gen' },
    { to: 'history', icon: Receipt, label: 'Order History' },
  ]

  return (
    <div className="flex h-screen bg-gray-50 text-gray-900">
      {/* Sidebar */}
      <aside className="w-64 bg-white border-r border-gray-200 flex flex-col shadow-sm">
        <div className="p-6 flex items-center gap-3 border-b border-gray-100">
          {/* MenuSync Premium Logo */}
          <div className="relative flex items-center justify-center w-10 h-10 bg-gradient-to-tr from-emerald-500 to-emerald-600 text-white rounded-xl shadow-md overflow-hidden shrink-0">
            <svg 
              className="w-6 h-6 animate-pulse" 
              viewBox="0 0 24 24" 
              fill="none" 
              stroke="currentColor" 
              strokeWidth="2.5" 
              strokeLinecap="round" 
              strokeLinejoin="round"
            >
              <path d="M12 2v20" />
              <path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6" />
              <circle cx="12" cy="12" r="10" strokeWidth="1" opacity="0.3" />
            </svg>
            <div className="absolute inset-0 bg-white/10 opacity-0 hover:opacity-100 transition-opacity rounded-xl"></div>
          </div>
          <h1 className="font-bold text-lg text-gray-800 tracking-tight leading-tight">
            MenuSync
            <br/><span className="text-sm font-medium text-gray-500">{restaurantName}</span>
          </h1>
        </div>
        
        <nav className="flex-1 p-4 space-y-2">
          {navItems.map((item) => (
            <NavLink
              key={item.to}
              to={item.to}
              className={({ isActive }) =>
                clsx(
                  'flex items-center gap-3 px-4 py-3 rounded-xl transition-all duration-200 font-medium',
                  isActive
                    ? 'bg-emerald-50 text-emerald-600 shadow-sm'
                    : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'
                )
              }
            >
              <item.icon size={20} />
              {item.label}
            </NavLink>
          ))}
        </nav>
      </aside>

      {/* Main Content Area */}
      <main className="flex-1 overflow-auto bg-gray-50 p-8">
        <div className="max-w-6xl mx-auto h-full">
          <Outlet context={{ fetchRestaurant }} />
        </div>
      </main>
    </div>
  )
}
