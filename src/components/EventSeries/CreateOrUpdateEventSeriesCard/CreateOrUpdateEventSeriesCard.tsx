'use client';

import { useState, useEffect } from 'react';
import { Timestamp, query, collection, where, getDocs } from 'firebase/firestore';
import { db } from '@/utils/firebase';
import { EventSeries } from '@/src/models/interfaces';

interface CreateOrUpdateEventSeriesCardProps {
  onSubmit: (eventSeries: Partial<EventSeries>) => void;
  onCancel: () => void;
  editingEventSeries?: EventSeries | null;
  userId: string;
}

export default function CreateOrUpdateEventSeriesCard({
  onSubmit,
  onCancel,
  editingEventSeries,
  userId
}: CreateOrUpdateEventSeriesCardProps) {
  const [name, setName] = useState(editingEventSeries?.name || '');
  const [alias, setAlias] = useState(editingEventSeries?.alias || '');
  const [description, setDescription] = useState(editingEventSeries?.description || '');
  const [errors, setErrors] = useState<{
    name?: string;
    alias?: string;
    general?: string;
  }>({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isCheckingAlias, setIsCheckingAlias] = useState(false);

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
      
      // Skip uniqueness check if we're editing and alias is the same
      if (editingEventSeries && alias === editingEventSeries.alias) {
        return;
      }
      
      // Debounce the uniqueness check
      timeoutId = setTimeout(() => {
        checkAliasUniqueness(alias);
      }, 500);
    }
    
    return () => {
      if (timeoutId) clearTimeout(timeoutId);
    };
  }, [alias, editingEventSeries]);

  const checkAliasUniqueness = async (aliasToCheck: string) => {
    if (!aliasToCheck) return;
    
    setIsCheckingAlias(true);
    try {
      // Check if alias exists by querying for documents with that alias
      const aliasQuery = query(
        collection(db, 'aliases'),
        where('alias', '==', aliasToCheck)
      );
      const aliasSnapshot = await getDocs(aliasQuery);
      
      if (!aliasSnapshot.empty) {
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
    
    // If we got here and we're editing with the same alias, skip final check
    if (!(editingEventSeries && alias === editingEventSeries.alias)) {
      // If we got here, we need to check alias uniqueness one more time
      setIsSubmitting(true);
      
      try {
        // Final check for alias uniqueness
        const aliasQuery = query(
          collection(db, 'aliases'),
          where('alias', '==', alias)
        );
        const aliasSnapshot = await getDocs(aliasQuery);
        
        if (!aliasSnapshot.empty) {
          setErrors({
            alias: 'This alias is already taken. Please choose another.'
          });
          setIsSubmitting(false);
          return;
        }
        
        const eventSeriesData = {
          name: name.trim(),
          alias: alias.trim(),
          ...(description ? { description: description.trim() } : {}),
          createdBy: userId,
          ...(editingEventSeries ? {} : { createdAt: Timestamp.now() })
        };
        
        onSubmit(eventSeriesData);
      } catch (error) {
        console.error('Error with event series:', error);
        setErrors({
          general: 'An error occurred. Please try again.'
        });
      } finally {
        setIsSubmitting(false);
      }
    } else {
      // If editing with same alias, just submit the data
      const eventSeriesData = {
        name: name.trim(),
        alias: alias.trim(),
        description: description.trim() || undefined,
        createdBy: userId
      };
      
      onSubmit(eventSeriesData);
    }
  };

  const handleAliasChange = (value: string) => {
    // Allow only valid characters
    const sanitizedValue = value.toLowerCase().replace(/[^a-z0-9_-]/g, '');
    setAlias(sanitizedValue);
  };

  return (
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
                disabled={editingEventSeries !== null && editingEventSeries !== undefined}
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
          
          <div className="pt-4 flex justify-end space-x-4">
            <button
              type="button"
              onClick={onCancel}
              className="px-4 py-2 bg-slate-600 text-white rounded hover:bg-slate-500 transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSubmitting || isCheckingAlias || Object.keys(errors).length > 0}
              className={`px-4 py-2 rounded text-white ${
                (isSubmitting || isCheckingAlias || Object.keys(errors).length > 0)
                  ? 'bg-pink-500/50 cursor-not-allowed'
                  : 'bg-pink-600 hover:bg-pink-700'
              }`}
            >
              {isSubmitting ? (
                <span className="flex items-center">
                  <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                  {editingEventSeries ? 'Updating...' : 'Creating...'}
                </span>
              ) : (
                editingEventSeries ? 'Update Event Series' : 'Create Event Series'
              )}
            </button>
          </div>
        </div>
      </form>
    </div>
  );
} 