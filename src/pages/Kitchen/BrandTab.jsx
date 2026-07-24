import React, { useState, useEffect } from 'react'
import { useOutletContext } from 'react-router-dom'
import { supabase, getRestaurantId } from '../../lib/supabase'
import { Save, Check, Upload, Trash2 } from 'lucide-react'

export default function BrandTab() {
  const { fetchRestaurant } = useOutletContext() || {}
  
  const [brand, setBrand] = useState({
    name: '',
    logo_url: '',
    primary_color: '#10B981',
    secondary_color: '#047857'
  })
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [saved, setSaved] = useState(false)

  useEffect(() => {
    async function fetchBrand() {
      const { data } = await supabase
        .from('restaurants')
        .select('*')
        .eq('id', getRestaurantId())
        .single()
      
      if (data) {
        setBrand(data)
      } else {
        setBrand(prev => ({ ...prev, name: 'MenuSync Restaurant' }))
      }
      setLoading(false)
    }
    fetchBrand()
  }, [])

  const handleChange = (e) => {
    setBrand({ ...brand, [e.target.name]: e.target.value })
    setSaved(false)
  }

  // Handle image upload and convert to base64
  const handleLogoUpload = (e) => {
    const file = e.target.files[0]
    if (!file) return

    // Limit to 2MB to keep database payload reasonable
    if (file.size > 2 * 1024 * 1024) {
      alert("Please upload an image smaller than 2MB.")
      return
    }

    const reader = new FileReader()
    reader.onloadend = () => {
      setBrand(prev => ({ ...prev, logo_url: reader.result }))
      setSaved(false)
    }
    reader.readAsDataURL(file)
  }

  const removeLogo = () => {
    setBrand(prev => ({ ...prev, logo_url: '' }))
    setSaved(false)
  }

  const handleSave = async (e) => {
    e.preventDefault()
    setSaving(true)
    
    const { error } = await supabase
      .from('restaurants')
      .upsert({
        id: getRestaurantId(),
        name: brand.name,
        logo_url: brand.logo_url,
        primary_color: brand.primary_color,
        secondary_color: brand.secondary_color
      })
    
    setSaving(false)
    
    if (error) {
      alert("Error saving: " + error.message)
    } else {
      setSaved(true)
      if (fetchRestaurant) fetchRestaurant() // Update the sidebar name
      setTimeout(() => setSaved(false), 3000)
    }
  }

  if (loading) {
    return <div className="animate-pulse">Loading brand settings...</div>
  }

  return (
    <div className="max-w-5xl mx-auto flex flex-col md:flex-row gap-8">
      {/* Editor */}
      <div className="flex-1 bg-white p-6 rounded-2xl shadow-sm border border-gray-200">
        <h2 className="text-2xl font-bold text-gray-900 mb-6">Brand & UI Customization</h2>
        <form onSubmit={handleSave} className="space-y-6">
          
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Restaurant Name</label>
            <input
              type="text"
              name="name"
              value={brand.name}
              onChange={handleChange}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 outline-none transition-shadow"
              required
            />
          </div>

          {/* Custom File Upload for Logo */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Restaurant Logo</label>
            <div className="flex items-center gap-4">
              {brand.logo_url ? (
                <div className="relative group shrink-0">
                  <img 
                    src={brand.logo_url} 
                    alt="Logo preview" 
                    className="w-16 h-16 rounded-full object-cover border border-gray-200" 
                  />
                  <button
                    type="button"
                    onClick={removeLogo}
                    className="absolute -top-1 -right-1 bg-red-500 text-white p-1 rounded-full hover:bg-red-600 transition-colors shadow-sm"
                    title="Remove Logo"
                  >
                    <Trash2 size={12} />
                  </button>
                </div>
              ) : (
                <div className="w-16 h-16 rounded-full bg-gray-100 flex items-center justify-center text-gray-400 font-bold border-2 border-dashed border-gray-300">
                  No Logo
                </div>
              )}
              
              <label className="flex-1 flex flex-col items-center justify-center px-4 py-3 bg-white border border-gray-300 rounded-lg shadow-sm cursor-pointer hover:bg-gray-50 transition-colors text-sm font-medium text-gray-700">
                <div className="flex items-center gap-2">
                  <Upload size={18} className="text-gray-400" />
                  <span>Upload Logo Image</span>
                </div>
                <input
                  type="file"
                  accept="image/*"
                  onChange={handleLogoUpload}
                  className="hidden"
                />
              </label>
            </div>
            <p className="text-xs text-gray-400 mt-2">Recommended: Square image, max size 2MB</p>
          </div>

          <div className="grid grid-cols-2 gap-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Primary Color</label>
              <div className="flex items-center gap-3">
                <input
                  type="color"
                  name="primary_color"
                  value={brand.primary_color}
                  onChange={handleChange}
                  className="w-12 h-12 p-1 bg-white border border-gray-300 rounded-lg cursor-pointer"
                />
                <input
                  type="text"
                  name="primary_color"
                  value={brand.primary_color}
                  onChange={handleChange}
                  className="flex-1 px-4 py-2 border border-gray-300 rounded-lg uppercase"
                  maxLength={7}
                />
              </div>
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Secondary Color</label>
              <div className="flex items-center gap-3">
                <input
                  type="color"
                  name="secondary_color"
                  value={brand.secondary_color}
                  onChange={handleChange}
                  className="w-12 h-12 p-1 bg-white border border-gray-300 rounded-lg cursor-pointer"
                />
                <input
                  type="text"
                  name="secondary_color"
                  value={brand.secondary_color}
                  onChange={handleChange}
                  className="flex-1 px-4 py-2 border border-gray-300 rounded-lg uppercase"
                  maxLength={7}
                />
              </div>
            </div>
          </div>

          <div className="pt-4 border-t border-gray-100">
            <button
              type="submit"
              disabled={saving}
              className="w-full flex items-center justify-center gap-2 bg-gray-900 hover:bg-gray-800 text-white py-3 px-4 rounded-xl font-medium transition-colors disabled:opacity-70"
            >
              {saving ? (
                'Saving...'
              ) : saved ? (
                <><Check size={20} /> Saved Successfully</>
              ) : (
                <><Save size={20} /> Save Brand Settings</>
              )}
            </button>
          </div>
        </form>
      </div>

      {/* Live Preview */}
      <div className="flex-1">
        <h3 className="text-sm font-semibold text-gray-500 uppercase tracking-wider mb-4">Live Preview (Customer Menu)</h3>
        
        {/* Mobile Phone Mockup */}
        <div className="w-[320px] h-[600px] bg-gray-100 rounded-[2.5rem] border-[8px] border-gray-900 overflow-hidden shadow-2xl mx-auto relative">
          
          {/* Header */}
          <div className="pt-8 pb-4 px-4 flex flex-col items-center text-white relative z-10" style={{ backgroundColor: brand.secondary_color }}>
            {brand.logo_url ? (
              <img src={brand.logo_url} alt="Logo" className="w-16 h-16 rounded-full object-cover mb-2 border-2 border-white/20" />
            ) : (
              <div className="w-16 h-16 rounded-full bg-white/20 flex items-center justify-center mb-2 border-2 border-white/40 font-bold text-xl">
                {brand.name ? brand.name.charAt(0) : 'M'}
              </div>
            )}
            <h1 className="font-bold text-lg">{brand.name || 'MenuSync Restaurant'}</h1>
            <div className="mt-2 bg-white/20 px-3 py-1 rounded-full text-xs font-medium border border-white/10 backdrop-blur-sm">
              Seated at: Table 1
            </div>
          </div>
          
          {/* Menu Categories */}
          <div className="flex gap-4 px-4 py-3 overflow-x-auto bg-white border-b border-gray-200">
            <div className="px-4 py-1.5 rounded-full text-white text-sm font-medium whitespace-nowrap" style={{ backgroundColor: brand.primary_color }}>
              Starters
            </div>
            <div className="px-4 py-1.5 rounded-full text-gray-600 bg-gray-100 text-sm font-medium whitespace-nowrap">
              Mains
            </div>
          </div>
          
          {/* Menu Item */}
          <div className="p-4 bg-gray-50 h-full">
            <div className="bg-white p-3 rounded-xl shadow-sm border border-gray-100 flex justify-between items-center mb-3">
              <div>
                <h4 className="font-bold text-gray-900">Garlic Bread</h4>
                <p className="text-gray-500 text-sm font-medium" style={{ color: brand.primary_color }}>₹120</p>
              </div>
              <button className="text-white px-3 py-1.5 rounded-lg text-sm font-medium" style={{ backgroundColor: brand.primary_color }}>
                + Add
              </button>
            </div>
          </div>
          
          {/* Floating Cart Bar */}
          <div className="absolute bottom-4 left-4 right-4 text-white p-4 rounded-xl flex justify-between items-center shadow-lg backdrop-blur-md bg-opacity-95" style={{ backgroundColor: brand.primary_color }}>
            <span className="font-medium">1 Item</span>
            <span className="font-bold">View Cart &rarr;</span>
          </div>

        </div>
      </div>
    </div>
  )
}
