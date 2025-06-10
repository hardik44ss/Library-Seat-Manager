import React, { useState } from 'react';
import { supabase, Fee, Student } from '../lib/supabase';
import { DollarSign, Calendar, User, Check, AlertCircle, Clock, Plus } from 'lucide-react';

interface FeesManagementProps {
  fees: Fee[];
  students: Student[];
  onUpdate: () => void;
}

export default function FeesManagement({ fees, students, onUpdate }: FeesManagementProps) {
  const [selectedFilter, setSelectedFilter] = useState<'all' | 'pending' | 'paid' | 'overdue'>('all');
  const [isProcessing, setIsProcessing] = useState<string | null>(null);
  const [showAddFee, setShowAddFee] = useState(false);
  const [newFee, setNewFee] = useState({
    student_id: '',
    amount: '',
    fee_type: 'monthly' as 'registration' | 'monthly' | 'penalty',
    due_date: '',
  });

  const markAsPaid = async (feeId: string) => {
    setIsProcessing(feeId);
    try {
      const { error } = await supabase
        .from('fees')
        .update({
          status: 'paid',
          paid_date: new Date().toISOString().split('T')[0],
        })
        .eq('id', feeId);

      if (error) throw error;
      onUpdate();
    } catch (error) {
      console.error('Error updating fee:', error);
      alert('Failed to update fee status. Please try again.');
    } finally {
      setIsProcessing(null);
    }
  };

  const addNewFee = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newFee.student_id || !newFee.amount || !newFee.due_date) return;

    try {
      const { error } = await supabase
        .from('fees')
        .insert([{
          student_id: newFee.student_id,
          amount: parseFloat(newFee.amount),
          fee_type: newFee.fee_type,
          due_date: newFee.due_date,
          status: 'pending',
        }]);

      if (error) throw error;

      setNewFee({
        student_id: '',
        amount: '',
        fee_type: 'monthly',
        due_date: '',
      });
      setShowAddFee(false);
      onUpdate();
    } catch (error) {
      console.error('Error adding fee:', error);
      alert('Failed to add fee. Please try again.');
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'paid': return 'text-green-600 bg-green-100';
      case 'overdue': return 'text-red-600 bg-red-100';
      default: return 'text-yellow-600 bg-yellow-100';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'paid': return <Check className="w-4 h-4" />;
      case 'overdue': return <AlertCircle className="w-4 h-4" />;
      default: return <Clock className="w-4 h-4" />;
    }
  };

  const filteredFees = fees.filter(fee => {
    if (selectedFilter === 'all') return true;
    return fee.status === selectedFilter;
  });

  const totalAmount = filteredFees.reduce((sum, fee) => sum + fee.amount, 0);
  const paidAmount = fees.filter(f => f.status === 'paid').reduce((sum, fee) => sum + fee.amount, 0);
  const pendingAmount = fees.filter(f => f.status === 'pending').reduce((sum, fee) => sum + fee.amount, 0);
  const overdueAmount = fees.filter(f => f.status === 'overdue').reduce((sum, fee) => sum + fee.amount, 0);

  return (
    <div className="space-y-6">
      {/* Summary Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <div className="bg-white rounded-lg shadow-sm p-6">
          <div className="flex items-center">
            <DollarSign className="w-8 h-8 text-blue-600" />
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-500">Total Fees</p>
              <p className="text-2xl font-bold text-gray-900">${totalAmount.toFixed(2)}</p>
            </div>
          </div>
        </div>
        
        <div className="bg-white rounded-lg shadow-sm p-6">
          <div className="flex items-center">
            <Check className="w-8 h-8 text-green-600" />
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-500">Paid</p>
              <p className="text-2xl font-bold text-green-600">${paidAmount.toFixed(2)}</p>
            </div>
          </div>
        </div>
        
        <div className="bg-white rounded-lg shadow-sm p-6">
          <div className="flex items-center">
            <Clock className="w-8 h-8 text-yellow-600" />
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-500">Pending</p>
              <p className="text-2xl font-bold text-yellow-600">${pendingAmount.toFixed(2)}</p>
            </div>
          </div>
        </div>
        
        <div className="bg-white rounded-lg shadow-sm p-6">
          <div className="flex items-center">
            <AlertCircle className="w-8 h-8 text-red-600" />
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-500">Overdue</p>
              <p className="text-2xl font-bold text-red-600">${overdueAmount.toFixed(2)}</p>
            </div>
          </div>
        </div>
      </div>

      {/* Controls */}
      <div className="bg-white rounded-lg shadow-sm p-6">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center space-y-4 sm:space-y-0">
          <div>
            <h2 className="text-lg font-semibold text-gray-900">Fee Management</h2>
            <p className="text-gray-600">Track and manage student fees</p>
          </div>
          
          <div className="flex flex-col sm:flex-row space-y-2 sm:space-y-0 sm:space-x-4">
            <select
              value={selectedFilter}
              onChange={(e) => setSelectedFilter(e.target.value as any)}
              className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            >
              <option value="all">All Fees</option>
              <option value="pending">Pending</option>
              <option value="paid">Paid</option>
              <option value="overdue">Overdue</option>
            </select>
            
            <button
              onClick={() => setShowAddFee(true)}
              className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors flex items-center space-x-2"
            >
              <Plus className="w-4 h-4" />
              <span>Add Fee</span>
            </button>
          </div>
        </div>
      </div>

      {/* Fees List */}
      {filteredFees.length === 0 ? (
        <div className="bg-white rounded-lg shadow-sm p-8 text-center">
          <DollarSign className="w-12 h-12 text-gray-400 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-gray-900 mb-2">No Fees Found</h3>
          <p className="text-gray-600">No fees match the selected filter.</p>
        </div>
      ) : (
        <div className="bg-white rounded-lg shadow-sm overflow-hidden">
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Student
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Fee Type
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Amount
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Due Date
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Status
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {filteredFees.map((fee) => (
                  <tr key={fee.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center">
                        <User className="w-5 h-5 text-gray-400 mr-3" />
                        <div>
                          <div className="text-sm font-medium text-gray-900">
                            {fee.student?.name || 'Unknown Student'}
                          </div>
                          <div className="text-sm text-gray-500">
                            {fee.student?.student_id}
                          </div>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800 capitalize">
                        {fee.fee_type}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                      ${fee.amount.toFixed(2)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      <div className="flex items-center">
                        <Calendar className="w-4 h-4 text-gray-400 mr-2" />
                        {new Date(fee.due_date).toLocaleDateString()}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getStatusColor(fee.status)}`}>
                        {getStatusIcon(fee.status)}
                        <span className="ml-1 capitalize">{fee.status}</span>
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                      {fee.status === 'pending' ? (
                        <button
                          onClick={() => markAsPaid(fee.id)}
                          disabled={isProcessing === fee.id}
                          className="text-green-600 hover:text-green-900 disabled:opacity-50"
                        >
                          {isProcessing === fee.id ? 'Processing...' : 'Mark as Paid'}
                        </button>
                      ) : fee.status === 'paid' ? (
                        <span className="text-gray-400">
                          Paid on {fee.paid_date ? new Date(fee.paid_date).toLocaleDateString() : 'N/A'}
                        </span>
                      ) : (
                        <button
                          onClick={() => markAsPaid(fee.id)}
                          disabled={isProcessing === fee.id}
                          className="text-green-600 hover:text-green-900 disabled:opacity-50"
                        >
                          {isProcessing === fee.id ? 'Processing...' : 'Mark as Paid'}
                        </button>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Add Fee Modal */}
      {showAddFee && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg p-6 max-w-md w-full">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Add New Fee</h3>
            
            <form onSubmit={addNewFee} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Student</label>
                <select
                  value={newFee.student_id}
                  onChange={(e) => setNewFee(prev => ({ ...prev, student_id: e.target.value }))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  required
                >
                  <option value="">Select student...</option>
                  {students.map(student => (
                    <option key={student.id} value={student.id}>
                      {student.name} ({student.student_id})
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Fee Type</label>
                <select
                  value={newFee.fee_type}
                  onChange={(e) => setNewFee(prev => ({ ...prev, fee_type: e.target.value as any }))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                >
                  <option value="monthly">Monthly</option>
                  <option value="registration">Registration</option>
                  <option value="penalty">Penalty</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Amount</label>
                <input
                  type="number"
                  step="0.01"
                  min="0"
                  value={newFee.amount}
                  onChange={(e) => setNewFee(prev => ({ ...prev, amount: e.target.value }))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="0.00"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Due Date</label>
                <input
                  type="date"
                  value={newFee.due_date}
                  onChange={(e) => setNewFee(prev => ({ ...prev, due_date: e.target.value }))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  required
                />
              </div>

              <div className="flex space-x-3 pt-4">
                <button
                  type="button"
                  onClick={() => setShowAddFee(false)}
                  className="flex-1 px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                >
                  Add Fee
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}