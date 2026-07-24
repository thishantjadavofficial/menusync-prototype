import React, { useState, useEffect } from 'react'
import { supabase, getRestaurantId } from '../../lib/supabase'
import { Plus, Trash2, GripVertical, ChevronDown, ChevronRight } from 'lucide-react'

export default function MenuBuilderTab() {
  const [categories, setCategories] = useState([])
  const [dishes, setDishes] = useState([])
  const [loading, setLoading] = useState(true)

  // Forms state
  const [newCategoryName, setNewCategoryName] = useState('')
  const [newDish, setNewDish] = useState({ category_id: '', name: '', price: '' })
  
  // UI state
  const [expandedCategories, setExpandedCategories] = useState({})

  useEffect(() => {
    fetchMenu()
  }, [])

  const fetchMenu = async () => {
    setLoading(true)
    const [catRes, dishRes] = await Promise.all([
      supabase.from('categories').select('*').eq('restaurant_id', getRestaurantId()).order('created_at'),
      supabase.from('dishes').select('*, categories!inner(restaurant_id)').eq('categories.restaurant_id', getRestaurantId()).order('created_at')
    ])
    
    if (catRes.data) setCategories(catRes.data)
    if (dishRes.data) setDishes(dishRes.data)
    
    // Auto-expand all categories by default
    const expanded = {}
    catRes.data?.forEach(c => expanded[c.id] = true)
    setExpandedCategories(expanded)
    
    setLoading(false)
  }

  const toggleCategory = (catId) => {
    setExpandedCategories(prev => ({ ...prev, [catId]: !prev[catId] }))
  }

  const addCategory = async (e) => {
    e.preventDefault()
    if (!newCategoryName.trim()) return
    
    const { data, error } = await supabase
      .from('categories')
      .insert([{ restaurant_id: getRestaurantId(), name: newCategoryName }])
      .select()
      .single()
      
    if (error) {
      alert("Failed to add category: " + error.message)
    } else if (data) {
      setCategories(prev => [...prev, data])
      setExpandedCategories(prev => ({ ...prev, [data.id]: true }))
      setNewCategoryName('')
    }
  }

  const deleteCategory = async (catId) => {
    if (!window.confirm("Delete this category and all its dishes?")) return
    const { error } = await supabase.from('categories').delete().eq('id', catId)
    if (error) {
      alert("Failed to delete category: " + error.message)
    } else {
      setCategories(prev => prev.filter(c => c.id !== catId))
      setDishes(prev => prev.filter(d => d.category_id !== catId))
    }
  }

  const addDish = async (e) => {
    e.preventDefault()
    if (!newDish.category_id || !newDish.name.trim() || !newDish.price) return
    
    const { data, error } = await supabase
      .from('dishes')
      .insert([{ 
        category_id: newDish.category_id, 
        name: newDish.name, 
        price: parseFloat(newDish.price) 
      }])
      .select()
      .single()
      
    if (error) {
      alert("Failed to add dish: " + error.message)
    } else if (data) {
      setDishes(prev => [...prev, data])
      setNewDish({ ...newDish, name: '', price: '' }) // keep category selected
    }
  }

  const deleteDish = async (dishId) => {
    const { error } = await supabase.from('dishes').delete().eq('id', dishId)
    if (error) {
      alert("Failed to delete dish: " + error.message)
    } else {
      setDishes(prev => prev.filter(d => d.id !== dishId))
    }
  }

  if (loading) {
    return <div className="animate-pulse">Loading menu...</div>
  }

  return (
    <div className="max-w-4xl mx-auto space-y-8">
      <div>
        <h2 className="text-2xl font-bold text-gray-900 mb-2">Menu Builder</h2>
        <p className="text-gray-500">Organize categories and add dishes.</p>
      </div>

      <div className="grid md:grid-cols-3 gap-8">
        
        {/* Left Column: Actions */}
        <div className="md:col-span-1 space-y-6">
          
          {/* Add Category Form */}
          <div className="bg-white p-5 rounded-xl shadow-sm border border-gray-200">
            <h3 className="font-semibold text-gray-900 mb-4">Add Category</h3>
            <form onSubmit={addCategory} className="space-y-3">
              <input
                type="text"
                placeholder="e.g. Starters, Main Course"
                value={newCategoryName}
                onChange={e => setNewCategoryName(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-red-500 outline-none"
                required
              />
              <button type="submit" className="w-full bg-gray-900 hover:bg-gray-800 text-white py-2 rounded-lg text-sm font-medium flex items-center justify-center gap-2">
                <Plus size={16} /> Add Category
              </button>
            </form>
          </div>

          {/* Add Dish Form */}
          <div className="bg-white p-5 rounded-xl shadow-sm border border-gray-200">
            <h3 className="font-semibold text-gray-900 mb-4">Add Dish</h3>
            <form onSubmit={addDish} className="space-y-3">
              <select
                value={newDish.category_id}
                onChange={e => setNewDish({...newDish, category_id: e.target.value})}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-red-500 outline-none bg-white"
                required
              >
                <option value="">Select Category...</option>
                {categories.map(c => (
                  <option key={c.id} value={c.id}>{c.name}</option>
                ))}
              </select>
              
              <input
                type="text"
                placeholder="Dish Name (e.g. Paneer Tikka)"
                value={newDish.name}
                onChange={e => setNewDish({...newDish, name: e.target.value})}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-red-500 outline-none"
                required
              />
              
              <div className="relative">
                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500 text-sm">₹</span>
                <input
                  type="number"
                  placeholder="Price"
                  value={newDish.price}
                  onChange={e => setNewDish({...newDish, price: e.target.value})}
                  className="w-full pl-7 pr-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-red-500 outline-none"
                  required
                  min="0"
                  step="0.01"
                />
              </div>

              <button type="submit" className="w-full bg-red-600 hover:bg-red-700 text-white py-2 rounded-lg text-sm font-medium flex items-center justify-center gap-2">
                <Plus size={16} /> Add Dish
              </button>
            </form>
          </div>
          
        </div>

        {/* Right Column: Menu List */}
        <div className="md:col-span-2 space-y-4">
          {categories.length === 0 ? (
            <div className="p-8 text-center text-gray-500 bg-white border border-gray-200 border-dashed rounded-xl">
              No categories yet. Add one to get started!
            </div>
          ) : (
            categories.map(category => {
              const categoryDishes = dishes.filter(d => d.category_id === category.id)
              const isExpanded = expandedCategories[category.id]
              
              return (
                <div key={category.id} className="bg-white border border-gray-200 rounded-xl overflow-hidden shadow-sm">
                  {/* Category Header */}
                  <div 
                    className="flex items-center justify-between p-4 bg-gray-50 border-b border-gray-100 cursor-pointer hover:bg-gray-100 transition-colors"
                    onClick={() => toggleCategory(category.id)}
                  >
                    <div className="flex items-center gap-2 text-gray-800 font-bold">
                      {isExpanded ? <ChevronDown size={20} /> : <ChevronRight size={20} />}
                      {category.name}
                      <span className="bg-gray-200 text-gray-600 text-xs py-0.5 px-2 rounded-full ml-2">
                        {categoryDishes.length}
                      </span>
                    </div>
                    <button 
                      onClick={(e) => { e.stopPropagation(); deleteCategory(category.id); }}
                      className="text-gray-400 hover:text-red-500 p-1 rounded-md hover:bg-red-50 transition-colors"
                      title="Delete Category"
                    >
                      <Trash2 size={18} />
                    </button>
                  </div>
                  
                  {/* Dishes List */}
                  {isExpanded && (
                    <div className="divide-y divide-gray-100">
                      {categoryDishes.length === 0 ? (
                        <div className="p-4 text-sm text-gray-400 text-center italic">No dishes in this category</div>
                      ) : (
                        categoryDishes.map(dish => (
                          <div key={dish.id} className="flex items-center justify-between p-4 hover:bg-gray-50 transition-colors group">
                            <div className="flex items-center gap-3">
                              <GripVertical size={16} className="text-gray-300 cursor-grab" />
                              <span className="font-medium text-gray-900">{dish.name}</span>
                            </div>
                            <div className="flex items-center gap-4">
                              <span className="font-bold text-gray-700">₹{dish.price}</span>
                              <button 
                                onClick={() => deleteDish(dish.id)}
                                className="text-gray-400 hover:text-red-500 opacity-0 group-hover:opacity-100 transition-opacity p-1"
                              >
                                <Trash2 size={16} />
                              </button>
                            </div>
                          </div>
                        ))
                      )}
                    </div>
                  )}
                </div>
              )
            })
          )}
        </div>
        
      </div>
    </div>
  )
}
