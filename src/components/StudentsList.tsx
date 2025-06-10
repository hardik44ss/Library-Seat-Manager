import React, { useState } from 'react';
import { supabase, Student } from '../lib/supabase';
import { User, Mail, Phone, MapPin, Trash2, AlertCircle, Calendar } from 'lucide-react';

interface StudentsListProps {
  students: Student[];
  onUpdate: () => void;
}

export default function StudentsList({ students, onUpdate }: StudentsListProps) {
  const [isDeleting, setIsDeleting] = useState<string | null>(null);
  const [showConfirm, setShowConfirm] = useState<string | null>(null);

  const handleRemoveStudent = async (studentId: string) => {
    setIsDeleting(studentId);
    try {
      // First, free up the seat by updating its status
      const student = students.find(s => s.id === studentId);
      if (student?.seat_id) {
        await supabase
          .from('seats')
          .update({ status: 'available' })
          .eq('id', student.seat_id);
      }

      // Then delete the student
      const { error } = await supabase
        .from('students')
        .delete()
        .eq('id', studentId);

      if (error) throw error;

      onUpdate();
      setShowConfirm(null);
    } catch (error) {
      console.error('Error removing student:', error);
      alert('Failed to remove student. Please try again.');
    } finally {
      setIsDeleting(null);
    }
  };

  if (students.length === 0) {
    return (
      <div className="bg-white rounded-lg shadow-sm p-8 text-center">
        <User className="w-12 h-12 text-gray-400 mx-auto mb-4" />
        <h3 className="text-lg font-medium text-gray-900 mb-2">No Students Registered</h3>
        <p className="text-gray-600">Students will appear here once they are registered and assigned seats.</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-white rounded-lg shadow-sm p-6">
        <h2 className="text-lg font-semibold text-gray-900 mb-2">Registered Students</h2>
        <p className="text-gray-600">Total: {students.length} students</p>
      </div>

      {/* Students Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {students.map((student) => (
          <div key={student.id} className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 hover:shadow-md transition-shadow">
            <div className="flex items-start justify-between mb-4">
              <div className="flex items-center space-x-3">
                <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center">
                  <User className="w-5 h-5 text-blue-600" />
                </div>
                <div>
                  <h3 className="font-semibold text-gray-900">{student.name}</h3>
                  <p className="text-sm text-gray-500">ID: {student.student_id}</p>
                </div>
              </div>
              <button
                onClick={() => setShowConfirm(student.id)}
                className="text-gray-400 hover:text-red-500 transition-colors"
                title="Remove student"
              >
                <Trash2 className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-3">
              <div className="flex items-center space-x-2 text-sm text-gray-600">
                <Mail className="w-4 h-4" />
                <span>{student.email}</span>
              </div>
              <div className="flex items-center space-x-2 text-sm text-gray-600">
                <Phone className="w-4 h-4" />
                <span>{student.phone}</span>
              </div>
              <div className="flex items-center space-x-2 text-sm">
                <MapPin className="w-4 h-4 text-blue-500" />
                <span className="text-blue-600 font-medium">
                  {student.seat?.seat_number || 'No seat assigned'}
                </span>
              </div>
              <div className="flex items-center space-x-2 text-sm text-gray-600">
                <Calendar className="w-4 h-4" />
                <span>Started: {new Date(student.registration_date).toLocaleDateString()}</span>
              </div>
            </div>

            <div className="mt-4 pt-4 border-t border-gray-100">
              <p className="text-xs text-gray-500">
                Registered: {new Date(student.created_at).toLocaleDateString()}
              </p>
            </div>
          </div>
        ))}
      </div>

      {/* Confirmation Modal */}
      {showConfirm && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg p-6 max-w-md w-full">
            <div className="flex items-center space-x-3 mb-4">
              <AlertCircle className="w-6 h-6 text-red-500" />
              <h3 className="text-lg font-semibold text-gray-900">Confirm Removal</h3>
            </div>
            <p className="text-gray-600 mb-6">
              Are you sure you want to remove this student? This will also free up their assigned seat and cannot be undone.
            </p>
            <div className="flex space-x-3">
              <button
                onClick={() => setShowConfirm(null)}
                className="flex-1 px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={() => handleRemoveStudent(showConfirm)}
                disabled={isDeleting === showConfirm}
                className="flex-1 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors disabled:opacity-50"
              >
                {isDeleting === showConfirm ? 'Removing...' : 'Remove'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}