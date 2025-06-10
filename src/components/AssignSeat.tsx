import React, { useState } from 'react';
import { supabase, Seat } from '../lib/supabase';
import { UserPlus, MapPin, User, Mail, Phone, CreditCard, DollarSign, Calendar } from 'lucide-react';

interface AssignSeatProps {
  seats: Seat[];
  onUpdate: () => void;
}

export default function AssignSeat({ seats, onUpdate }: AssignSeatProps) {
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: '',
    student_id: '',
    seat_id: '',
    registration_date: new Date().toISOString().split('T')[0],
    monthly_fee: '1000',
    amount_paid: '0',
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});

  const availableSeats = seats.filter(seat => seat.status === 'available');

  const validateForm = () => {
    const newErrors: Record<string, string> = {};

    if (!formData.name.trim()) newErrors.name = 'Name is required';
    if (!formData.email.trim()) newErrors.email = 'Email is required';
    if (!formData.phone.trim()) newErrors.phone = 'Phone is required';
    if (!formData.student_id.trim()) newErrors.student_id = 'Student ID is required';
    if (!formData.seat_id) newErrors.seat_id = 'Please select a seat';
    if (!formData.registration_date) newErrors.registration_date = 'Registration date is required';
    if (!formData.monthly_fee || parseFloat(formData.monthly_fee) <= 0) {
      newErrors.monthly_fee = 'Monthly fee must be greater than 0';
    }
    if (parseFloat(formData.amount_paid) < 0) {
      newErrors.amount_paid = 'Amount paid cannot be negative';
    }
    if (parseFloat(formData.amount_paid) > parseFloat(formData.monthly_fee)) {
      newErrors.amount_paid = 'Amount paid cannot exceed monthly fee';
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (formData.email && !emailRegex.test(formData.email)) {
      newErrors.email = 'Please enter a valid email address';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validateForm()) return;

    setIsSubmitting(true);
    try {
      // Create student
      const { data: studentData, error: studentError } = await supabase
        .from('students')
        .insert([{
          name: formData.name.trim(),
          email: formData.email.trim().toLowerCase(),
          phone: formData.phone.trim(),
          student_id: formData.student_id.trim(),
          seat_id: formData.seat_id,
          registration_date: formData.registration_date,
        }])
        .select()
        .single();

      if (studentError) throw studentError;

      // Update seat status
      const { error: seatError } = await supabase
        .from('seats')
        .update({ status: 'occupied' })
        .eq('id', formData.seat_id);

      if (seatError) throw seatError;

      // Create monthly fee if amount is specified
      if (parseFloat(formData.monthly_fee) > 0) {
        const monthlyDue = new Date(formData.registration_date);
        monthlyDue.setMonth(monthlyDue.getMonth() + 1);

        const amountPaid = parseFloat(formData.amount_paid);
        const totalAmount = parseFloat(formData.monthly_fee);
        
        let status = 'pending';
        if (amountPaid >= totalAmount) {
          status = 'paid';
        } else if (amountPaid > 0) {
          status = 'partial';
        }

        const { error: monthlyFeeError } = await supabase
          .from('fees')
          .insert([{
            student_id: studentData.id,
            amount: totalAmount,
            amount_paid: amountPaid,
            fee_type: 'monthly',
            due_date: monthlyDue.toISOString().split('T')[0],
            status: status,
            paid_date: status === 'paid' ? new Date().toISOString().split('T')[0] : null,
          }]);

        if (monthlyFeeError) throw monthlyFeeError;
      }

      // Reset form
      setFormData({
        name: '',
        email: '',
        phone: '',
        student_id: '',
        seat_id: '',
        registration_date: new Date().toISOString().split('T')[0],
        monthly_fee: '1000',
        amount_paid: '0',
      });
      setErrors({});
      onUpdate();
      
      alert('Student successfully registered and seat assigned!');
    } catch (error: any) {
      console.error('Error assigning seat:', error);
      if (error.code === '23505') {
        if (error.message.includes('email')) {
          setErrors({ email: 'This email is already registered' });
        } else if (error.message.includes('student_id')) {
          setErrors({ student_id: 'This student ID is already registered' });
        }
      } else {
        alert('Failed to assign seat. Please try again.');
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleInputChange = (field: string, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    if (errors[field]) {
      setErrors(prev => ({ ...prev, [field]: '' }));
    }
  };

  if (availableSeats.length === 0) {
    return (
      <div className="bg-white rounded-lg shadow-sm p-8 text-center">
        <MapPin className="w-12 h-12 text-gray-400 mx-auto mb-4" />
        <h3 className="text-lg font-medium text-gray-900 mb-2">No Available Seats</h3>
        <p className="text-gray-600">All seats are currently occupied or under maintenance.</p>
      </div>
    );
  }

  return (
    <div className="max-w-2xl mx-auto">
      <div className="bg-white rounded-lg shadow-sm p-8">
        <div className="flex items-center space-x-3 mb-6">
          <UserPlus className="w-6 h-6 text-blue-600" />
          <h2 className="text-xl font-semibold text-gray-900">Register New Student</h2>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Personal Information */}
          <div className="space-y-4">
            <h3 className="text-lg font-medium text-gray-900 flex items-center space-x-2">
              <User className="w-5 h-5" />
              <span>Personal Information</span>
            </h3>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label htmlFor="name" className="block text-sm font-medium text-gray-700 mb-1">
                  Full Name *
                </label>
                <input
                  id="name"
                  type="text"
                  value={formData.name}
                  onChange={(e) => handleInputChange('name', e.target.value)}
                  className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent ${
                    errors.name ? 'border-red-300' : 'border-gray-300'
                  }`}
                  placeholder="Enter student's full name"
                />
                {errors.name && <p className="text-red-500 text-sm mt-1">{errors.name}</p>}
              </div>

              <div>
                <label htmlFor="student_id" className="block text-sm font-medium text-gray-700 mb-1">
                  Student ID *
                </label>
                <input
                  id="student_id"
                  type="text"
                  value={formData.student_id}
                  onChange={(e) => handleInputChange('student_id', e.target.value)}
                  className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent ${
                    errors.student_id ? 'border-red-300' : 'border-gray-300'
                  }`}
                  placeholder="e.g., STU001"
                />
                {errors.student_id && <p className="text-red-500 text-sm mt-1">{errors.student_id}</p>}
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-1">
                  Email Address *
                </label>
                <div className="relative">
                  <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
                  <input
                    id="email"
                    type="email"
                    value={formData.email}
                    onChange={(e) => handleInputChange('email', e.target.value)}
                    className={`w-full pl-10 pr-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent ${
                      errors.email ? 'border-red-300' : 'border-gray-300'
                    }`}
                    placeholder="student@email.com"
                  />
                </div>
                {errors.email && <p className="text-red-500 text-sm mt-1">{errors.email}</p>}
              </div>

              <div>
                <label htmlFor="phone" className="block text-sm font-medium text-gray-700 mb-1">
                  Phone Number *
                </label>
                <div className="relative">
                  <Phone className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
                  <input
                    id="phone"
                    type="tel"
                    value={formData.phone}
                    onChange={(e) => handleInputChange('phone', e.target.value)}
                    className={`w-full pl-10 pr-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent ${
                      errors.phone ? 'border-red-300' : 'border-gray-300'
                    }`}
                    placeholder="+1 (555) 123-4567"
                  />
                </div>
                {errors.phone && <p className="text-red-500 text-sm mt-1">{errors.phone}</p>}
              </div>
            </div>
          </div>

          {/* Registration Date */}
          <div className="space-y-4">
            <h3 className="text-lg font-medium text-gray-900 flex items-center space-x-2">
              <Calendar className="w-5 h-5" />
              <span>Registration Details</span>
            </h3>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label htmlFor="registration_date" className="block text-sm font-medium text-gray-700 mb-1">
                  Registration Start Date *
                </label>
                <input
                  id="registration_date"
                  type="date"
                  value={formData.registration_date}
                  onChange={(e) => handleInputChange('registration_date', e.target.value)}
                  className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent ${
                    errors.registration_date ? 'border-red-300' : 'border-gray-300'
                  }`}
                />
                {errors.registration_date && <p className="text-red-500 text-sm mt-1">{errors.registration_date}</p>}
              </div>

              <div>
                <label htmlFor="seat_id" className="block text-sm font-medium text-gray-700 mb-1">
                  Select Available Seat *
                </label>
                <select
                  id="seat_id"
                  value={formData.seat_id}
                  onChange={(e) => handleInputChange('seat_id', e.target.value)}
                  className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent ${
                    errors.seat_id ? 'border-red-300' : 'border-gray-300'
                  }`}
                >
                  <option value="">Choose a seat...</option>
                  {availableSeats.map((seat) => (
                    <option key={seat.id} value={seat.id}>
                      {seat.seat_number} ({seat.section} section)
                    </option>
                  ))}
                </select>
                {errors.seat_id && <p className="text-red-500 text-sm mt-1">{errors.seat_id}</p>}
                <p className="text-sm text-gray-500 mt-1">
                  {availableSeats.length} seat{availableSeats.length !== 1 ? 's' : ''} available
                </p>
              </div>
            </div>
          </div>

          {/* Fee Configuration */}
          <div className="space-y-4">
            <h3 className="text-lg font-medium text-gray-900 flex items-center space-x-2">
              <DollarSign className="w-5 h-5" />
              <span>Fee Structure</span>
            </h3>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label htmlFor="monthly_fee" className="block text-sm font-medium text-gray-700 mb-1">
                  Monthly Fee Amount *
                </label>
                <div className="relative">
                  <DollarSign className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
                  <input
                    id="monthly_fee"
                    type="number"
                    step="0.01"
                    min="0"
                    value={formData.monthly_fee}
                    onChange={(e) => handleInputChange('monthly_fee', e.target.value)}
                    className={`w-full pl-10 pr-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent ${
                      errors.monthly_fee ? 'border-red-300' : 'border-gray-300'
                    }`}
                    placeholder="1000.00"
                  />
                </div>
                {errors.monthly_fee && <p className="text-red-500 text-sm mt-1">{errors.monthly_fee}</p>}
                <p className="text-sm text-gray-500 mt-1">Due monthly</p>
              </div>

              <div>
                <label htmlFor="amount_paid" className="block text-sm font-medium text-gray-700 mb-1">
                  Amount Already Paid
                </label>
                <div className="relative">
                  <DollarSign className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
                  <input
                    id="amount_paid"
                    type="number"
                    step="0.01"
                    min="0"
                    max={formData.monthly_fee}
                    value={formData.amount_paid}
                    onChange={(e) => handleInputChange('amount_paid', e.target.value)}
                    className={`w-full pl-10 pr-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent ${
                      errors.amount_paid ? 'border-red-300' : 'border-gray-300'
                    }`}
                    placeholder="0.00"
                  />
                </div>
                {errors.amount_paid && <p className="text-red-500 text-sm mt-1">{errors.amount_paid}</p>}
                <p className="text-sm text-gray-500 mt-1">
                  {parseFloat(formData.amount_paid) === 0 ? 'Unpaid' : 
                   parseFloat(formData.amount_paid) >= parseFloat(formData.monthly_fee) ? 'Fully paid' : 
                   'Partially paid'}
                </p>
              </div>
            </div>
          </div>

          <div className="flex space-x-4">
            <button
              type="button"
              onClick={() => {
                setFormData({
                  name: '',
                  email: '',
                  phone: '',
                  student_id: '',
                  seat_id: '',
                  registration_date: new Date().toISOString().split('T')[0],
                  monthly_fee: '1000',
                  amount_paid: '0',
                });
                setErrors({});
              }}
              className="flex-1 px-4 py-3 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
            >
              Clear Form
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="flex-1 px-4 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center space-x-2"
            >
              {isSubmitting ? (
                <>
                  <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
                  <span>Assigning...</span>
                </>
              ) : (
                <>
                  <CreditCard className="w-5 h-5" />
                  <span>Assign Seat & Register</span>
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}