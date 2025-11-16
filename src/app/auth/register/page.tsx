'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Link } from 'next/link';
import { useTranslation } from 'react-i18next';
import { useAuth } from '../../../contexts/AuthContext';
import { Eye, EyeOff, Tractor, User, Mail, Phone, Lock, Building, Wheat } from 'lucide-react';

export default function RegisterPage() {
  const { t } = useTranslation();
  const router = useRouter();
  const { register, isLoading } = useAuth();

  const [formData, setFormData] = useState({
    firstName: '',
    lastName: '',
    email: '',
    phone: '',
    password: '',
    confirmPassword: '',
    userType: 'farmer' as 'farmer' | 'owner',
  });

  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});

  const validateForm = () => {
    const newErrors: Record<string, string> = {};

    // First Name
    if (!formData.firstName.trim()) {
      newErrors.firstName = t('validation.firstName.required', 'First name is required');
    }

    // Last Name
    if (!formData.lastName.trim()) {
      newErrors.lastName = t('validation.lastName.required', 'Last name is required');
    }

    // Email
    if (!formData.email) {
      newErrors.email = t('validation.email.required', 'Email is required');
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
      newErrors.email = t('validation.email.invalid', 'Please enter a valid email');
    }

    // Phone
    if (!formData.phone) {
      newErrors.phone = t('validation.phone.required', 'Phone number is required');
    } else if (!/^[6-9]\d{9}$/.test(formData.phone.replace(/\D/g, ''))) {
      newErrors.phone = t('validation.phone.invalid', 'Please enter a valid 10-digit phone number');
    }

    // Password
    if (!formData.password) {
      newErrors.password = t('validation.password.required', 'Password is required');
    } else if (formData.password.length < 6) {
      newErrors.password = t('validation.password.minLength', 'Password must be at least 6 characters');
    }

    // Confirm Password
    if (!formData.confirmPassword) {
      newErrors.confirmPassword = t('validation.confirmPassword.required', 'Please confirm your password');
    } else if (formData.password !== formData.confirmPassword) {
      newErrors.confirmPassword = t('validation.confirmPassword.match', 'Passwords do not match');
    }

    // User Type
    if (!formData.userType) {
      newErrors.userType = t('validation.userType.required', 'Please select user type');
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!validateForm()) return;

    try {
      await register({
        firstName: formData.firstName.trim(),
        lastName: formData.lastName.trim(),
        email: formData.email.trim(),
        phone: formData.phone.replace(/\D/g, ''),
        password: formData.password,
        userType: formData.userType,
      });

      router.push('/dashboard');
    } catch (error) {
      // Error handling is done in AuthContext
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));

    // Clear error when user starts typing
    if (errors[name]) {
      setErrors(prev => ({ ...prev, [name]: '' }));
    }
  };

  const userTypes = [
    {
      value: 'farmer',
      label: t('userTypes.farmer', 'Farmer'),
      description: t('userTypes.farmer.description', 'I want to book tractors and equipment'),
      icon: <Wheat className="w-5 h-5" />
    },
    {
      value: 'owner',
      label: t('userTypes.owner', 'Equipment Owner'),
      description: t('userTypes.owner.description', 'I want to rent out my tractors and equipment'),
      icon: <Tractor className="w-5 h-5" />
    }
  ];

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-gray-900 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-2xl w-full">
        {/* Header */}
        <div className="text-center mb-8">
          <div className="flex justify-center">
            <Tractor className="w-12 h-12 text-green-600" />
          </div>
          <h2 className="mt-6 text-3xl font-bold text-gray-900 dark:text-gray-100">
            {t('register.title', 'Create Your Account')}
          </h2>
          <p className="mt-2 text-sm text-gray-600 dark:text-gray-400">
            {t('register.subtitle', 'Join thousands of farmers and equipment owners')}
          </p>
        </div>

        {/* Registration Form */}
        <div className="bg-white dark:bg-gray-800 py-8 px-6 shadow-lg rounded-xl border border-gray-200 dark:border-gray-700">
          <form onSubmit={handleSubmit} className="space-y-6">
            {/* User Type Selection */}
            <div>
              <label className="form-label mb-4">
                {t('form.userType', 'I am a')}
              </label>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {userTypes.map((type) => (
                  <label
                    key={type.value}
                    className={`relative flex items-center p-4 border rounded-lg cursor-pointer transition-colors ${
                      formData.userType === type.value
                        ? 'border-green-500 bg-green-50 dark:bg-green-900/20'
                        : 'border-gray-300 dark:border-gray-600 hover:border-gray-400'
                    }`}
                  >
                    <input
                      type="radio"
                      name="userType"
                      value={type.value}
                      checked={formData.userType === type.value}
                      onChange={handleChange}
                      className="sr-only"
                    />
                    <div className="flex items-start">
                      <div className="text-green-600 mr-3">
                        {type.icon}
                      </div>
                      <div>
                        <div className="font-medium text-gray-900 dark:text-gray-100">
                          {type.label}
                        </div>
                        <div className="text-sm text-gray-600 dark:text-gray-400">
                          {type.description}
                        </div>
                      </div>
                    </div>
                  </label>
                ))}
              </div>
              {errors.userType && (
                <p className="form-error mt-2">{errors.userType}</p>
              )}
            </div>

            {/* Name Fields */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label htmlFor="firstName" className="form-label">
                  {t('form.firstName', 'First Name')}
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <User className="h-5 w-5 text-gray-400" />
                  </div>
                  <input
                    id="firstName"
                    name="firstName"
                    type="text"
                    required
                    value={formData.firstName}
                    onChange={handleChange}
                    className={`input-field pl-10 ${errors.firstName ? 'border-red-500' : ''}`}
                    placeholder={t('form.firstName.placeholder', 'Enter your first name')}
                  />
                </div>
                {errors.firstName && (
                  <p className="form-error">{errors.firstName}</p>
                )}
              </div>

              <div>
                <label htmlFor="lastName" className="form-label">
                  {t('form.lastName', 'Last Name')}
                </label>
                <input
                  id="lastName"
                  name="lastName"
                  type="text"
                  required
                  value={formData.lastName}
                  onChange={handleChange}
                  className={`input-field ${errors.lastName ? 'border-red-500' : ''}`}
                  placeholder={t('form.lastName.placeholder', 'Enter your last name')}
                />
                {errors.lastName && (
                  <p className="form-error">{errors.lastName}</p>
                )}
              </div>
            </div>

            {/* Email Field */}
            <div>
              <label htmlFor="email" className="form-label">
                {t('form.email', 'Email Address')}
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <Mail className="h-5 w-5 text-gray-400" />
                </div>
                <input
                  id="email"
                  name="email"
                  type="email"
                  autoComplete="email"
                  required
                  value={formData.email}
                  onChange={handleChange}
                  className={`input-field pl-10 ${errors.email ? 'border-red-500' : ''}`}
                  placeholder={t('form.email.placeholder', 'Enter your email address')}
                />
              </div>
              {errors.email && (
                <p className="form-error">{errors.email}</p>
              )}
            </div>

            {/* Phone Field */}
            <div>
              <label htmlFor="phone" className="form-label">
                {t('form.phone', 'Phone Number')}
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <Phone className="h-5 w-5 text-gray-400" />
                </div>
                <input
                  id="phone"
                  name="phone"
                  type="tel"
                  autoComplete="tel"
                  required
                  value={formData.phone}
                  onChange={handleChange}
                  className={`input-field pl-10 ${errors.phone ? 'border-red-500' : ''}`}
                  placeholder={t('form.phone.placeholder', 'Enter your phone number')}
                />
              </div>
              {errors.phone && (
                <p className="form-error">{errors.phone}</p>
              )}
            </div>

            {/* Password Fields */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label htmlFor="password" className="form-label">
                  {t('form.password', 'Password')}
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <Lock className="h-5 w-5 text-gray-400" />
                  </div>
                  <button
                    type="button"
                    className="absolute inset-y-0 right-0 pr-3 flex items-center"
                    onClick={() => setShowPassword(!showPassword)}
                  >
                    {showPassword ? (
                      <EyeOff className="h-5 w-5 text-gray-400" />
                    ) : (
                      <Eye className="h-5 w-5 text-gray-400" />
                    )}
                  </button>
                  <input
                    id="password"
                    name="password"
                    type={showPassword ? 'text' : 'password'}
                    autoComplete="new-password"
                    required
                    value={formData.password}
                    onChange={handleChange}
                    className={`input-field pl-10 pr-10 ${errors.password ? 'border-red-500' : ''}`}
                    placeholder={t('form.password.placeholder', 'Create a password')}
                  />
                </div>
                {errors.password && (
                  <p className="form-error">{errors.password}</p>
                )}
              </div>

              <div>
                <label htmlFor="confirmPassword" className="form-label">
                  {t('form.confirmPassword', 'Confirm Password')}
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <Lock className="h-5 w-5 text-gray-400" />
                  </div>
                  <button
                    type="button"
                    className="absolute inset-y-0 right-0 pr-3 flex items-center"
                    onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                  >
                    {showConfirmPassword ? (
                      <EyeOff className="h-5 w-5 text-gray-400" />
                    ) : (
                      <Eye className="h-5 w-5 text-gray-400" />
                    )}
                  </button>
                  <input
                    id="confirmPassword"
                    name="confirmPassword"
                    type={showConfirmPassword ? 'text' : 'password'}
                    autoComplete="new-password"
                    required
                    value={formData.confirmPassword}
                    onChange={handleChange}
                    className={`input-field pl-10 pr-10 ${errors.confirmPassword ? 'border-red-500' : ''}`}
                    placeholder={t('form.confirmPassword.placeholder', 'Confirm your password')}
                  />
                </div>
                {errors.confirmPassword && (
                  <p className="form-error">{errors.confirmPassword}</p>
                )}
              </div>
            </div>

            {/* Terms and Submit */}
            <div className="space-y-4">
              <div className="flex items-center">
                <input
                  id="terms"
                  name="terms"
                  type="checkbox"
                  required
                  className="h-4 w-4 text-green-600 focus:ring-green-500 border-gray-300 rounded"
                />
                <label htmlFor="terms" className="ml-2 block text-sm text-gray-900 dark:text-gray-300">
                  {t('register.terms', 'I agree to the')}{' '}
                  <Link href="/terms" className="text-green-600 hover:text-green-500">
                    {t('register.termsLink', 'Terms of Service')}
                  </Link>{' '}
                  {t('register.and', 'and')}{' '}
                  <Link href="/privacy" className="text-green-600 hover:text-green-500">
                    {t('register.privacyLink', 'Privacy Policy')}
                  </Link>
                </label>
              </div>

              <button
                type="submit"
                disabled={isLoading}
                className="w-full btn-primary flex justify-center py-3"
              >
                {isLoading ? (
                  <div className="loading-spinner w-5 h-5"></div>
                ) : (
                  t('register.button', 'Create Account')
                )}
              </button>
            </div>
          </form>
        </div>

        {/* Login Link */}
        <div className="text-center mt-6">
          <p className="text-sm text-gray-600 dark:text-gray-400">
            {t('register.hasAccount', 'Already have an account?')}{' '}
            <Link
              href="/auth/login"
              className="font-medium text-green-600 hover:text-green-500"
            >
              {t('register.signIn', 'Sign in')}
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}