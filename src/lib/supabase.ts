import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error('Missing Supabase environment variables');
}

export const supabase = createClient(supabaseUrl, supabaseAnonKey);

// Types
export interface Seat {
  id: string;
  seat_number: string;
  section: 'left' | 'front' | 'right';
  status: 'available' | 'occupied' | 'maintenance';
  created_at: string;
  updated_at: string;
}

export interface Student {
  id: string;
  name: string;
  email: string;
  phone: string;
  student_id: string;
  seat_id: string | null;
  registration_date: string;
  created_at: string;
  updated_at: string;
  seat?: Seat;
}

export interface Fee {
  id: string;
  student_id: string;
  amount: number;
  amount_paid: number;
  fee_type: 'monthly' | 'penalty';
  due_date: string;
  paid_date: string | null;
  status: 'pending' | 'partial' | 'paid' | 'overdue';
  created_at: string;
  updated_at: string;
  student?: Student;
}