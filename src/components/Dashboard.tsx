import React, { useState, useEffect } from 'react';
import { supabase, Seat, Student, Fee } from '../lib/supabase';
import { LogOut, Users, MapPin, DollarSign, CreditCard } from 'lucide-react';
import SeatingLayout from './SeatingLayout';
import StudentsList from './StudentsList';
import AssignSeat from './AssignSeat';
import FeesManagement from './FeesManagement';

interface DashboardProps {
  onLogout: () => void;
}

type TabType = 'seating' | 'students' | 'assign' | 'fees';

export default function Dashboard({ onLogout }: DashboardProps) {
  const [activeTab, setActiveTab] = useState<TabType>('seating');
  const [seats, setSeats] = useState<Seat[]>([]);
  const [students, setStudents] = useState<Student[]>([]);
  const [fees, setFees] = useState<Fee[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    setIsLoading(true);
    try {
      // Load seats
      const { data: seatsData } = await supabase
        .from('seats')
        .select('*')
        .order('seat_number');

      // Load students with seat information
      const { data: studentsData } = await supabase
        .from('students')
        .select(`
          *,
          seat:seats(*)
        `)
        .order('name');

      // Load fees with student information
      const { data: feesData } = await supabase
        .from('fees')
        .select(`
          *,
          student:students(*)
        `)
        .order('due_date', { ascending: false });

      setSeats(seatsData || []);
      setStudents(studentsData || []);
      setFees(feesData || []);
    } catch (error) {
      console.error('Error loading data:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleLogout = async () => {
    await supabase.auth.signOut();
    onLogout();
  };

  const tabs = [
    { id: 'seating' as TabType, label: 'Seating Layout', icon: MapPin },
    { id: 'students' as TabType, label: 'Students', icon: Users },
    { id: 'assign' as TabType, label: 'Assign Seat', icon: CreditCard },
    { id: 'fees' as TabType, label: 'Fees', icon: DollarSign },
  ];

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading dashboard...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div>
              <h1 className="text-2xl font-bold text-gray-900">श्री श्याम लाइब्रेरी</h1>
              <p className="text-sm text-gray-600">Admin Dashboard</p>
            </div>
            <button
              onClick={handleLogout}
              className="flex items-center space-x-2 text-gray-700 hover:text-red-600 transition-colors"
            >
              <LogOut className="w-5 h-5" />
              <span>Logout</span>
            </button>
          </div>
        </div>
      </header>

      {/* Navigation Tabs */}
      <nav className="bg-white border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex space-x-8">
            {tabs.map((tab) => {
              const Icon = tab.icon;
              return (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`flex items-center space-x-2 py-4 px-1 border-b-2 font-medium text-sm transition-colors ${
                    activeTab === tab.id
                      ? 'border-blue-500 text-blue-600'
                      : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                  }`}
                >
                  <Icon className="w-5 h-5" />
                  <span>{tab.label}</span>
                </button>
              );
            })}
          </div>
        </div>
      </nav>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {activeTab === 'seating' && (
          <SeatingLayout seats={seats} students={students} onUpdate={loadData} />
        )}
        {activeTab === 'students' && (
          <StudentsList students={students} onUpdate={loadData} />
        )}
        {activeTab === 'assign' && (
          <AssignSeat seats={seats} onUpdate={loadData} />
        )}
        {activeTab === 'fees' && (
          <FeesManagement fees={fees} students={students} onUpdate={loadData} />
        )}
      </main>
    </div>
  );
}