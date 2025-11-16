'use client';

import { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import Link from 'next/link';
import { useQuery } from '@tanstack/react-query';
import { Tractor, MapPin, Clock, Star, Calendar, TrendingUp, Search, Filter, Plus } from 'lucide-react';

// Mock data for demonstration
const recentBookings = [
  {
    id: '1',
    vehicleName: 'Mahindra 585 DI',
    ownerName: 'Ramesh Kumar',
    status: 'confirmed',
    startTime: '2024-01-15T09:00:00Z',
    endTime: '2024-01-15T17:00:00Z',
    totalAmount: 6400,
    location: 'Village Rampur, District Mainpuri'
  },
  {
    id: '2',
    vehicleName: 'Swaraj 744 FE',
    ownerName: 'Vikram Singh',
    status: 'completed',
    startTime: '2024-01-10T08:00:00Z',
    endTime: '2024-01-10T16:00:00Z',
    totalAmount: 9600,
    location: 'Village Chandpur, District Etah'
  }
];

const availableVehicles = [
  {
    id: '1',
    name: 'Mahindra 585 DI',
    type: 'Tractor',
    ownerName: 'Ramesh Kumar',
    rating: 4.5,
    hourlyRate: 800,
    distance: '5 km',
    available: true,
    photo: '/api/placeholder/150/100'
  },
  {
    id: '2',
    name: 'Swaraj 744 FE',
    type: 'Tractor with Implements',
    ownerName: 'Vikram Singh',
    rating: 4.8,
    hourlyRate: 1200,
    distance: '8 km',
    available: true,
    photo: '/api/placeholder/150/100'
  },
  {
    id: '3',
    name: 'John Deere 5050D',
    type: 'Tractor',
    ownerName: 'Anil Sharma',
    rating: 4.3,
    hourlyRate: 1000,
    distance: '12 km',
    available: false,
    photo: '/api/placeholder/150/100'
  }
];

export default function FarmerDashboard() {
  const { t } = useTranslation();
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedFilter, setSelectedFilter] = useState('all');

  const stats = {
    totalBookings: 12,
    completedBookings: 8,
    pendingBookings: 2,
    totalSpent: 45600,
    averageRating: 4.6
  };

  const filters = [
    { value: 'all', label: t('filters.all', 'All Vehicles') },
    { value: 'available', label: t('filters.available', 'Available Now') },
    { value: 'tractor', label: t('filters.tractor', 'Tractors Only') },
    { value: 'implements', label: t('filters.implements', 'With Implements') }
  ];

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'confirmed': return 'text-green-600 bg-green-100';
      case 'in_progress': return 'text-blue-600 bg-blue-100';
      case 'completed': return 'text-gray-600 bg-gray-100';
      case 'cancelled': return 'text-red-600 bg-red-100';
      default: return 'text-gray-600 bg-gray-100';
    }
  };

  const filteredVehicles = availableVehicles.filter(vehicle => {
    const matchesSearch = vehicle.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         vehicle.ownerName.toLowerCase().includes(searchTerm.toLowerCase());

    const matchesFilter = selectedFilter === 'all' ||
                        (selectedFilter === 'available' && vehicle.available) ||
                        (selectedFilter === 'tractor' && !vehicle.type.includes('Implements')) ||
                        (selectedFilter === 'implements' && vehicle.type.includes('Implements'));

    return matchesSearch && matchesFilter;
  });

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      <div className="container-custom py-8">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 dark:text-gray-100 mb-2">
            {t('farmer.dashboard.title', 'Farmer Dashboard')}
          </h1>
          <p className="text-gray-600 dark:text-gray-400">
            {t('farmer.dashboard.subtitle', 'Manage your bookings and find equipment for your farm')}
          </p>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-6 mb-8">
          <div className="card p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600 dark:text-gray-400">
                  {t('stats.totalBookings', 'Total Bookings')}
                </p>
                <p className="text-2xl font-bold text-gray-900 dark:text-gray-100">
                  {stats.totalBookings}
                </p>
              </div>
              <Calendar className="w-8 h-8 text-green-600 opacity-20" />
            </div>
          </div>

          <div className="card p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600 dark:text-gray-400">
                  {t('stats.completed', 'Completed')}
                </p>
                <p className="text-2xl font-bold text-gray-900 dark:text-gray-100">
                  {stats.completedBookings}
                </p>
              </div>
              <TrendingUp className="w-8 h-8 text-blue-600 opacity-20" />
            </div>
          </div>

          <div className="card p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600 dark:text-gray-400">
                  {t('stats.pending', 'Pending')}
                </p>
                <p className="text-2xl font-bold text-gray-900 dark:text-gray-100">
                  {stats.pendingBookings}
                </p>
              </div>
              <Clock className="w-8 h-8 text-orange-600 opacity-20" />
            </div>
          </div>

          <div className="card p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600 dark:text-gray-400">
                  {t('stats.totalSpent', 'Total Spent')}
                </p>
                <p className="text-2xl font-bold text-gray-900 dark:text-gray-100">
                  ₹{stats.totalSpent.toLocaleString()}
                </p>
              </div>
              <TrendingUp className="w-8 h-8 text-purple-600 opacity-20" />
            </div>
          </div>

          <div className="card p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600 dark:text-gray-400">
                  {t('stats.avgRating', 'Avg Rating')}
                </p>
                <div className="flex items-center">
                  <Star className="w-5 h-5 text-yellow-500 fill-current" />
                  <p className="text-2xl font-bold text-gray-900 dark:text-gray-100 ml-1">
                    {stats.averageRating}
                  </p>
                </div>
              </div>
              <Star className="w-8 h-8 text-yellow-600 opacity-20" />
            </div>
          </div>
        </div>

        {/* Main Content */}
        <div className="grid lg:grid-cols-2 gap-8">
          {/* Recent Bookings */}
          <div>
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-xl font-semibold text-gray-900 dark:text-gray-100">
                {t('farmer.recentBookings', 'Recent Bookings')}
              </h2>
              <Link
                href="/bookings"
                className="text-green-600 hover:text-green-700 text-sm font-medium"
              >
                {t('button.viewAll', 'View All')}
              </Link>
            </div>

            <div className="space-y-4">
              {recentBookings.map((booking) => (
                <div key={booking.id} className="card p-4">
                  <div className="flex items-start justify-between mb-3">
                    <div>
                      <h3 className="font-semibold text-gray-900 dark:text-gray-100">
                        {booking.vehicleName}
                      </h3>
                      <p className="text-sm text-gray-600 dark:text-gray-400">
                        {booking.ownerName} • {booking.location}
                      </p>
                    </div>
                    <span className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(booking.status)}`}>
                      {t(`status.${booking.status}`, booking.status)}
                    </span>
                  </div>

                  <div className="flex items-center justify-between text-sm">
                    <div className="text-gray-600 dark:text-gray-400">
                      <Clock className="w-4 h-4 inline mr-1" />
                      {new Date(booking.startTime).toLocaleDateString()} - {new Date(booking.endTime).toLocaleDateString()}
                    </div>
                    <div className="font-semibold text-gray-900 dark:text-gray-100">
                      ₹{booking.totalAmount.toLocaleString()}
                    </div>
                  </div>

                  <div className="mt-3 flex gap-2">
                    {booking.status === 'confirmed' && (
                      <Link
                        href={`/bookings/${booking.id}/track`}
                        className="btn-primary text-sm py-1 px-3"
                      >
                        {t('button.track', 'Track')}
                      </Link>
                    )}
                    {booking.status === 'completed' && (
                      <Link
                        href={`/bookings/${booking.id}/review`}
                        className="btn-secondary text-sm py-1 px-3"
                      >
                        {t('button.review', 'Review')}
                      </Link>
                    )}
                    <Link
                      href={`/bookings/${booking.id}`}
                      className="btn-outline text-sm py-1 px-3"
                    >
                      {t('button.details', 'Details')}
                    </Link>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Available Vehicles */}
          <div>
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-xl font-semibold text-gray-900 dark:text-gray-100">
                {t('farmer.availableVehicles', 'Available Near You')}
              </h2>
              <Link
                href="/vehicles"
                className="text-green-600 hover:text-green-700 text-sm font-medium"
              >
                {t('button.browse', 'Browse All')}
              </Link>
            </div>

            {/* Search and Filter */}
            <div className="flex gap-4 mb-6">
              <div className="flex-1 relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
                <input
                  type="text"
                  placeholder={t('search.placeholder', 'Search vehicles...')}
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="input-field pl-10"
                />
              </div>
              <select
                value={selectedFilter}
                onChange={(e) => setSelectedFilter(e.target.value)}
                className="input-field"
              >
                {filters.map(filter => (
                  <option key={filter.value} value={filter.value}>
                    {filter.label}
                  </option>
                ))}
              </select>
            </div>

            {/* Vehicle List */}
            <div className="space-y-4">
              {filteredVehicles.map((vehicle) => (
                <div key={vehicle.id} className="card p-4">
                  <div className="flex gap-4">
                    <img
                      src={vehicle.photo}
                      alt={vehicle.name}
                      className="w-20 h-16 object-cover rounded-lg"
                    />
                    <div className="flex-1">
                      <div className="flex items-start justify-between">
                        <div>
                          <h3 className="font-semibold text-gray-900 dark:text-gray-100">
                            {vehicle.name}
                          </h3>
                          <p className="text-sm text-gray-600 dark:text-gray-400">
                            {vehicle.type} • {vehicle.ownerName}
                          </p>
                        </div>
                        <div className="text-right">
                          <div className="flex items-center mb-1">
                            <Star className="w-4 h-4 text-yellow-500 fill-current" />
                            <span className="text-sm ml-1">{vehicle.rating}</span>
                          </div>
                          <div className="text-lg font-bold text-green-600">
                            ₹{vehicle.hourlyRate}/hr
                          </div>
                        </div>
                      </div>

                      <div className="flex items-center justify-between mt-3">
                        <div className="flex items-center text-sm text-gray-600 dark:text-gray-400">
                          <MapPin className="w-4 h-4 mr-1" />
                          {vehicle.distance}
                        </div>
                        <div className="flex gap-2">
                          {vehicle.available ? (
                            <Link
                              href={`/vehicles/${vehicle.id}/book`}
                              className="btn-primary text-sm py-1 px-3"
                            >
                              {t('button.book', 'Book Now')}
                            </Link>
                          ) : (
                            <span className="text-sm text-gray-500 py-1 px-3">
                              {t('status.unavailable', 'Unavailable')}
                            </span>
                          )}
                          <Link
                            href={`/vehicles/${vehicle.id}`}
                            className="btn-outline text-sm py-1 px-3"
                          >
                            {t('button.details', 'Details')}
                          </Link>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}