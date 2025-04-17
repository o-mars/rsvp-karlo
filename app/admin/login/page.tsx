'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '../../../src/contexts/AuthContext';

export default function AdminLogin() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [error, setError] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);
  const [mode, setMode] = useState<'login' | 'register'>('register');
  const { user, loading, login, register } = useAuth();
  const router = useRouter();

  // Reset error when switching modes or changing inputs
  useEffect(() => {
    setError('');
  }, [mode, email, password, confirmPassword]);

  // Auto-clear error message after 3 seconds
  useEffect(() => {
    if (error) {
      const timer = setTimeout(() => {
        setError('');
      }, 3000);
      return () => clearTimeout(timer);
    }
  }, [error]);

  useEffect(() => {
    if (!loading && user) {
      console.log('User is logged in, redirecting to admin');
      router.replace('/admin/');
    }
  }, [user, loading, router]);

  // Password validation
  const isPasswordValid = password.length >= 8;
  const doPasswordsMatch = password === confirmPassword;
  const canSubmit = 
    email && 
    (mode === 'login' 
      ? password 
      : (isPasswordValid && doPasswordsMatch)
    );

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setIsProcessing(true);
    
    // Additional validation
    if (mode === 'register' && !isPasswordValid) {
      setError('Password must be at least 8 characters long');
      setIsProcessing(false);
      return;
    }
    
    if (mode === 'register' && !doPasswordsMatch) {
      setError('Passwords do not match');
      setIsProcessing(false);
      return;
    }
    
    try {
      console.log(`Attempting to ${mode} with email:`, email);
      if (mode === 'login') {
        await login(email, password);
      } else {
        await register(email, password);
      }
    } catch (err: unknown) {
      console.error('Auth error:', err);
      if (err instanceof Error) {
        setError(err.message || 'Authentication failed');
      } else {
        setError('Authentication failed');
      }
    } finally {
      setIsProcessing(false);
    }
  };

  // Handle Enter key press in password field to submit form
  const handleKeyPress = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter' && canSubmit) {
      e.preventDefault();
      handleSubmit(e as unknown as React.FormEvent);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-b from-white to-pink-50 p-4">
      <div 
        className="max-w-md w-full bg-white rounded-lg shadow-lg border border-pink-100 transition-all duration-300" 
        style={{ height: mode === 'login' ? '420px' : '500px' }}
      >
        <div className="flex flex-col h-full p-6">
          {/* Header - Fixed at top */}
          <div className="mb-5">
            <h1 className="text-center text-3xl font-extrabold text-gray-900">
              RSVP Karlo
            </h1>
            <p className="mt-1 text-center text-sm text-gray-600">
              {mode === 'login'
                ? 'Sign in to manage your event series'
                : 'Create an account to start hosting events'
              }
            </p>
          </div>
          
          <form 
            className="flex flex-col flex-grow" 
            onSubmit={handleSubmit}
            noValidate // Prevents default browser validation so our custom validation runs
          >
            {/* Form Fields */}
            <div className="flex-grow flex flex-col">
              <div className="flex flex-col h-full">
                <div className="mb-4">
                  <label htmlFor="email" className="block text-sm font-medium text-gray-700">
                    Email address
                  </label>
                  <input
                    id="email"
                    name="email"
                    type="email"
                    required
                    className="appearance-none mt-1 rounded-md relative block w-full px-3 py-2 border border-gray-300 placeholder-gray-500 text-gray-900 focus:outline-none focus:ring-pink-500 focus:border-pink-500 focus:z-10 sm:text-sm"
                    placeholder="Email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    onKeyPress={handleKeyPress}
                  />
                </div>
                
                <div className="mb-4">
                  <label htmlFor="password" className="block text-sm font-medium text-gray-700">
                    Password
                  </label>
                  <input
                    id="password"
                    name="password"
                    type="password"
                    required
                    className="appearance-none mt-1 rounded-md relative block w-full px-3 py-2 border border-gray-300 placeholder-gray-500 text-gray-900 focus:outline-none focus:ring-pink-500 focus:border-pink-500 focus:z-10 sm:text-sm"
                    placeholder="Password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    onKeyPress={handleKeyPress}
                  />
                  {mode === 'register' && !password && (
                    <p className="mt-1 text-xs text-gray-500">
                      Password must be at least 8 characters
                    </p>
                  )}
                  {mode === 'register' && password && !isPasswordValid && (
                    <p className="mt-1 text-xs text-red-500">
                      Password must be at least 8 characters
                    </p>
                  )}
                </div>
                
                {mode === 'register' && (
                  <div className="mb-4 transition-opacity duration-300">
                    <label htmlFor="confirmPassword" className="block text-sm font-medium text-gray-700">
                      Confirm password
                    </label>
                    <input
                      id="confirmPassword"
                      name="confirmPassword"
                      type="password"
                      className="appearance-none mt-1 rounded-md relative block w-full px-3 py-2 border border-gray-300 placeholder-gray-500 text-gray-900 focus:outline-none focus:ring-pink-500 focus:border-pink-500 focus:z-10 sm:text-sm"
                      placeholder="Confirm password"
                      value={confirmPassword}
                      onChange={(e) => setConfirmPassword(e.target.value)}
                      onKeyPress={handleKeyPress}
                    />
                    {password && confirmPassword && !doPasswordsMatch && (
                      <p className="mt-1 text-xs text-red-500">
                        Passwords do not match
                      </p>
                    )}
                  </div>
                )}
                
                {/* Flex spacer */}
                <div className="flex-grow"></div>
              </div>
            </div>
            
            {/* Fixed Buttons Area - Always at bottom */}
            <div>
              <button
                type="submit"
                className={`group relative w-full flex justify-center py-2.5 px-4 border border-transparent text-sm font-medium rounded-md text-white 
                  ${canSubmit ? 'bg-pink-600 hover:bg-pink-700' : 'bg-pink-400 cursor-not-allowed'} 
                  focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-pink-500 transition-colors duration-200`}
                disabled={loading || isProcessing || !canSubmit}
              >
                {isProcessing ? (
                  <span className="flex items-center">
                    <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                    </svg>
                    Processing...
                  </span>
                ) : (
                  mode === 'login' ? 'Sign in' : 'Create Account'
                )}
              </button>
              
              {/* Fixed height container for error message */}
              <div className="h-14 flex items-center justify-center mt-3">
                {error ? (
                  <div className="rounded-md bg-red-50 p-2 w-full border border-red-200 animate-fadeIn">
                    <div className="flex">
                      <div className="flex-shrink-0">
                        <svg className="h-5 w-5 text-red-400" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" aria-hidden="true">
                          <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                        </svg>
                      </div>
                      <div className="ml-3">
                        <p className="text-sm text-red-700">{error}</p>
                      </div>
                    </div>
                  </div>
                ) : null}
              </div>
              
              <div className="text-center">
                <button
                  type="button"
                  className="text-pink-600 hover:underline text-sm"
                  onClick={() => {
                    setMode(mode === 'login' ? 'register' : 'login');
                    setConfirmPassword('');
                  }}
                >
                  {mode === 'login' ? 'Need an account? Register' : 'Already have an account? Login'}
                </button>
              </div>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
} 