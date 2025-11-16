'use client';

import { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import Link from 'next/link';
import { MapContainer, TileLayer, Marker, Popup } from 'react-leaflet';
import { LatLngExpression } from 'leaflet';
import { Search, Tractor, MapPin, Star, Shield, Clock, Users, TrendingUp } from 'lucide-react';

export default function HomePage() {
  const { t, i18n } = useTranslation();
  const [searchLocation, setSearchLocation] = useState('');
  const [vehicles, setVehicles] = useState([]);
  const [loading, setLoading] = useState(false);

  // Sample vehicle data for demonstration
  const sampleVehicles = [
    {
      id: '1',
      name: 'Mahindra 585 DI',
      type: 'Tractor',
      price: 800,
      rating: 4.5,
      location: { lat: 28.6139, lng: 77.2090 },
      owner: 'Ramesh Kumar',
      distance: '5 km'
    },
    {
      id: '2',
      name: 'Swaraj 744 FE',
      type: 'Tractor with Implements',
      price: 1200,
      rating: 4.8,
      location: { lat: 28.6200, lng: 77.2150 },
      owner: 'Vikram Singh',
      distance: '8 km'
    },
    {
      id: '3',
      name: 'John Deere 5050D',
      type: 'Tractor',
      price: 1000,
      rating: 4.3,
      location: { lat: 28.6070, lng: 77.2020 },
      owner: 'Anil Sharma',
      distance: '12 km'
    }
  ];

  const features = [
    {
      icon: <Search className="w-8 h-8 text-green-600" />,
      title: t('features.find.title', 'Find Vehicles Nearby'),
      description: t('features.find.description', 'Search and book tractors and agricultural equipment in your area')
    },
    {
      icon: <Shield className="w-8 h-8 text-blue-600" />,
      title: t('features.verify.title', 'Verified Owners'),
      description: t('features.verify.description', 'All vehicle owners are verified with complete documentation')
    },
    {
      icon: <Clock className="w-8 h-8 text-orange-600" />,
      title: t('features.realtime.title', 'Real-time Tracking'),
      description: t('features.realtime.description', 'Track your booking progress and vehicle location in real-time')
    },
    {
      icon: <Users className="w-8 h-8 text-purple-600" />,
      title: t('features.support.title', '24/7 Support'),
      description: t('features.support.description', 'Get help whenever you need it with our dedicated support team')
    }
  ];

  const stats = [
    { label: t('stats.vehicles', 'Vehicles'), value: '5,000+', icon: <Tractor /> },
    { label: t('stats.bookings', 'Bookings'), value: '50,000+', icon: <Clock /> },
    { label: t('stats.users', 'Users'), value: '25,000+', icon: <Users /> },
    { label: t('stats.satisfaction', 'Satisfaction'), value: '98%', icon: <Star /> }
  ];

  return (
    <div className="min-h-screen">
      {/* Hero Section */}
      <section className="hero-section relative overflow-hidden">
        <div className="container-custom section-padding">
          <div className="max-w-4xl mx-auto text-center">
            <h1 className="text-4xl md:text-6xl font-bold mb-6 fade-in">
              {t('hero.title', 'Book Tractors and Farm Equipment Near You')}
            </h1>
            <p className="text-xl md:text-2xl mb-8 opacity-90 fade-in">
              {t('hero.subtitle', 'Connect with verified tractor owners for all your agricultural needs')}
            </p>

            {/* Search Bar */}
            <div className="max-w-2xl mx-auto mb-12">
              <div className="bg-white dark:bg-gray-800 rounded-full shadow-lg p-2 flex items-center">
                <div className="flex-1 flex items-center px-4">
                  <MapPin className="w-5 h-5 text-gray-400 mr-3" />
                  <input
                    type="text"
                    placeholder={t('search.placeholder', 'Enter your location or village name...')}
                    value={searchLocation}
                    onChange={(e) => setSearchLocation(e.target.value)}
                    className="w-full py-3 bg-transparent outline-none text-gray-900 dark:text-gray-100 placeholder-gray-500"
                  />
                </div>
                <button
                  onClick={() => {/* Handle search */}}
                  className="bg-green-600 hover:bg-green-700 text-white px-8 py-3 rounded-full font-medium transition-colors"
                >
                  {t('search.button', 'Search')}
                </button>
              </div>
            </div>

            {/* Quick Stats */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-6 mb-12">
              {stats.map((stat, index) => (
                <div key={index} className="text-center fade-in" style={{ animationDelay: `${index * 0.1}s` }}>
                  <div className="text-3xl md:text-4xl font-bold text-white mb-2">
                    {stat.value}
                  </div>
                  <div className="text-white/80 text-sm md:text-base">
                    {stat.label}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="py-20 bg-gray-50 dark:bg-gray-900">
        <div className="container-custom">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-bold text-gray-900 dark:text-gray-100 mb-4">
              {t('features.title', 'Why Choose AgroRide?')}
            </h2>
            <p className="text-lg text-gray-600 dark:text-gray-400 max-w-2xl mx-auto">
              {t('features.subtitle', 'We make agricultural equipment booking simple, reliable, and affordable')}
            </p>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-8">
            {features.map((feature, index) => (
              <div key={index} className="feature-card text-center slide-up" style={{ animationDelay: `${index * 0.1}s` }}>
                <div className="flex justify-center mb-4">
                  {feature.icon}
                </div>
                <h3 className="text-xl font-semibold text-gray-900 dark:text-gray-100 mb-3">
                  {feature.title}
                </h3>
                <p className="text-gray-600 dark:text-gray-400">
                  {feature.description}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Map Section */}
      <section className="py-20">
        <div className="container-custom">
          <div className="text-center mb-12">
            <h2 className="text-3xl md:text-4xl font-bold text-gray-900 dark:text-gray-100 mb-4">
              {t('map.title', 'Vehicles Available Near You')}
            </h2>
            <p className="text-lg text-gray-600 dark:text-gray-400">
              {t('map.subtitle', 'Find and book tractors in your vicinity')}
            </p>
          </div>

          <div className="grid lg:grid-cols-2 gap-8">
            {/* Map */}
            <div className="h-96 lg:h-[500px] rounded-xl overflow-hidden shadow-lg">
              <MapContainer
                center={[28.6139, 77.2090] as LatLngExpression}
                zoom={12}
                style={{ height: '100%', width: '100%' }}
              >
                <TileLayer
                  url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                  attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
                />
                {sampleVehicles.map((vehicle) => (
                  <Marker
                    key={vehicle.id}
                    position={[vehicle.location.lat, vehicle.location.lng] as LatLngExpression}
                  >
                    <Popup>
                      <div className="p-2">
                        <h4 className="font-semibold">{vehicle.name}</h4>
                        <p className="text-sm text-gray-600">{vehicle.owner}</p>
                        <p className="text-sm font-medium text-green-600">₹{vehicle.price}/hour</p>
                      </div>
                    </Popup>
                  </Marker>
                ))}
              </MapContainer>
            </div>

            {/* Vehicle List */}
            <div className="space-y-4">
              <h3 className="text-xl font-semibold text-gray-900 dark:text-gray-100 mb-4">
                {t('vehicles.nearby', 'Nearby Vehicles')}
              </h3>
              {sampleVehicles.map((vehicle) => (
                <div key={vehicle.id} className="card p-4 hover:shadow-md transition-shadow">
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <h4 className="font-semibold text-gray-900 dark:text-gray-100 mb-1">
                        {vehicle.name}
                      </h4>
                      <p className="text-sm text-gray-600 dark:text-gray-400 mb-2">
                        {vehicle.type} • {vehicle.distance} away
                      </p>
                      <div className="flex items-center gap-4">
                        <div className="flex items-center">
                          <Star className="w-4 h-4 text-yellow-500 fill-current" />
                          <span className="text-sm ml-1">{vehicle.rating}</span>
                        </div>
                        <span className="text-sm text-gray-600 dark:text-gray-400">
                          {vehicle.owner}
                        </span>
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="text-lg font-semibold text-green-600">
                        ₹{vehicle.price}/hr
                      </div>
                      <Link
                        href={`/vehicles/${vehicle.id}`}
                        className="btn-primary text-sm mt-2 inline-block"
                      >
                        {t('button.book', 'Book Now')}
                      </Link>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20 bg-gradient-to-r from-green-600 to-green-700 text-white">
        <div className="container-custom text-center">
          <h2 className="text-3xl md:text-4xl font-bold mb-4">
            {t('cta.title', 'Ready to Get Started?')}
          </h2>
          <p className="text-xl mb-8 opacity-90">
            {t('cta.subtitle', 'Join thousands of farmers who trust AgroRide for their equipment needs')}
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link
              href="/auth/register"
              className="btn-primary bg-white text-green-600 hover:bg-gray-100"
            >
              {t('cta.register', 'Sign Up')}
            </Link>
            <Link
              href="/auth/login"
              className="btn-secondary bg-transparent border-2 border-white text-white hover:bg-white hover:text-green-600"
            >
              {t('cta.login', 'Login')}
            </Link>
          </div>
        </div>
      </section>
    </div>
  );
}