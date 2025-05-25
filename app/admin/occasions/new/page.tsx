'use client';

import { useRouter } from 'next/navigation';
import { useAuth } from '../../../../src/contexts/AuthContext';
import CreateOrUpdateOccasionCard from '@/src/components/Occasion/CreateOrUpdateOccasionCard/CreateOrUpdateOccasionCard';
import { useOccasionManagement } from '@/src/hooks/useOccasionManagement';
import { Occasion } from '@/src/models/interfaces';

export default function NewOccasion() {
  const router = useRouter();
  const { user } = useAuth();

  const {
    handleAddOccasion,
    error: occasionError
  } = useOccasionManagement();

  const handleSubmit = async (occasionData: Partial<Occasion>, imageFile: File | null) => {
    try {
      await handleAddOccasion(occasionData, imageFile);
      router.push('/admin/');
    } catch (error) {
      console.error('Error creating occasion:', error);
    }
  };

  const handleCancel = () => {
    router.push('/admin/');
  };

  return (
    <div className="p-8 text-[var(--blossom-text-dark)]">
      <div className="max-w-2xl mx-auto">

        {occasionError && (
          <div className="bg-red-100 border border-red-400 text-red-700 p-4 rounded-lg mb-6">
            <h2 className="text-xl font-semibold mb-2">Error</h2>
            <p>{occasionError}</p>
          </div>
        )}
        
        <CreateOrUpdateOccasionCard
          onSubmit={handleSubmit}
          onClose={handleCancel}
          isOpen={true}
          editingOccasion={null}
          userId={user?.uid || ''}
        />
      </div>
    </div>
  );
} 