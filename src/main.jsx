import React from 'react'
import ReactDOM from 'react-dom/client'
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import './index.css'

import KitchenLayout from './pages/Kitchen/KitchenLayout'
import LiveOrdersTab from './pages/Kitchen/LiveOrdersTab'
import BrandTab from './pages/Kitchen/BrandTab'
import MenuBuilderTab from './pages/Kitchen/MenuBuilderTab'
import TableGeneratorTab from './pages/Kitchen/TableGeneratorTab'
import OrderHistoryTab from './pages/Kitchen/OrderHistoryTab'

import CustomerMenu from './pages/Menu/CustomerMenu'

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <BrowserRouter>
      <Routes>
        {/* Redirect root to kitchen by default */}
        <Route path="/" element={<Navigate to="/kitchen" replace />} />
        
        {/* Kitchen Routes */}
        <Route path="/kitchen" element={<KitchenLayout />}>
          <Route index element={<Navigate to="orders" replace />} />
          <Route path="orders" element={<LiveOrdersTab />} />
          <Route path="brand" element={<BrandTab />} />
          <Route path="menu" element={<MenuBuilderTab />} />
          <Route path="tables" element={<TableGeneratorTab />} />
          <Route path="history" element={<OrderHistoryTab />} />
        </Route>
        
        {/* Customer Menu Route */}
        <Route path="/menu" element={<CustomerMenu />} />
      </Routes>
    </BrowserRouter>
  </React.StrictMode>
)
