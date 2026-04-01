import { createClient } from '@supabase/supabase-js'

const supabaseUrl = 'https://cqqauqynrspsqrzrdpcq.supabase.co'
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImNxcWF1cXlucnNwc3FyenJkcGNxIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzUwNTE2MTIsImV4cCI6MjA5MDYyNzYxMn0.uIEMHfMmOJZwgZrtGLkkXy53M830kqFqknXyWYDmY6E'

export const supabase = createClient(supabaseUrl, supabaseAnonKey)
