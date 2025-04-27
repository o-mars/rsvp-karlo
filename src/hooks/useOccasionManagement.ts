'use client';

import { useState, useEffect } from 'react';
import { collection, getDocs, doc, query, where, limit, writeBatch } from 'firebase/firestore';
import { db } from '@/utils/firebase';
import { Occasion } from '@/src/models/interfaces';
import { useOccasion } from '@/src/contexts/OccasionContext';

interface UseOccasionManagementProps {
  alias?: string | null;
  useContext?: boolean;
  userId?: string | null;
}

export function useOccasionManagement({ alias, useContext = true, userId = null }: UseOccasionManagementProps = {}) {
  const [occasion, setOccasion] = useState<Occasion | null>(null);
  const [occasionList, setOccasionList] = useState<Occasion[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [aliasDoc, setAliasDoc] = useState<{id: string, occasionId: string} | null>(null);

  // Try to use the occasion context if available and requested
  let occasionContext = null;
  
  if (useContext) {
    try {
      // eslint-disable-next-line react-hooks/rules-of-hooks
      occasionContext = useOccasion();
    } catch {
      // Context not available, continue without it
    }
  }

  const fetchOccasion = async () => {
    if (!alias) return;
    
    setLoading(true);
    setError(null);
    
    try {
      // Find the event series by alias
      const occasionQuery = query(
        collection(db, 'occasions'), 
        where('alias', '==', alias),
        limit(1)
      );
      
      const querySnapshot = await getDocs(occasionQuery);
      
      if (querySnapshot.empty) {
        setError('Occasion not found');
        setLoading(false);
        return;
      }
      
      // Get the first matching document
      const occasionDoc = querySnapshot.docs[0];
      const occasionData = {
        id: occasionDoc.id,
        ...occasionDoc.data()
      } as Occasion;
      
      setOccasion(occasionData);
      
      // Find the alias document
      const aliasQuery = query(
        collection(db, 'aliases'),
        where('alias', '==', alias)
      );
      const aliasSnapshot = await getDocs(aliasQuery);
      
      if (!aliasSnapshot.empty) {
        const aliasDocData = aliasSnapshot.docs[0];
        setAliasDoc({
          id: aliasDocData.id,
          occasionId: aliasDocData.data().occasionId
        });
      }
    } catch (err) {
      console.error('Error fetching occasion:', err);
      setError('Error loading occasion. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const fetchAllOccasions = async () => {
    if (!userId) return;
    
    setLoading(true);
    setError(null);
    
    try {
      const occasionQuery = query(
        collection(db, 'occasions'), 
        where('createdBy', '==', userId)
      );
      
      const querySnapshot = await getDocs(occasionQuery);
      const occasionList = querySnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      })) as Occasion[];
      
      // Sort by createdAt in descending order
      occasionList.sort((a, b) => {
        const dateA = a.createdAt?.toDate ? a.createdAt.toDate() : a.createdAt.toDate();
        const dateB = b.createdAt?.toDate ? b.createdAt.toDate() : b.createdAt.toDate();
        return dateB.getTime() - dateA.getTime();
      });
      
      setOccasionList(occasionList);
    } catch (err) {
      console.error('Error fetching occasion list:', err);
      setError('Error loading occasion list. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleUpdateOccasion = async (updatedOccasion: Partial<Occasion>) => {
    if (!occasion || !aliasDoc) return;
    
    try {
      // Create a batch to update both documents atomically
      const batch = writeBatch(db);
      
      // Update the occasion document
      const occasionRef = doc(db, 'occasions', occasion.id);
      batch.update(occasionRef, updatedOccasion);
      
      // If alias has changed, update the alias document and all events
      if (updatedOccasion.alias && updatedOccasion.alias !== alias && alias) {
        // Update the alias in the alias document
        const aliasDocRef = doc(db, 'aliases', aliasDoc.id);
        batch.update(aliasDocRef, { alias: updatedOccasion.alias });
        
        // Update all events that use this alias
        const eventsQuery = query(
          collection(db, 'events'),
          where('occasionAlias', '==', alias)
        );
        const eventsSnapshot = await getDocs(eventsQuery);
        
        eventsSnapshot.forEach(eventDoc => {
          batch.update(doc(db, 'events', eventDoc.id), {
            occasionAlias: updatedOccasion.alias
          });
        });
      }
      
      // Commit the batch
      await batch.commit();
      
      // Use context refresh if available, otherwise update local state
      if (occasionContext && occasionContext.refreshData && !alias) {
        await occasionContext.refreshData();
      } else {
        setOccasion(prev => prev ? { ...prev, ...updatedOccasion } : null);
      }
      
      return true;
    } catch (error) {
      console.error('Error updating occasion:', error);
      throw error;
    }
  };

  const handleDeleteOccasion = async () => {
    if (!occasion || !aliasDoc) return;
    
    try {
      // Create a batch to delete all related documents atomically
      const batch = writeBatch(db);
      
      // Delete the occasion document
      const occasionRef = doc(db, 'occasions', occasion.id);
      batch.delete(occasionRef);
      
      // Delete the alias document
      const aliasDocRef = doc(db, 'aliases', aliasDoc.id);
      batch.delete(aliasDocRef);
      
      // Delete all events in this series
      const eventsQuery = query(
        collection(db, 'events'),
        where('occasionId', '==', occasion.id)
      );
      const eventsSnapshot = await getDocs(eventsQuery);
      
      eventsSnapshot.forEach(eventDoc => {
        batch.delete(doc(db, 'events', eventDoc.id));
      });
      
      // Delete all guests in this series
      const guestsQuery = query(
        collection(db, 'guests'),
        where('occasionId', '==', occasion.id)
      );
      const guestsSnapshot = await getDocs(guestsQuery);
      
      guestsSnapshot.forEach(guestDoc => {
        batch.delete(doc(db, 'guests', guestDoc.id));
      });
      
      // Commit the batch
      await batch.commit();
      
      // Use context refresh if available, otherwise update local state
      if (occasionContext && occasionContext.refreshData && !alias) {
        await occasionContext.refreshData();
      } else {
        setOccasion(null);
        setAliasDoc(null);
      }
      
      return true;
    } catch (error) {
      console.error('Error deleting occasion:', error);
      throw error;
    }
  };

  const handleAddOccasion = async (newOccasion: Partial<Occasion>) => {
    if (!userId) return;
    
    try {
      if (!newOccasion.alias) {
        throw new Error('Alias is required');
      }

      // Perform final alias uniqueness check
      const aliasQuery = query(
        collection(db, 'aliases'),
        where('alias', '==', newOccasion.alias)
      );
      const aliasSnapshot = await getDocs(aliasQuery);
      
      if (!aliasSnapshot.empty) {
        throw new Error('This alias is already taken. Please choose another.');
      }
      
      // Create a new occasion document reference with auto-generated ID
      const newOccasionRef = doc(collection(db, 'occasions'));
      const occasionId = newOccasionRef.id;
      
      // Create a batch to perform both operations atomically
      const batch = writeBatch(db);
      
      // Add the occasion document
      batch.set(newOccasionRef, {
        ...newOccasion,
        createdBy: userId,
        createdAt: new Date()
      });
      
      // Add the alias document with an auto-generated ID
      const aliasDocRef = doc(collection(db, 'aliases'));
      batch.set(aliasDocRef, {
        alias: newOccasion.alias,
        occasionId,
        createdBy: userId,
        createdAt: new Date()
      });
      
      // Commit the batch
      await batch.commit();
      
      // Refresh the list if we're in list mode
      if (!alias) {
        await fetchAllOccasions();
      }
      
      return occasionId;
    } catch (error) {
      console.error('Error creating occasion:', error);
      throw error;
    }
  };

  // Initialize data
  useEffect(() => {
    if (userId) {
      fetchAllOccasions();
    } else if (alias) {
      fetchOccasion();
    }
  }, [alias, userId]);

  return {
    occasion,
    occasionList,
    loading,
    error,
    aliasDoc,
    fetchOccasion,
    fetchAllOccasions,
    handleUpdateOccasion,
    handleDeleteOccasion,
    handleAddOccasion
  };
} 