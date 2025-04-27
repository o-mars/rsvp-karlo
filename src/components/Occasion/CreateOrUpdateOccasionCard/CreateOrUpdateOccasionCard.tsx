'use client';

import { useState, useEffect } from 'react';
import { Timestamp, query, collection, where, getDocs } from 'firebase/firestore';
import { db } from '@/utils/firebase';
import { Occasion } from '@/src/models/interfaces';

interface CreateOrUpdateOccasionCardProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (occasion: Partial<Occasion>) => void;
  editingOccasion?: Occasion | null;
  userId: string;
}

export default function CreateOrUpdateOccasionCard({
  isOpen,
  onClose,
  onSubmit,
  editingOccasion,
  userId
}: CreateOrUpdateOccasionCardProps) {
  const [name, setName] = useState(editingOccasion?.name || '');
  const [alias, setAlias] = useState(editingOccasion?.alias || '');
  const [description, setDescription] = useState(editingOccasion?.description || '');
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
      if (editingOccasion && alias === editingOccasion.alias) {
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
  }, [alias, editingOccasion]);

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
    if (!(editingOccasion && alias === editingOccasion.alias)) {
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
        
        const occasionData = {
          name: name.trim(),
          alias: alias.trim(),
          ...(description ? { description: description.trim() } : {}),
          createdBy: userId,
          ...(editingOccasion ? {} : { createdAt: Timestamp.now() })
        };
        
        onSubmit(occasionData);
      } catch (error) {
        console.error('Error with occasion:', error);
        setErrors({
          general: 'An error occurred. Please try again.'
        });
      } finally {
        setIsSubmitting(false);
      }
    } else {
      // If editing with same alias, just submit the data
      const occasionData = {
        name: name.trim(),
        alias: alias.trim(),
        description: description.trim() || undefined,
        createdBy: userId
      };
      
      onSubmit(occasionData);
    }
  };

  const handleAliasChange = (value: string) => {
    // Allow only valid characters
    const sanitizedValue = value.toLowerCase().replace(/[^a-z0-9_-]/g, '');
    setAlias(sanitizedValue);
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto">
      {/* Background overlay */}
      <div 
        className="fixed inset-0 bg-black/50 transition-opacity" 
        aria-hidden="true"
        style={{ zIndex: -1 }}
      ></div>
      
      {/* Modal content */}
      <div className="flex min-h-full items-end justify-center p-4 text-center sm:items-center sm:p-0">
        <div className="relative transform overflow-hidden rounded-lg bg-white px-4 pb-4 pt-5 text-left shadow-xl transition-all sm:my-8 sm:w-full sm:max-w-2xl sm:p-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-xl font-semibold text-[var(--blossom-text-dark)]" id="modal-title">
              {editingOccasion ? 'Edit Occasion' : 'Create New Occasion'}
            </h3>
            <button
              onClick={onClose}
              className="text-[var(--blossom-text-dark)]/70 hover:text-[var(--blossom-text-dark)]"
            >
              <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>

          {errors.general && (
            <div className="bg-red-500/10 border border-red-500/20 rounded p-4 mb-6 text-red-500">
              {errors.general}
            </div>
          )}
          
          <form onSubmit={handleSubmit}>
            <div className="space-y-6">
              <div>
                <label htmlFor="name" className="block text-sm font-medium text-[var(--blossom-text-dark)] mb-1">
                  Occasion Name <span className="text-[var(--blossom-pink-primary)]">*</span>
                </label>
                <input
                  type="text"
                  id="name"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="w-full bg-[var(--blossom-pink-light)] border border-[var(--blossom-border)] rounded-md py-2 px-3 text-[var(--blossom-text-dark)] focus:outline-none focus:ring-2 focus:ring-[var(--blossom-pink-primary)] focus:border-transparent"
                  placeholder="e.g. The Smith Wedding"
                />
                {errors.name && (
                  <p className="mt-1 text-sm text-red-500">{errors.name}</p>
                )}
              </div>
              
              <div>
                <label htmlFor="alias" className="block text-sm font-medium text-[var(--blossom-text-dark)] mb-1">
                  Alias <span className="text-[var(--blossom-pink-primary)]">*</span>
                  <span className="ml-2 text-xs text-[var(--blossom-text-dark)]/70">
                    (Used in URLs, must be unique)
                  </span>
                </label>
                <div className="relative">
                  <input
                    type="text"
                    id="alias"
                    value={alias}
                    onChange={(e) => handleAliasChange(e.target.value)}
                    className="w-full bg-[var(--blossom-pink-light)] border border-[var(--blossom-border)] rounded-md py-2 px-3 text-[var(--blossom-text-dark)] focus:outline-none focus:ring-2 focus:ring-[var(--blossom-pink-primary)] focus:border-transparent"
                    placeholder="e.g. smith-wedding"
                    disabled={editingOccasion !== null && editingOccasion !== undefined}
                  />
                  {isCheckingAlias && (
                    <div className="absolute right-3 top-2.5">
                      <svg className="animate-spin h-5 w-5 text-[var(--blossom-text-dark)]/70" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                      </svg>
                    </div>
                  )}
                </div>
                <p className="mt-1 text-xs text-[var(--blossom-text-dark)]/70">
                  Only lowercase letters, numbers, hyphens, and underscores allowed
                </p>
                {errors.alias && (
                  <p className="mt-1 text-sm text-red-500">{errors.alias}</p>
                )}
              </div>
              
              <div>
                <label htmlFor="description" className="block text-sm font-medium text-[var(--blossom-text-dark)] mb-1">
                  Description <span className="text-xs text-[var(--blossom-text-dark)]/70">(Optional)</span>
                </label>
                <textarea
                  id="description"
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  rows={3}
                  className="w-full bg-[var(--blossom-pink-light)] border border-[var(--blossom-border)] rounded-md py-2 px-3 text-[var(--blossom-text-dark)] focus:outline-none focus:ring-2 focus:ring-[var(--blossom-pink-primary)] focus:border-transparent"
                  placeholder="A brief description of this occasion"
                ></textarea>
              </div>
              
              <div className="pt-4 flex justify-end space-x-4">
                <button
                  type="button"
                  onClick={onClose}
                  className="px-4 py-2 bg-white border border-[var(--blossom-border)] text-[var(--blossom-text-dark)] rounded hover:bg-[var(--blossom-pink-light)] transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting || isCheckingAlias || Object.keys(errors).length > 0}
                  className={`px-4 py-2 rounded text-white ${
                    (isSubmitting || isCheckingAlias || Object.keys(errors).length > 0)
                      ? 'bg-[var(--blossom-pink-primary)]/50 cursor-not-allowed'
                      : 'bg-[var(--blossom-pink-primary)] hover:bg-[var(--blossom-pink-hover)]'
                  }`}
                >
                  {isSubmitting ? (
                    <span className="flex items-center">
                      <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                      </svg>
                      {editingOccasion ? 'Updating...' : 'Creating...'}
                    </span>
                  ) : (
                    editingOccasion ? 'Update Occasion' : 'Create Occasion'
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