import React from 'react';
import { Seat, Student } from '../lib/supabase';
import { MapPin, User, Wrench } from 'lucide-react';

interface SeatingLayoutProps {
  seats: Seat[];
  students: Student[];
  onUpdate: () => void;
}

export default function SeatingLayout({ seats, students }: SeatingLayoutProps) {
  const getSeatStudent = (seatId: string) => {
    return students.find(student => student.seat_id === seatId);
  };

  const getSeatIcon = (seat: Seat) => {
    const student = getSeatStudent(seat.id);
    
    if (seat.status === 'maintenance') {
      return <Wrench className="w-4 h-4 text-gray-500" />;
    } else if (student) {
      return <User className="w-4 h-4 text-white" />;
    } else {
      return <MapPin className="w-4 h-4 text-green-600" />;
    }
  };

  const getSeatColor = (seat: Seat) => {
    const student = getSeatStudent(seat.id);
    
    if (seat.status === 'maintenance') {
      return 'bg-gray-300 text-gray-600';
    } else if (student) {
      return 'bg-blue-500 text-white';
    } else {
      return 'bg-green-100 text-green-700 hover:bg-green-200';
    }
  };

  const getSeatTooltip = (seat: Seat) => {
    const student = getSeatStudent(seat.id);
    
    if (seat.status === 'maintenance') {
      return 'Under maintenance';
    } else if (student) {
      return `Occupied by ${student.name}`;
    } else {
      return 'Available';
    }
  };

  // Group seats by section
  const seatsBySection = seats.reduce((acc, seat) => {
    if (!acc[seat.section]) acc[seat.section] = [];
    acc[seat.section].push(seat);
    return acc;
  }, {} as Record<string, Seat[]>);

  // Sort seats within each section by seat number
  Object.keys(seatsBySection).forEach(section => {
    seatsBySection[section].sort((a, b) => {
      const numA = parseInt(a.seat_number.replace(/[A-Z]/g, ''));
      const numB = parseInt(b.seat_number.replace(/[A-Z]/g, ''));
      return numA - numB;
    });
  });

  const availableCount = seats.filter(seat => seat.status === 'available' && !getSeatStudent(seat.id)).length;
  const occupiedCount = seats.filter(seat => getSeatStudent(seat.id)).length;
  const maintenanceCount = seats.filter(seat => seat.status === 'maintenance').length;

  const sectionNames = {
    left: 'Left Section (1-13)',
    front: 'Front Section (14-19)',
    right: 'Right Section (20-30)'
  };

  return (
    <div className="space-y-6">
      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-white rounded-lg shadow-sm p-6">
          <div className="flex items-center">
            <div className="flex-shrink-0">
              <MapPin className="w-8 h-8 text-green-600" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-500">Available Seats</p>
              <p className="text-2xl font-bold text-gray-900">{availableCount}</p>
            </div>
          </div>
        </div>
        
        <div className="bg-white rounded-lg shadow-sm p-6">
          <div className="flex items-center">
            <div className="flex-shrink-0">
              <User className="w-8 h-8 text-blue-600" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-500">Occupied Seats</p>
              <p className="text-2xl font-bold text-gray-900">{occupiedCount}</p>
            </div>
          </div>
        </div>
        
        <div className="bg-white rounded-lg shadow-sm p-6">
          <div className="flex items-center">
            <div className="flex-shrink-0">
              <Wrench className="w-8 h-8 text-gray-600" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-500">Maintenance</p>
              <p className="text-2xl font-bold text-gray-900">{maintenanceCount}</p>
            </div>
          </div>
        </div>
      </div>

      {/* Seating Layout */}
      <div className="bg-white rounded-lg shadow-sm p-6">
        <h2 className="text-lg font-semibold text-gray-900 mb-6">Library Seating Layout</h2>
        
        <div className="space-y-8">
          {/* Left Section */}
          {seatsBySection.left && (
            <div className="space-y-4">
              <h3 className="text-md font-medium text-gray-700">{sectionNames.left}</h3>
              <div className="grid grid-cols-4 sm:grid-cols-6 lg:grid-cols-8 gap-3">
                {seatsBySection.left.map(seat => (
                  <div
                    key={seat.id}
                    className={`relative aspect-square rounded-lg border-2 flex flex-col items-center justify-center p-2 transition-all cursor-pointer ${getSeatColor(seat)}`}
                    title={getSeatTooltip(seat)}
                  >
                    {getSeatIcon(seat)}
                    <span className="text-xs font-medium mt-1">{seat.seat_number}</span>
                    
                    {getSeatStudent(seat.id) && (
                      <div className="absolute inset-0 bg-black bg-opacity-75 rounded-lg flex items-center justify-center opacity-0 hover:opacity-100 transition-opacity">
                        <div className="text-white text-center text-xs">
                          <p className="font-medium">{getSeatStudent(seat.id)?.name}</p>
                          <p className="text-xs opacity-75">{getSeatStudent(seat.id)?.student_id}</p>
                        </div>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Front Section */}
          {seatsBySection.front && (
            <div className="space-y-4">
              <h3 className="text-md font-medium text-gray-700">{sectionNames.front}</h3>
              <div className="grid grid-cols-3 sm:grid-cols-6 gap-3 justify-center">
                {seatsBySection.front.map(seat => (
                  <div
                    key={seat.id}
                    className={`relative aspect-square rounded-lg border-2 flex flex-col items-center justify-center p-2 transition-all cursor-pointer ${getSeatColor(seat)}`}
                    title={getSeatTooltip(seat)}
                  >
                    {getSeatIcon(seat)}
                    <span className="text-xs font-medium mt-1">{seat.seat_number}</span>
                    
                    {getSeatStudent(seat.id) && (
                      <div className="absolute inset-0 bg-black bg-opacity-75 rounded-lg flex items-center justify-center opacity-0 hover:opacity-100 transition-opacity">
                        <div className="text-white text-center text-xs">
                          <p className="font-medium">{getSeatStudent(seat.id)?.name}</p>
                          <p className="text-xs opacity-75">{getSeatStudent(seat.id)?.student_id}</p>
                        </div>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Right Section */}
          {seatsBySection.right && (
            <div className="space-y-4">
              <h3 className="text-md font-medium text-gray-700">{sectionNames.right}</h3>
              <div className="grid grid-cols-4 sm:grid-cols-6 lg:grid-cols-8 gap-3">
                {seatsBySection.right.map(seat => (
                  <div
                    key={seat.id}
                    className={`relative aspect-square rounded-lg border-2 flex flex-col items-center justify-center p-2 transition-all cursor-pointer ${getSeatColor(seat)}`}
                    title={getSeatTooltip(seat)}
                  >
                    {getSeatIcon(seat)}
                    <span className="text-xs font-medium mt-1">{seat.seat_number}</span>
                    
                    {getSeatStudent(seat.id) && (
                      <div className="absolute inset-0 bg-black bg-opacity-75 rounded-lg flex items-center justify-center opacity-0 hover:opacity-100 transition-opacity">
                        <div className="text-white text-center text-xs">
                          <p className="font-medium">{getSeatStudent(seat.id)?.name}</p>
                          <p className="text-xs opacity-75">{getSeatStudent(seat.id)?.student_id}</p>
                        </div>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Legend */}
        <div className="mt-8 pt-6 border-t border-gray-200">
          <h4 className="text-sm font-medium text-gray-700 mb-3">Legend</h4>
          <div className="flex flex-wrap gap-6">
            <div className="flex items-center space-x-2">
              <div className="w-4 h-4 bg-green-100 rounded border"></div>
              <span className="text-sm text-gray-600">Available</span>
            </div>
            <div className="flex items-center space-x-2">
              <div className="w-4 h-4 bg-blue-500 rounded"></div>
              <span className="text-sm text-gray-600">Occupied</span>
            </div>
            <div className="flex items-center space-x-2">
              <div className="w-4 h-4 bg-gray-300 rounded"></div>
              <span className="text-sm text-gray-600">Maintenance</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}