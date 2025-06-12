"use client";

import { useState, useEffect } from "react";
import {
  collection,
  getDocs,
  query,
  doc,
  updateDoc,
  addDoc,
  where,
  deleteDoc,
} from "firebase/firestore";
import { db } from "@/utils/firebase";
import { useOccasion } from "@/src/contexts/OccasionContext";
import { useAuth } from "@/src/contexts/AuthContext";
import { Guest, Tag } from "@/src/models/interfaces";

interface UseTagManagementProps {
  occasionId?: string;
  useContext?: boolean;
  guests?: Guest[];
}

export function useTagManagement({
  occasionId,
  useContext = true,
  guests = [],
}: UseTagManagementProps = {}) {
  const { user } = useAuth();
  const [tags, setTags] = useState<Tag[]>([]);
  const [loading, setLoading] = useState(true);
  const [editingTag, setEditingTag] = useState<Tag | null>(null);

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

  const fetchData = async () => {
    if (!user?.uid) return;

    try {
      let tagsQuery;

      if (occasionId || occasionContext?.occasion?.id) {
        const seriesId = occasionId || occasionContext?.occasion?.id;
        tagsQuery = query(
          collection(db, "tags"),
          where("createdBy", "==", user.uid),
          where("occasionId", "==", seriesId)
        );
      } else {
        tagsQuery = query(
          collection(db, "tags"),
          where("createdBy", "==", user.uid)
        );
      }

      const tagsSnapshot = await getDocs(tagsQuery);

      const tagsList = tagsSnapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
      })) as Tag[];

      setTags(tagsList);
      setLoading(false);
    } catch (error) {
      console.error("Error fetching tags:", error);
      setLoading(false);
    }
  };

  const checkDuplicateTagName = (name: string, excludeTagId?: string): void => {
    const existingTag = tags.find(
      (tag) => (!excludeTagId || tag.id !== excludeTagId) && tag.name === name
    );

    if (existingTag) {
      throw new Error(`A tag named "${name}" already exists in this occasion`);
    }
  };

  const handleAddTag = async (tagData: Partial<Tag>) => {
    if (!tagData.name) return;

    try {
      const id = occasionId || occasionContext?.occasion?.id;
      if (!id) {
        throw new Error("No occasion ID provided");
      }

      checkDuplicateTagName(tagData.name);

      const newTag = {
        ...tagData,
        occasionId: id,
        createdBy: user?.uid,
      };

      const docRef = await addDoc(collection(db, "tags"), newTag);

      // Update local state with the new tag
      const createdTag = {
        ...newTag,
        id: docRef.id,
      } as Tag;

      setTags((prevTags) => [...prevTags, createdTag]);

      if (occasionContext && occasionContext.refreshData && !occasionId) {
        await occasionContext.refreshData();
      }
    } catch (error) {
      console.error("Error adding tag:", error);
      throw error;
    }
  };

  const handleUpdateTag = async (tagData: Partial<Tag>) => {
    if (!tagData.id || !tagData.name) return;

    try {
      checkDuplicateTagName(tagData.name, tagData.id);

      const updatedFields = {
        name: tagData.name,
        color: tagData.color || "",
      };

      await updateDoc(doc(db, "tags", tagData.id), updatedFields);

      // Update local state with the updated tag
      setTags((prevTags) =>
        prevTags.map((tag) =>
          tag.id === tagData.id ? { ...tag, ...updatedFields } : tag
        )
      );

      if (occasionContext && occasionContext.refreshData && !occasionId) {
        await occasionContext.refreshData();
      }
    } catch (error) {
      console.error("Error updating tag:", error);
      throw error;
    }
  };

  const handleDeleteTag = async (tagToDelete: Tag) => {
    try {
      // Check if any guests are using this tag using the provided guests data
      const guestsUsingTag = guests.filter((guest) =>
        guest.tags?.includes(tagToDelete.id)
      );

      if (guestsUsingTag.length > 0) {
        throw new Error(
          `Cannot delete tag "${tagToDelete.name}" as it is being used by ${guestsUsingTag.length} guest(s)`
        );
      }

      await deleteDoc(doc(db, "tags", tagToDelete.id));

      // Update local state by removing the deleted tag
      setTags((prevTags) =>
        prevTags.filter((tag) => tag.id !== tagToDelete.id)
      );

      if (occasionContext && occasionContext.refreshData && !occasionId) {
        await occasionContext.refreshData();
      }

      return true;
    } catch (error) {
      console.error("Error in deletion process:", error);
      throw error;
    }
  };

  // Initialize data
  useEffect(() => {
    fetchData();
  }, [occasionId, occasionContext?.occasion?.id]);

  return {
    tags,
    loading,
    editingTag,
    setEditingTag,
    fetchData,
    handleAddTag,
    handleUpdateTag,
    handleDeleteTag,
  };
}
