import React, { useState, useEffect } from 'react'
import { supabase, getRestaurantId } from '../../lib/supabase'
import { QRCodeSVG, QRCodeCanvas } from 'qrcode.react'
import { Plus, Download, Trash2, LayoutDashboard } from 'lucide-react'

export default function TableGeneratorTab() {
  const [tables, setTables] = useState([])
  const [newTable, setNewTable] = useState('')
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetchTables()
  }, [])

  const fetchTables = async () => {
    setLoading(true)
    const { data } = await supabase
      .from('tables')
      .select('*')
      .eq('restaurant_id', getRestaurantId())
      .order('table_number', { ascending: true })
    
    if (data) setTables(data)
    setLoading(false)
  }

  const addTable = async (e) => {
    e.preventDefault()
    if (!newTable.trim()) return
    
    const { data, error } = await supabase
      .from('tables')
      .insert([{ restaurant_id: getRestaurantId(), table_number: newTable }])
      .select()
      .single()
      
    if (error) {
      alert("Failed to add table: " + error.message)
    } else if (data) {
      setTables(prev => [...prev, data])
      setNewTable('')
    }
  }

  const deleteTable = async (tableId) => {
    if (!window.confirm('Delete this table? Customer QR will stop working.')) return
    const { error } = await supabase.from('tables').delete().eq('id', tableId)
    if (error) {
      alert("Failed to delete table: " + error.message)
    } else {
      setTables(prev => prev.filter(t => t.id !== tableId))
    }
  }

  const downloadQR = (tableId, tableNumber) => {
    const canvas = document.getElementById(`qr-canvas-${tableId}`)
    if (canvas) {
      const pngUrl = canvas.toDataURL("image/png").replace("image/png", "image/octet-stream")
      const downloadLink = document.createElement("a")
      downloadLink.href = pngUrl
      downloadLink.download = `table-${tableNumber}-qr.png`
      document.body.appendChild(downloadLink)
      downloadLink.click()
      document.body.removeChild(downloadLink)
    }
  }

  const getQRUrl = (table) => {
    return `${window.location.origin}/menu?tableId=${table.id}&tableNum=${encodeURIComponent(table.table_number)}`
  }

  if (loading) {
    return <div className="animate-pulse">Loading tables...</div>
  }

  return (
    <div className="max-w-5xl mx-auto space-y-8">
      <div>
        <h2 className="text-2xl font-bold text-gray-900 mb-2">Table & QR Generator</h2>
        <p className="text-gray-500">Create tables and generate QR codes for customers to order.</p>
      </div>

      {/* Add Table */}
      <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-200 flex items-end gap-4 max-w-xl">
        <div className="flex-1">
          <label className="block text-sm font-medium text-gray-700 mb-2">Table Name / Number</label>
          <input
            type="text"
            placeholder="e.g. Table 1, VIP Lounge"
            value={newTable}
            onChange={e => setNewTable(e.target.value)}
            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 outline-none"
            onKeyDown={e => e.key === 'Enter' && addTable(e)}
          />
        </div>
        <button 
          onClick={addTable}
          className="bg-gray-900 hover:bg-gray-800 text-white px-6 py-2.5 rounded-lg font-medium flex items-center gap-2 transition-colors"
        >
          <Plus size={20} /> Add Table
        </button>
      </div>

      {/* Tables Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
        {tables.map(table => {
          const qrUrl = getQRUrl(table)
          return (
            <div key={table.id} className="bg-white rounded-2xl shadow-sm border border-gray-200 p-6 flex flex-col items-center text-center relative group">
              
              <button 
                onClick={() => deleteTable(table.id)}
                className="absolute top-3 right-3 text-gray-300 hover:text-red-500 transition-colors p-1"
                title="Delete Table"
              >
                <Trash2 size={18} />
              </button>

              <div className="w-12 h-12 bg-red-50 text-red-600 rounded-full flex items-center justify-center mb-4">
                <LayoutDashboard size={24} />
              </div>
              
              <h3 className="font-bold text-lg text-gray-900 mb-4">{table.table_number}</h3>
              
              {/* QR Code Container */}
              <div className="bg-white p-2 rounded-xl border border-gray-100 shadow-sm mb-6 inline-block">
                <QRCodeCanvas
                  id={`qr-canvas-${table.id}`}
                  value={qrUrl}
                  size={140}
                  level={"H"}
                  includeMargin={false}
                />
              </div>
              
              <button 
                onClick={() => downloadQR(table.id, table.table_number)}
                className="w-full flex items-center justify-center gap-2 text-sm font-medium text-gray-700 bg-gray-50 hover:bg-gray-100 border border-gray-200 py-2 rounded-lg transition-colors"
              >
                <Download size={16} /> Download QR
              </button>
              
            </div>
          )
        })}
        
        {tables.length === 0 && (
          <div className="col-span-full py-12 text-center text-gray-400 border-2 border-dashed border-gray-200 rounded-2xl bg-gray-50">
            No tables created yet.
          </div>
        )}
      </div>
    </div>
  )
}
