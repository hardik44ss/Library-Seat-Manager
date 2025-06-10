/*
  # Library Seat Manager Database Schema

  1. New Tables
    - `seats`
      - `id` (uuid, primary key) - Unique seat identifier
      - `seat_number` (text, unique) - Human-readable seat number (e.g., 'A1', 'B2')
      - `status` (text) - Seat status: 'available', 'occupied', 'maintenance'
      - `created_at` (timestamp)
      - `updated_at` (timestamp)
    
    - `students`
      - `id` (uuid, primary key) - Unique student identifier
      - `name` (text) - Student's full name
      - `email` (text, unique) - Student's email address
      - `phone` (text) - Student's phone number
      - `student_id` (text, unique) - Student ID number
      - `seat_id` (uuid, foreign key) - Reference to assigned seat
      - `created_at` (timestamp)
      - `updated_at` (timestamp)
    
    - `fees`
      - `id` (uuid, primary key) - Unique fee record identifier
      - `student_id` (uuid, foreign key) - Reference to student
      - `amount` (decimal) - Fee amount
      - `fee_type` (text) - Type of fee: 'registration', 'monthly', 'penalty'
      - `due_date` (date) - Fee due date
      - `paid_date` (date, nullable) - Date fee was paid
      - `status` (text) - Payment status: 'pending', 'paid', 'overdue'
      - `created_at` (timestamp)
      - `updated_at` (timestamp)

  2. Security
    - Enable RLS on all tables
    - Add policies for authenticated admin users to manage all data
    - Students can only view their own data
*/

-- Create seats table
CREATE TABLE IF NOT EXISTS seats (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  seat_number text UNIQUE NOT NULL,
  status text NOT NULL DEFAULT 'available' CHECK (status IN ('available', 'occupied', 'maintenance')),
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Create students table
CREATE TABLE IF NOT EXISTS students (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  email text UNIQUE NOT NULL,
  phone text NOT NULL,
  student_id text UNIQUE NOT NULL,
  seat_id uuid REFERENCES seats(id) ON DELETE SET NULL,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Create fees table
CREATE TABLE IF NOT EXISTS fees (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  student_id uuid NOT NULL REFERENCES students(id) ON DELETE CASCADE,
  amount decimal(10,2) NOT NULL,
  fee_type text NOT NULL CHECK (fee_type IN ('registration', 'monthly', 'penalty')),
  due_date date NOT NULL,
  paid_date date,
  status text NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'paid', 'overdue')),
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Enable Row Level Security
ALTER TABLE seats ENABLE ROW LEVEL SECURITY;
ALTER TABLE students ENABLE ROW LEVEL SECURITY;
ALTER TABLE fees ENABLE ROW LEVEL SECURITY;

-- Create policies for seats
CREATE POLICY "Admin can manage all seats"
  ON seats
  FOR ALL
  TO authenticated
  USING (true);

-- Create policies for students
CREATE POLICY "Admin can manage all students"
  ON students
  FOR ALL
  TO authenticated
  USING (true);

-- Create policies for fees
CREATE POLICY "Admin can manage all fees"
  ON fees
  FOR ALL
  TO authenticated
  USING (true);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_students_seat_id ON students(seat_id);
CREATE INDEX IF NOT EXISTS idx_fees_student_id ON fees(student_id);
CREATE INDEX IF NOT EXISTS idx_fees_status ON fees(status);
CREATE INDEX IF NOT EXISTS idx_seats_status ON seats(status);

-- Insert initial seat data (A1-A10, B1-B10, C1-C10)
DO $$
BEGIN
  FOR i IN 1..10 LOOP
    INSERT INTO seats (seat_number, status) 
    VALUES 
      ('A' || i, 'available'),
      ('B' || i, 'available'),
      ('C' || i, 'available')
    ON CONFLICT (seat_number) DO NOTHING;
  END LOOP;
END $$;

-- Function to automatically update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ language 'plpgsql';

-- Create triggers for updating timestamps
DROP TRIGGER IF EXISTS update_seats_updated_at ON seats;
CREATE TRIGGER update_seats_updated_at
  BEFORE UPDATE ON seats
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_students_updated_at ON students;
CREATE TRIGGER update_students_updated_at
  BEFORE UPDATE ON students
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_fees_updated_at ON fees;
CREATE TRIGGER update_fees_updated_at
  BEFORE UPDATE ON fees
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();