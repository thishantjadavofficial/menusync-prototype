import { createClient } from '@supabase/supabase-js'

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || 'https://nifzdnjbphgxsxpfowhf.supabase.co'
const supabaseKey = import.meta.env.VITE_SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im5pZnpkbmpicGhneHN4cGZvd2hmIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODQ4OTA2OTEsImV4cCI6MjEwMDQ2NjY5MX0._OcVoYoc-T415O-S6w2xn0dwfdxWyGXFGpGhJQJoOJc'

export const supabase = createClient(supabaseUrl, supabaseKey)

// In-memory fallback if localStorage is completely blocked
let memorySessionId = null;

// Generate or retrieve the Restaurant ID for this specific device session
export function getRestaurantId() {
  if (memorySessionId) return memorySessionId;
  
  const STORAGE_KEY = 'menusync_restaurant_id'
  let id = null;
  
  try {
    id = window.localStorage.getItem(STORAGE_KEY)
  } catch (e) {
    console.warn("localStorage access denied, using memory session.")
  }
  
  if (!id) {
    // Fallback UUID v4 generator
    const generateUUID = () => {
      if (typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function') {
        return crypto.randomUUID()
      }
      return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function(c) {
        const r = Math.random() * 16 | 0
        const v = c === 'x' ? r : (r & 0x3 | 0x8)
        return v.toString(16)
      })
    }
    
    id = generateUUID()
    
    try {
      window.localStorage.setItem(STORAGE_KEY, id)
    } catch (e) {
      console.warn("localStorage write denied.")
    }
  }
  
  memorySessionId = id;
  return id;
}
