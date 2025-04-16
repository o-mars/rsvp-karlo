'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { db } from '../../../../utils/firebase';
import { collection, doc, getDoc, writeBatch } from 'firebase/firestore';
import { useAuth } from '../../../AuthContext';
import Link from 'next/link';

export default function NewEventSeries() {
  const [name, setName] = useState('');
  const [alias, setAlias] = useState('');
  const [description, setDescription] = useState('');
  const [errors, setErrors] = useState<{
    name?: string;
    alias?: string;
    general?: string;
  }>({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isCheckingAlias, setIsCheckingAlias] = useState(false);
  const router = useRouter();
  const { user } = useAuth();

  useEffect(() => {
    if (!user) {
      router.replace('/admin/login');
    }
  }, [user, router]);

  // Validate alias on change
  useEffect(() => {
    let timeoutId: NodeJS.Timeout;
    
    if (alias) {
      // Basic validation
      const isValidFormat = /^[a-z0-9_-]+$/.test(alias);
      
      if (!isValidFormat) {
        setErrors(prev => ({
          ...prev,
          alias: 'Alias can only contain lowercase letters, numbers, hyphens, and underscores'
        }));
        return;
      } else {
        // Clear format error if any
        setErrors(prev => {
          const newErrors = {...prev};
          delete newErrors.alias;
          return newErrors;
        });
      }
      
      // Debounce the uniqueness check
      timeoutId = setTimeout(() => {
        checkAliasUniqueness(alias);
      }, 500);
    }
    
    return () => {
      if (timeoutId) clearTimeout(timeoutId);
    };
  }, [alias]);

  const checkAliasUniqueness = async (aliasToCheck: string) => {
    if (!aliasToCheck) return;
    
    setIsCheckingAlias(true);
    try {
      // Check if alias exists by looking up the document with that ID
      const aliasDocRef = doc(db, 'aliases', aliasToCheck);
      const aliasDoc = await getDoc(aliasDocRef);
      
      if (aliasDoc.exists()) {
        setErrors(prev => ({
          ...prev,
          alias: 'This alias is already taken. Please choose another.'
        }));
      } else {
        // Clear uniqueness error if any
        setErrors(prev => {
          const newErrors = {...prev};
          delete newErrors.alias;
          return newErrors;
        });
      }
    } catch (error) {
      console.error('Error checking alias uniqueness:', error);
    } finally {
      setIsCheckingAlias(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // Do all validation checks
    const newErrors: {
      name?: string;
      alias?: string;
      general?: string;
    } = {};
    
    if (!name.trim()) {
      newErrors.name = 'Name is required';
    }
    
    if (!alias.trim()) {
      newErrors.alias = 'Alias is required';
    } else if (!/^[a-z0-9_-]+$/.test(alias)) {
      newErrors.alias = 'Alias can only contain lowercase letters, numbers, hyphens, and underscores';
    }
    
    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      return;
    }
    
    // If we got here, we need to check alias uniqueness one more time
    setIsSubmitting(true);
    
    try {
      // Final check for alias uniqueness
      const aliasDocRef = doc(db, 'aliases', alias);
      const aliasDoc = await getDoc(aliasDocRef);
      
      if (aliasDoc.exists()) {
        setErrors({
          alias: 'This alias is already taken. Please choose another.'
        });
        setIsSubmitting(false);
        return;
      }
      
      // Create a new event series document reference with auto-generated ID
      const newEventSeriesRef = doc(collection(db, 'eventSeries'));
      const eventSeriesId = newEventSeriesRef.id;
      
      // Prepare the event series data
      const eventSeriesData = {
        name: name.trim(),
        alias: alias.trim(),
        description: description.trim() || null,
        createdBy: user?.uid,
        createdAt: new Date()
      };
      
      // Create a batch to perform both operations atomically
      const batch = writeBatch(db);
      
      // Add the event series document
      batch.set(newEventSeriesRef, eventSeriesData);
      
      // Add the alias document with the event series ID
      batch.set(aliasDocRef, {
        eventSeriesId,
        createdBy: user?.uid,
        createdAt: new Date()
      });
      
      // Commit the batch
      await batch.commit();
      
      // Redirect to the admin dashboard
      router.push('/admin');
    } catch (error) {
      console.error('Error creating event series:', error);
      setErrors({
        general: 'An error occurred while creating the event series. Please try again.'
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleAliasChange = (value: string) => {
    // Allow only valid characters
    const sanitizedValue = value.toLowerCase().replace(/[^a-z0-9_-]/g, '');
    setAlias(sanitizedValue);
  };

  return (
    <div className="p-8 text-white">
      <div className="max-w-2xl mx-auto">
        <div className="flex items-center justify-between mb-8">
          <h1 className="text-2xl font-bold">Create New Event Series</h1>
          <Link href="/admin" className="text-slate-300 hover:text-white flex items-center">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-1" viewBox="0 0 20 20" fill="currentColor">
              <path fillRule="evenodd" d="M9.707 16.707a1 1 0 01-1.414 0l-6-6a1 1 0 010-1.414l6-6a1 1 0 011.414 1.414L5.414 9H17a1 1 0 110 2H5.414l4.293 4.293a1 1 0 010 1.414z" clipRule="evenodd" />
            </svg>
            Back to Dashboard
          </Link>
        </div>

        <div className="bg-slate-800 rounded-lg p-6 shadow-lg">
          {errors.general && (
            <div className="bg-red-500/10 border border-red-500/20 rounded p-4 mb-6 text-red-500">
              {errors.general}
            </div>
          )}
          
          <form onSubmit={handleSubmit}>
            <div className="space-y-6">
              <div>
                <label htmlFor="name" className="block text-sm font-medium text-slate-300 mb-1">
                  Series Name <span className="text-pink-500">*</span>
                </label>
                <input
                  type="text"
                  id="name"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="w-full bg-slate-700 border border-slate-600 rounded-md py-2 px-3 text-white focus:outline-none focus:ring-2 focus:ring-pink-500 focus:border-transparent"
                  placeholder="e.g. The Smith Wedding"
                />
                {errors.name && (
                  <p className="mt-1 text-sm text-red-500">{errors.name}</p>
                )}
              </div>
              
              <div>
                <label htmlFor="alias" className="block text-sm font-medium text-slate-300 mb-1">
                  Alias <span className="text-pink-500">*</span>
                  <span className="ml-2 text-xs text-slate-400">
                    (Used in URLs, must be unique)
                  </span>
                </label>
                <div className="relative">
                  <input
                    type="text"
                    id="alias"
                    value={alias}
                    onChange={(e) => handleAliasChange(e.target.value)}
                    className="w-full bg-slate-700 border border-slate-600 rounded-md py-2 px-3 text-white focus:outline-none focus:ring-2 focus:ring-pink-500 focus:border-transparent"
                    placeholder="e.g. smith-wedding"
                  />
                  {isCheckingAlias && (
                    <div className="absolute right-3 top-2.5">
                      <svg className="animate-spin h-5 w-5 text-slate-400" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                      </svg>
                    </div>
                  )}
                </div>
                <p className="mt-1 text-xs text-slate-400">
                  Only lowercase letters, numbers, hyphens, and underscores allowed
                </p>
                {errors.alias && (
                  <p className="mt-1 text-sm text-red-500">{errors.alias}</p>
                )}
              </div>
              
              <div>
                <label htmlFor="description" className="block text-sm font-medium text-slate-300 mb-1">
                  Description <span className="text-xs text-slate-400">(Optional)</span>
                </label>
                <textarea
                  id="description"
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  rows={3}
                  className="w-full bg-slate-700 border border-slate-600 rounded-md py-2 px-3 text-white focus:outline-none focus:ring-2 focus:ring-pink-500 focus:border-transparent"
                  placeholder="A brief description of this event series"
                ></textarea>
              </div>
              
              <div className="pt-4">
                <button
                  type="submit"
                  disabled={isSubmitting || isCheckingAlias || Object.keys(errors).length > 0}
                  className={`w-full flex justify-center py-3 px-4 border border-transparent rounded-md shadow-sm text-white font-medium
                    ${(isSubmitting || isCheckingAlias || Object.keys(errors).length > 0)
                      ? 'bg-pink-500/50 cursor-not-allowed'
                      : 'bg-pink-600 hover:bg-pink-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-pink-500'
                    }`}
                >
                  {isSubmitting ? (
                    <span className="flex items-center">
                      <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                      </svg>
                      Creating...
                    </span>
                  ) : (
                    'Create Event Series'
                  )}
                </button>
              </div>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
} 