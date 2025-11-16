'use client';

import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import Link from 'next/link';
import { useQuery } from '@tanstack/react-query';
import {
  Users,
  Tractor,
  Calendar,
  DollarSign,
  TrendingUp,
  Shield,
  Clock,
  BarChart3,
  Settings,
  Eye,
  Ban,
  CheckCircle,
  AlertTriangle
} from 'lucide-react';

// Mock data for demonstration
const adminStats = {
  totalUsers: 25678,
  activeUsers: 18456,
  totalVehicles: 5234,
  verifiedVehicles: 4856,
  totalBookings: 45678,
  completedBookings: 42012,
  pendingBookings: 2345,
  totalRevenue: 8923456,
  monthlyGrowth: 12.5,
  averageRating: 4.6,
  supportTickets: 234,
  pendingVerifications: 56
};

const recentUsers = [
  {
    id: '1',
    name: 'Ramesh Kumar',
    email: 'ramesh@example.com',
    phone: '9876543210',
    userType: 'farmer',
    isVerified: true,
    registrationDate: '2024-01-15T10:30:00Z'
  },
  {
    id: '2',
    name: 'Vikram Singh',
    email: 'vikram@example.com',
    phone: '9876543211',
    userType: 'owner',
    isVerified: false,
    registrationDate: '2024-01-15T09:45:00Z'
  },
  {
    id: '3',
    name: 'Anil Sharma',
    email: 'anil@example.com',
    phone: '9876543212',
    userType: 'farmer',
    isVerified: true,
    registrationDate: '2024-01-14T16:20:00Z'
  }
];

const pendingVerifications = [
  {
    id: '1',
    vehicleName: 'Mahindra 585 DI',
    ownerName: 'Prem Kumar',
    registrationNumber: 'UP12AB1234',
    submissionDate: '2024-01-14T11:30:00Z',
    documents: {
      registration: true,
      insurance: true,
      pollution: false
    }
  },
  {
    id: '2',
    vehicleName: 'Swaraj 744 FE',
    ownerName: 'Suresh Yadav',
    registrationNumber: 'UP12CD5678',
    submissionDate: '2024-01-13T14:45:00Z',
    documents: {
      registration: true,
      insurance: true,
      pollution: true
    }
  }
];

