'use client';

import { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import Link from 'next/link';
import { useQuery } from '@tanstack/react-query';
import { Tractor, MapPin, Clock, Star, TrendingUp, Plus, Settings, Calendar, DollarSign } from 'lucide-react';

// Mock data for demonstration
const myVehicles = [
  {
    id: '1',
    name: 'Mahindra 585 DI',
    type: 'Tractor',
    registrationNumber: 'UP12AB1234',
    status: 'verified',
    hourlyRate: 800,
    totalBookings: 15,
    totalEarnings: 120000,
    rating: 4.5,
    isAvailable: true,
    lastServiceDate: '2024-01-10'
  },
  {
    id: '2',
    name: 'Swaraj 744 FE',
    type: 'Tractor with Implements',
    registrationNumber: 'UP12CD5678',
    status: 'pending',
    hourlyRate: 1200,
    totalBookings: 8,
    totalEarnings: 96000,
    rating: 4.8,
    isAvailable: true,
    lastServiceDate: '2024-01-05'
  }
];

const recentBookings = [
  {
    id: '1',
    vehicleName: 'Mahindra 585 DI',
    farmerName: 'Amit Kumar',
    status: 'in_progress',
    startTime: '2024-01-15T09:00:00Z',
    endTime: '2024-01-15T17:00:00Z',
    totalAmount: 6400,
    location: 'Village Rampur, District Mainpuri',
    progress: 65
  },
  {
    id: '2',
    vehicleName: 'Swaraj 744 FE',
    farmerName: 'Rajesh Singh',
    status: 'confirmed',
    startTime: '2024-01-16T08:00:00Z',
    endTime: '2024-01-16T18:00:00Z',
    totalAmount: 12000,
    location: 'Village Chandpur, District Etah',
    progress: 0
  }
];

export default function OwnerDashboard() {
  const { t } = useTranslation();
  const [selectedTab, setSelectedTab] = useState('overview');

  const stats = {
    totalVehicles: 2,
    activeVehicles: 1,
    totalBookings: 23,
    completedBookings: 18,
    currentBookings: 2,
    totalEarnings: 216000,
    thisMonthEarnings: 48000
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'verified': return 'text-green-600 bg-green-100';
      case 'pending': return 'text-yellow-600 bg-yellow-100';
      case 'rejected': return 'text-red-600 bg-red-100';
      default: return 'text-gray-600 bg-gray-100';
    }
  };

  const tabs = [
    { id: 'overview', label: t('owner.tabs.overview', 'Overview'), icon: <TrendingUp className="w-4 h-4" /> },
    { id: 'vehicles', label: t('owner.tabs.vehicles', 'My Vehicles'), icon: <Tractor className="w-4 h-4" /> },
    { id: 'bookings', label: t('owner.tabs.bookings', 'Bookings'), icon: <Calendar className="w-4 h-4" /> },
    { id: 'earnings', label: t('owner.tabs.earnings', 'Earnings'), icon: <DollarSign className="w-4 h-4" /> }
  ];

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      <div className="container-custom py-8">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-3xl font-bold text-gray-900 dark:text-gray-100 mb-2">
              {t('owner.dashboard.title', 'Owner Dashboard')}
            </h1>
            <p className="text-gray-600 dark:text-gray-400">
              {t('owner.dashboard.subtitle', 'Manage your vehicles and track your earnings')}
            </p>
          </div>
          <Link
            href="/vehicles/add"
            className="btn-primary flex items-center gap-2"
          >
            <Plus className="w-4 h-4" />
            {t('owner.addVehicle', 'Add Vehicle')}
          </Link>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <div className="card p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600 dark:text-gray-400">
                  {t('stats.totalVehicles', 'Total Vehicles')}
                </p>
                <p className="text-2xl font-bold text-gray-900 dark:text-gray-100">
                  {stats.totalVehicles}
                </p>
                <p className="text-xs text-green-600 mt-1">
                  {stats.activeVehicles} {t('stats.active', 'active')}
                </p>
              </div>
              <Tractor className="w-8 h-8 text-green-600 opacity-20" />
            </div>
          </div>

          <div className="card p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600 dark:text-gray-400">
                  {t('stats.totalBookings', 'Total Bookings')}
                </p>
                <p className="text-2xl font-bold text-gray-900 dark:text-gray-100">
                  {stats.totalBookings}
                </p>
                <p className="text-xs text-blue-600 mt-1">
                  {stats.currentBookings} {t('stats.active', 'active')}
                </p>
              </div>
              <Calendar className="w-8 h-8 text-blue-600 opacity-20" />
            </div>
          </div>

          <div className="card p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600 dark:text-gray-400">
                  {t('stats.totalEarnings', 'Total Earnings')}
                </p>
                <p className="text-2xl font-bold text-gray-900 dark:text-gray-100">
                  ₹{stats.totalEarnings.toLocaleString()}
                </p>
                <p className="text-xs text-green-600 mt-1">
                  +₹{stats.thisMonthEarnings.toLocaleString()} {t('stats.thisMonth', 'this month')}
                </p>
              </div>
              <DollarSign className="w-8 h-8 text-green-600 opacity-20" />
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
                <p className="text-xs text-gray-600 mt-1">
                  {Math.round((stats.completedBookings / stats.totalBookings) * 100)}% {t('stats.completion', 'rate')}
                </p>
              </div>
              <TrendingUp className="w-8 h-8 text-purple-600 opacity-20" />
            </div>
          </div>
        </div>

        {/* Tab Navigation */}
        <div className="border-b border-gray-200 dark:border-gray-700 mb-6">
          <nav className="flex space-x-8">
            {tabs.map((tab) => (
              <button
                key={tab.id}
                onClick={() => setSelectedTab(tab.id)}
                className={`py-4 px-1 border-b-2 font-medium text-sm flex items-center gap-2 transition-colors ${
                  selectedTab === tab.id
                    ? 'border-green-500 text-green-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`}
              >
                {tab.icon}
                {tab.label}
              </button>
            ))}
          </nav>
        </div>

        {/* Tab Content */}
        <div>
          {selectedTab === 'overview' && (
            <div className="grid lg:grid-cols-2 gap-8">
              {/* My Vehicles */}
              <div>
                <div className="flex items-center justify-between mb-6">
                  <h2 className="text-xl font-semibold text-gray-900 dark:text-gray-100">
                    {t('owner.myVehicles', 'My Vehicles')}
                  </h2>
                  <Link
                    href="/vehicles"
                    className="text-green-600 hover:text-green-700 text-sm font-medium"
                  >
                    {t('button.viewAll', 'View All')}
                  </Link>
                </div>

                <div className="space-y-4">
                  {myVehicles.map((vehicle) => (
                    <div key={vehicle.id} className="card p-4">
                      <div className="flex items-start justify-between mb-3">
                        <div>
                          <h3 className="font-semibold text-gray-900 dark:text-gray-100">
                            {vehicle.name}
                          </h3>
                          <p className="text-sm text-gray-600 dark:text-gray-400">
                            {vehicle.type} • {vehicle.registrationNumber}
                          </p>
                        </div>
                        <span className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(vehicle.status)}`}>
                          {t(`status.${vehicle.status}`, vehicle.status)}
                        </span>
                      </div>

                      <div className="grid grid-cols-2 gap-4 text-sm">
                        <div>
                          <p className="text-gray-600 dark:text-gray-400">{t('vehicle.hourlyRate', 'Hourly Rate')}</p>
                          <p className="font-semibold text-gray-900 dark:text-gray-100">₹{vehicle.hourlyRate}</p>
                        </div>
                        <div>
                          <p className="text-gray-600 dark:text-gray-400">{t('vehicle.totalBookings', 'Bookings')}</p>
                          <p className="font-semibold text-gray-900 dark:text-gray-100">{vehicle.totalBookings}</p>
                        </div>
                        <div>
                          <p className="text-gray-600 dark:text-gray-400">{t('vehicle.totalEarnings', 'Earnings')}</p>
                          <p className="font-semibold text-gray-900 dark:text-gray-100">₹{vehicle.totalEarnings.toLocaleString()}</p>
                        </div>
                        <div>
                          <p className="text-gray-600 dark:text-gray-400">{t('vehicle.rating', 'Rating')}</p>
                          <div className="flex items-center">
                            <Star className="w-4 h-4 text-yellow-500 fill-current" />
                            <span className="font-semibold text-gray-900 dark:text-gray-100 ml-1">{vehicle.rating}</span>
                          </div>
                        </div>
                      </div>

                      <div className="mt-4 flex gap-2">
                        <Link
                          href={`/vehicles/${vehicle.id}`}
                          className="btn-outline text-sm py-1 px-3"
                        >
                          {t('button.details', 'Details')}
                        </Link>
                        <Link
                          href={`/vehicles/${vehicle.id}/edit`}
                          className="btn-secondary text-sm py-1 px-3"
                        >
                          {t('button.edit', 'Edit')}
                        </Link>
                        <button
                          className={`text-sm py-1 px-3 rounded-lg font-medium transition-colors ${
                            vehicle.isAvailable
                              ? 'bg-yellow-100 text-yellow-700 hover:bg-yellow-200'
                              : 'bg-green-100 text-green-700 hover:bg-green-200'
                          }`}
                        >
                          {vehicle.isAvailable ? t('button.pause', 'Pause') : t('button.activate', 'Activate')}
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Recent Bookings */}
              <div>
                <div className="flex items-center justify-between mb-6">
                  <h2 className="text-xl font-semibold text-gray-900 dark:text-gray-100">
                    {t('owner.recentBookings', 'Recent Bookings')}
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
                            {booking.farmerName} • {booking.location}
                          </p>
                        </div>
                        <span className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(booking.status)}`}>
                          {t(`status.${booking.status}`, booking.status)}
                        </span>
                      </div>

                      {booking.status === 'in_progress' && (
                        <div className="mb-3">
                          <div className="flex items-center justify-between text-sm text-gray-600 dark:text-gray-400 mb-1">
                            <span>{t('booking.progress', 'Progress')}</span>
                            <span>{booking.progress}%</span>
                          </div>
                          <div className="w-full bg-gray-200 rounded-full h-2">
                            <div
                              className="bg-green-600 h-2 rounded-full"
                              style={{ width: `${booking.progress}%` }}
                            />
                          </div>
                        </div>
                      )}

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
                        {booking.status === 'in_progress' && (
                          <Link
                            href={`/bookings/${booking.id}/track`}
                            className="btn-primary text-sm py-1 px-3"
                          >
                            {t('button.track', 'Track')}
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
            </div>
          )}

          {selectedTab === 'vehicles' && (
            <div>
              <h2 className="text-xl font-semibold text-gray-900 dark:text-gray-100 mb-6">
                {t('owner.allVehicles', 'All Vehicles')}
              </h2>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {myVehicles.map((vehicle) => (
                  <div key={vehicle.id} className="card p-6">
                    <div className="flex items-start justify-between mb-4">
                      <div>
                        <h3 className="font-semibold text-gray-900 dark:text-gray-100">
                          {vehicle.name}
                        </h3>
                        <p className="text-sm text-gray-600 dark:text-gray-400">
                          {vehicle.registrationNumber}
                        </p>
                      </div>
                      <span className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(vehicle.status)}`}>
                        {t(`status.${vehicle.status}`, vehicle.status)}
                      </span>
                    </div>
                    <div className="space-y-2 text-sm">
                      <div className="flex justify-between">
                        <span className="text-gray-600 dark:text-gray-400">{t('vehicle.hourlyRate')}:</span>
                        <span className="font-semibold">₹{vehicle.hourlyRate}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-600 dark:text-gray-400">{t('vehicle.totalBookings')}:</span>
                        <span className="font-semibold">{vehicle.totalBookings}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-600 dark:text-gray-400">{t('vehicle.totalEarnings')}:</span>
                        <span className="font-semibold">₹{vehicle.totalEarnings.toLocaleString()}</span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}