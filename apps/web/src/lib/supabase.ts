// Supabase Client Configuration
// This file creates a connection to your Supabase database

import { createClient } from '@supabase/supabase-js'

// Get your credentials from environment variables
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!

// Create the Supabase client
// This is what your app uses to talk to the database
export const supabase = createClient(supabaseUrl, supabaseAnonKey)

// Types for your database tables
export interface FavoritePlayer {
  id: number
  user_id: string
  player_id: string
  player_name: string
  team: string
  created_at: string
}

export interface FavoriteTeam {
  id: number
  user_id: string
  team_id: string
  team_name: string
  created_at: string
}

export interface UserProfile {
  id: string
  email: string
  created_at: string
}