export default function AdminDashboard() {
  const { t } = useTranslation();
  const [selectedTab, setSelectedTab] = useState('overview');
  const [dateRange, setDateRange] = useState('7days');

  const tabs = [
    { id: 'overview', label: t('admin.tabs.overview', 'Overview'), icon: <BarChart3 className="w-4 h-4" /> },
    { id: 'users', label: t('admin.tabs.users', 'Users'), icon: <Users className="w-4 h-4" /> },
    { id: 'vehicles', label: t('admin.tabs.vehicles', 'Vehicles'), icon: <Tractor className="w-4 h-4" /> },
    { id: 'bookings', label: t('admin.tabs.bookings', 'Bookings'), icon: <Calendar className="w-4 h-4" /> },
    { id: 'verifications', label: t('admin.tabs.verifications', 'Verifications'), icon: <Shield className="w-4 h-4" /> }
  ];

  const dateRanges = [
    { value: '7days', label: t('admin.ranges.7days', 'Last 7 days') },
    { value: '30days', label: t('admin.ranges.30days', 'Last 30 days') },
    { value: '90days', label: t('admin.ranges.90days', 'Last 90 days') },
    { value: '1year', label: t('admin.ranges.1year', 'Last year') }
  ];

  const getVerificationStatus = (documents: any) => {
    const allSubmitted = documents.registration && documents.insurance && documents.pollution;
    if (allSubmitted) return { color: 'text-green-600 bg-green-100', icon: <CheckCircle className="w-4 h-4" />, text: 'Complete' };
    return { color: 'text-yellow-600 bg-yellow-100', icon: <AlertTriangle className="w-4 h-4" />, text: 'Incomplete' };
  };

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      <div className="container-custom py-8">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-3xl font-bold text-gray-900 dark:text-gray-100 mb-2">
              {t('admin.dashboard.title', 'Admin Dashboard')}
            </h1>
            <p className="text-gray-600 dark:text-gray-400">
              {t('admin.dashboard.subtitle', 'Manage users, vehicles, and platform operations')}
            </p>
          </div>
          <div className="flex items-center gap-4">
            <select
              value={dateRange}
              onChange={(e) => setDateRange(e.target.value)}
              className="input-field text-sm"
            >
              {dateRanges.map(range => (
                <option key={range.value} value={range.value}>
                  {range.label}
                </option>
              ))}
            </select>
            <button className="btn-outline text-sm py-2 px-4 flex items-center gap-2">
              <Settings className="w-4 h-4" />
              {t('button.settings', 'Settings')}
            </button>
          </div>
        </div>

        {/* Key Metrics */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <div className="card p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600 dark:text-gray-400">
                  {t('stats.totalUsers', 'Total Users')}
                </p>
                <p className="text-2xl font-bold text-gray-900 dark:text-gray-100">
                  {adminStats.totalUsers.toLocaleString()}
                </p>
                <p className="text-xs text-green-600 mt-1">
                  {adminStats.activeUsers.toLocaleString()} {t('stats.active', 'active')}
                </p>
              </div>
              <Users className="w-8 h-8 text-blue-600 opacity-20" />
            </div>
          </div>

          <div className="card p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600 dark:text-gray-400">
                  {t('stats.totalVehicles', 'Total Vehicles')}
                </p>
                <p className="text-2xl font-bold text-gray-900 dark:text-gray-100">
                  {adminStats.totalVehicles.toLocaleString()}
                </p>
                <p className="text-xs text-green-600 mt-1">
                  {adminStats.verifiedVehicles.toLocaleString()} {t('stats.verified', 'verified')}
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
                  {adminStats.totalBookings.toLocaleString()}
                </p>
                <p className="text-xs text-green-600 mt-1">
                  {adminStats.pendingBookings.toLocaleString()} {t('stats.pending', 'pending')}
                </p>
              </div>
              <Calendar className="w-8 h-8 text-purple-600 opacity-20" />
            </div>
          </div>

          <div className="card p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600 dark:text-gray-400">
                  {t('stats.totalRevenue', 'Total Revenue')}
                </p>
                <p className="text-2xl font-bold text-gray-900 dark:text-gray-100">
                  ₹{adminStats.totalRevenue.toLocaleString()}
                </p>
                <p className="text-xs text-green-600 mt-1">
                  +{adminStats.monthlyGrowth}% {t('stats.growth', 'this month')}
                </p>
              </div>
              <DollarSign className="w-8 h-8 text-green-600 opacity-20" />
            </div>
          </div>
        </div>

        {/* Additional Stats */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <div className="card p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600 dark:text-gray-400">
                  {t('stats.completionRate', 'Completion Rate')}
                </p>
                <p className="text-2xl font-bold text-gray-900 dark:text-gray-100">
                  {Math.round((adminStats.completedBookings / adminStats.totalBookings) * 100)}%
                </p>
              </div>
              <TrendingUp className="w-8 h-8 text-green-600 opacity-20" />
            </div>
          </div>

          <div className="card p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600 dark:text-gray-400">
                  {t('stats.averageRating', 'Average Rating')}
                </p>
                <div className="flex items-center">
                  <div className="w-6 h-6 text-yellow-500 rounded-full flex items-center justify-center text-xs">
                    ★
                  </div>
                  <p className="text-2xl font-bold text-gray-900 dark:text-gray-100 ml-2">
                    {adminStats.averageRating}
                  </p>
                </div>
              </div>
              <BarChart3 className="w-8 h-8 text-blue-600 opacity-20" />
            </div>
          </div>

          <div className="card p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600 dark:text-gray-400">
                  {t('stats.supportTickets', 'Support Tickets')}
                </p>
                <p className="text-2xl font-bold text-gray-900 dark:text-gray-100">
                  {adminStats.supportTickets}
                </p>
              </div>
              <Clock className="w-8 h-8 text-orange-600 opacity-20" />
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
              {/* Recent Users */}
              <div>
                <div className="flex items-center justify-between mb-6">
                  <h2 className="text-xl font-semibold text-gray-900 dark:text-gray-100">
                    {t('admin.recentUsers', 'Recent Users')}
                  </h2>
                  <Link
                    href="/admin/users"
                    className="text-green-600 hover:text-green-700 text-sm font-medium"
                  >
                    {t('button.viewAll', 'View All')}
                  </Link>
                </div>

                <div className="space-y-4">
                  {recentUsers.map((user) => (
                    <div key={user.id} className="card p-4">
                      <div className="flex items-center justify-between mb-2">
                        <div>
                          <h3 className="font-semibold text-gray-900 dark:text-gray-100">
                            {user.name}
                          </h3>
                          <p className="text-sm text-gray-600 dark:text-gray-400">
                            {user.email} • {user.phone}
                          </p>
                        </div>
                        <div className="flex items-center gap-2">
                          <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                            user.userType === 'farmer'
                              ? 'bg-blue-100 text-blue-600'
                              : 'bg-green-100 text-green-600'
                          }`}>
                            {t(`userTypes.${user.userType}`, user.userType)}
                          </span>
                          {user.isVerified ? (
                            <span className="bg-green-100 text-green-600 px-2 py-1 rounded-full text-xs font-medium">
                              {t('status.verified', 'Verified')}
                            </span>
                          ) : (
                            <span className="bg-yellow-100 text-yellow-600 px-2 py-1 rounded-full text-xs font-medium">
                              {t('status.pending', 'Pending')}
                            </span>
                          )}
                        </div>
                      </div>
                      <div className="text-sm text-gray-600 dark:text-gray-400">
                        {t('user.registeredOn', 'Registered')}: {new Date(user.registrationDate).toLocaleDateString()}
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Pending Verifications */}
              <div>
                <div className="flex items-center justify-between mb-6">
                  <h2 className="text-xl font-semibold text-gray-900 dark:text-gray-100">
                    {t('admin.pendingVerifications', 'Pending Verifications')}
                  </h2>
                  <div className="flex items-center gap-2">
                    <span className="bg-red-100 text-red-600 px-2 py-1 rounded-full text-xs font-medium">
                      {adminStats.pendingVerifications} {t('status.pending', 'Pending')}
                    </span>
                    <Link
                      href="/admin/verifications"
                      className="text-green-600 hover:text-green-700 text-sm font-medium"
                    >
                      {t('button.viewAll', 'View All')}
                    </Link>
                  </div>
                </div>

                <div className="space-y-4">
                  {pendingVerifications.map((verification) => {
                    const status = getVerificationStatus(verification.documents);
                    return (
                      <div key={verification.id} className="card p-4">
                        <div className="flex items-start justify-between mb-3">
                          <div>
                            <h3 className="font-semibold text-gray-900 dark:text-gray-100">
                              {verification.vehicleName}
                            </h3>
                            <p className="text-sm text-gray-600 dark:text-gray-400">
                              {verification.ownerName} • {verification.registrationNumber}
                            </p>
                          </div>
                          <span className={`px-2 py-1 rounded-full text-xs font-medium flex items-center gap-1 ${status.color}`}>
                            {status.icon}
                            {status.text}
                          </span>
                        </div>
                        <div className="mb-3">
                          <p className="text-sm text-gray-600 dark:text-gray-400 mb-2">
                            {t('vehicle.documents', 'Documents')}:
                          </p>
                          <div className="grid grid-cols-3 gap-2 text-sm">
                            <div className={`flex items-center gap-1 ${
                              verification.documents.registration ? 'text-green-600' : 'text-gray-400'
                            }`}>
                              <CheckCircle className="w-4 h-4" />
                              {t('vehicle.registration', 'Registration')}
                            </div>
                            <div className={`flex items-center gap-1 ${
                              verification.documents.insurance ? 'text-green-600' : 'text-gray-400'
                            }`}>
                              <CheckCircle className="w-4 h-4" />
                              {t('vehicle.insurance', 'Insurance')}
                            </div>
                            <div className={`flex items-center gap-1 ${
                              verification.documents.pollution ? 'text-green-600' : 'text-gray-400'
                            }`}>
                              <CheckCircle className="w-4 h-4" />
                              {t('vehicle.pollution', 'Pollution')}
                            </div>
                          </div>
                        </div>
                        <div className="flex items-center justify-between text-sm text-gray-600 dark:text-gray-400">
                          <span>
                            {t('verification.submitted', 'Submitted')}: {new Date(verification.submissionDate).toLocaleDateString()}
                          </span>
                          <div className="flex gap-2">
                            <button className="text-green-600 hover:text-green-700 flex items-center gap-1">
                              <CheckCircle className="w-4 h-4" />
                              {t('button.approve', 'Approve')}
                            </button>
                            <button className="text-red-600 hover:text-red-700 flex items-center gap-1">
                              <Ban className="w-4 h-4" />
                              {t('button.reject', 'Reject')}
                            </button>
                            <button className="text-blue-600 hover:text-blue-700 flex items-center gap-1">
                              <Eye className="w-4 h-4" />
                              {t('button.view', 'View')}
                            </button>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>
          )}

          {selectedTab === 'verifications' && (
            <div>
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-xl font-semibold text-gray-900 dark:text-gray-100">
                  {t('admin.allVerifications', 'All Verifications')}
                </h2>
                <div className="flex items-center gap-4">
                  <button className="btn-outline text-sm py-2 px-4">
                    {t('button.export', 'Export')}
                  </button>
                  <button className="btn-primary text-sm py-2 px-4">
                    {t('button.filter', 'Filter')}
                  </button>
                </div>
              </div>

              <div className="card overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
                  <thead className="bg-gray-50 dark:bg-gray-800">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                        {t('table.vehicle', 'Vehicle')}
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                        {t('table.owner', 'Owner')}
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                        {t('table.submitted', 'Submitted')}
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                        {t('table.status', 'Status')}
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                        {t('table.actions', 'Actions')}
                      </th>
                    </tr>
                  </thead>
                  <tbody className="bg-white dark:bg-gray-900 divide-y divide-gray-200 dark:divide-gray-700">
                    {pendingVerifications.map((verification) => {
                      const status = getVerificationStatus(verification.documents);
                      return (
                        <tr key={verification.id}>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <div className="text-sm font-medium text-gray-900 dark:text-gray-100">
                              {verification.vehicleName}
                            </div>
                            <div className="text-sm text-gray-500 dark:text-gray-400">
                              {verification.registrationNumber}
                            </div>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <div className="text-sm text-gray-900 dark:text-gray-100">
                              {verification.ownerName}
                            </div>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <div className="text-sm text-gray-500 dark:text-gray-400">
                              {new Date(verification.submissionDate).toLocaleDateString()}
                            </div>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <span className={`px-2 py-1 rounded-full text-xs font-medium ${status.color}`}>
                              {status.text}
                            </span>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm">
                            <div className="flex items-center gap-2">
                              <button className="text-green-600 hover:text-green-700">
                                <CheckCircle className="w-4 h-4" />
                              </button>
                              <button className="text-red-600 hover:text-red-700">
                                <Ban className="w-4 h-4" />
                              </button>
                              <button className="text-blue-600 hover:text-blue-700">
                                <Eye className="w-4 h-4" />
                              </button>
                            </div>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}