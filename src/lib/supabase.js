import { createClient } from '@supabase/supabase-js'

const supabaseUrl = 'https://nifzdnjbphgxsxpfowhf.supabase.co'
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im5pZnpkbmpicGhneHN4cGZvd2hmIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODQ4OTA2OTEsImV4cCI6MjEwMDQ2NjY5MX0._OcVoYoc-T415O-S6w2xn0dwfdxWyGXFGpGhJQJoOJc'

export const supabase = createClient(supabaseUrl, supabaseKey)

// Hardcoded for prototype
export const RESTAURANT_ID = '00000000-0000-0000-0000-000000000001'
