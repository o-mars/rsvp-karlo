'use client';

import { useState, useEffect } from 'react';
import { collection, getDocs, doc, query, where, limit, runTransaction, writeBatch } from 'firebase/firestore';
import { ref, uploadBytes, getDownloadURL, listAll, deleteObject } from 'firebase/storage';
import { db, storage } from '@/utils/firebase';
import { Occasion } from '@/src/models/interfaces';
import { useOccasion } from '@/src/contexts/OccasionContext';
import { useAuth } from '@/src/contexts/AuthContext';

interface UseOccasionManagementProps {
  alias?: string | null;
  useContext?: boolean;
}

export function useOccasionManagement({ alias, useContext = true }: UseOccasionManagementProps = {}) {
  const { user } = useAuth();
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
    if (!alias || !user?.uid) return;
    
    setLoading(true);
    setError(null);
    
    try {
      // Find the event series by alias
      const occasionQuery = query(
        collection(db, 'occasions'),
        where('createdBy', '==', user.uid),
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
    if (!user?.uid) return;
    
    setLoading(true);
    setError(null);
    
    try {
      const occasionQuery = query(
        collection(db, 'occasions'),
        where('createdBy', '==', user.uid)
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
      
      const occasion = occasionList.find(o => o.alias === alias);
      if (occasion) {
        setOccasion(occasion);
      }
    } catch (err) {
      console.error('Error fetching occasion list:', err);
      setError('Error loading occasion list. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const uploadOccasionImage = async (file: File): Promise<string> => {
    try {
      if (!user?.uid || !occasion?.alias || !occasion?.id) {
        throw new Error('User ID, occasion alias, and occasion ID are required');
      }

      const fileExtension = file.name.split('.').pop()?.toLowerCase() || 'jpg';
      // Use occasionId in path for security, but keep alias for organization
      const storageRef = ref(storage, `${occasion.alias}/occasion/${occasion.id}/occasion-invite.${fileExtension}`);
      
      // Add metadata with creator information
      const metadata = {
        customMetadata: {
          createdBy: user.uid,
          occasionId: occasion.id,
          createdAt: new Date().toISOString()
        }
      };
      
      const snapshot = await uploadBytes(storageRef, file, metadata);
      return await getDownloadURL(snapshot.ref);
    } catch (error) {
      console.error('Error uploading occasion image:', error);
      throw error;
    }
  };

  const handleUpdateOccasion = async (updatedOccasion: Partial<Occasion>, imageFile: File | null) => {
    if (!occasion) {
      console.error('Update failed: occasion is null');
      throw new Error('Occasion data is required for update');
    }
    if (!aliasDoc) {
      console.error('Update failed: aliasDoc is null');
      throw new Error('Alias document is required for update');
    }
    if (!user?.uid) {
      console.error('Update failed: user.uid is null');
      throw new Error('User ID is required for update');
    }
    
    try {
      let imageUrl: string | undefined;

      // If there's a new image file, upload it first
      if (imageFile) {
        const fileExtension = imageFile.name.split('.').pop()?.toLowerCase() || 'jpg';
        const storageRef = ref(storage, `${occasion.alias}/occasion/${occasion.id}/occasion-invite.${fileExtension}`);
        
        const metadata = {
          customMetadata: {
            createdBy: user.uid,
            occasionId: occasion.id,
            createdAt: new Date().toISOString()
          }
        };
        
        const snapshot = await uploadBytes(storageRef, imageFile, metadata);
        imageUrl = await getDownloadURL(snapshot.ref);
      }

      // Use a transaction to update the occasion
      await runTransaction(db, async (transaction) => {
        const occasionRef = doc(db, 'occasions', occasion.id);
        const occasionDoc = await transaction.get(occasionRef);
        
        if (!occasionDoc.exists()) {
          throw new Error('Occasion does not exist');
        }

        // Remove alias from updatedOccasion to prevent updates
        // eslint-disable-next-line @typescript-eslint/no-unused-vars
        const { alias: removedAlias, ...updateData } = updatedOccasion;
        
        // Update with new data and image URL if we uploaded one
        transaction.update(occasionRef, {
          ...updateData,
          ...(imageUrl ? { inviteImageUrl: imageUrl } : {})
        });
      });

      // Use context refresh if available, otherwise update local state
      if (occasionContext && occasionContext.refreshData && !alias) {
        await occasionContext.refreshData();
      } else {
        setOccasion(prev => prev ? { 
          ...prev, 
          ...updatedOccasion,
          ...(imageUrl ? { inviteImageUrl: imageUrl } : {})
        } : null);
      }
    } catch (error) {
      console.error('Error updating occasion:', error);
      throw error;
    }
  };

  const handleDeleteOccasion = async (occasionToDelete: Occasion) => {
    if (!occasionToDelete || !user?.uid) {
      console.error('Delete failed: Missing required data', { 
        hasOccasion: !!occasionToDelete, 
        hasUserId: !!user?.uid 
      });
      return;
    }

    try {
      // Create a batch to delete all related documents atomically
      const batch = writeBatch(db);
      
      // 1. Add all guests to batch delete
      const guestsQuery = query(
        collection(db, 'guests'),
        where('createdBy', '==', user.uid),
        where('occasionId', '==', occasionToDelete.id)
      );
      const guestsSnapshot = await getDocs(guestsQuery);
      
      guestsSnapshot.forEach(guestDoc => {
        batch.delete(doc(db, 'guests', guestDoc.id));
      });

      // 2. Add all events to batch delete
      const eventsQuery = query(
        collection(db, 'events'),
        where('createdBy', '==', user.uid),
        where('occasionId', '==', occasionToDelete.id)
      );
      const eventsSnapshot = await getDocs(eventsQuery);
      
      eventsSnapshot.forEach(eventDoc => {
        batch.delete(doc(db, 'events', eventDoc.id));
      });

      // 3. Add alias document to batch delete
      const aliasDocRef = doc(db, 'aliases', occasionToDelete.alias);
      batch.delete(aliasDocRef);

      // 4. Add occasion document to batch delete
      const occasionRef = doc(db, 'occasions', occasionToDelete.id);
      batch.delete(occasionRef);
      
      // 5. Delete all storage files associated with this occasion
      try {
        // List all files in the occasion's storage folder
        const occasionStorageRef = ref(storage, `${occasionToDelete.alias}/occasion/${occasionToDelete.id}`);
        const storageList = await listAll(occasionStorageRef);
        
        // Delete each file
        const deletePromises = storageList.items.map(item => deleteObject(item));
        await Promise.all(deletePromises);
      } catch (error) {
        console.error('Error deleting storage files:', error);
        // Don't throw here - we still want to proceed with the database deletions
      }
      
      // Commit the batch
      await batch.commit();
      
      // Update state after successful deletion
      if (occasionContext && occasionContext.refreshData && !alias) {
        await occasionContext.refreshData();
      } else {
        setOccasion(null);
        setAliasDoc(null);
        // Refresh the occasion list
        await fetchAllOccasions();
      }
      
      return true;
    } catch (error) {
      console.error('Error in deletion process:', error);
      throw error;
    }
  };

  const handleAddOccasion = async (newOccasion: Partial<Occasion>, imageFile: File | null) => {
    if (!user?.uid) return;
    
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
      const occasionsRef = collection(db, 'occasions');
      const newOccasionRef = doc(occasionsRef);
      const occasionId = newOccasionRef.id;

      let imageUrl: string | undefined;

      // If there's an image file, upload it first
      if (imageFile) {
        const fileExtension = imageFile.name.split('.').pop()?.toLowerCase() || 'jpg';
        const storageRef = ref(storage, `${newOccasion.alias}/occasion/${occasionId}/occasion-invite.${fileExtension}`);
        
        const metadata = {
          customMetadata: {
            createdBy: user.uid,
            occasionId,
            createdAt: new Date().toISOString()
          }
        };
        
        const snapshot = await uploadBytes(storageRef, imageFile, metadata);
        imageUrl = await getDownloadURL(snapshot.ref);
      }
      
      // Use a transaction to create both documents atomically
      await runTransaction(db, async (transaction) => {
        // Add the occasion document
        transaction.set(newOccasionRef, {
          ...newOccasion,
          createdBy: user.uid,
          createdAt: new Date(),
          ...(imageUrl ? { inviteImageUrl: imageUrl } : {})
        });
        
        // Add the alias document
        const aliasesRef = collection(db, 'aliases');
        const aliasDocRef = doc(aliasesRef, newOccasion.alias);
        transaction.set(aliasDocRef, {
          alias: newOccasion.alias,
          occasionId,
          createdBy: user.uid,
          createdAt: new Date()
        });
      });
      
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
    if (alias) {
      fetchOccasion();
    } else if (user?.uid) {
      fetchAllOccasions();
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [alias, user?.uid]);

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
    handleAddOccasion,
    uploadOccasionImage
  };
} 