import { useState, useEffect } from "react";
import { Tag } from "@/src/models/interfaces";
import CreateOrUpdateTag from "../CreateOrUpdateTag/CreateOrUpdateTag";
import DeleteConfirmationModal from "@/src/components/shared/DeleteConfirmationModal";

interface SelectTagsCardProps {
  tags: Tag[];
  selectedTagIds: string[];
  onUpdateTag: (tag: Partial<Tag>) => Promise<void>;
  onDeleteTag: (tagId: string) => Promise<void>;
  onCreateTag: (tag: Partial<Tag>) => Promise<void>;
  onApply: (selectedTagIds: string[]) => void;
  mode: "filter" | "apply";
}

export default function SelectTagsCard({
  tags,
  selectedTagIds,
  onUpdateTag,
  onDeleteTag,
  onCreateTag,
  onApply,
  mode,
}: SelectTagsCardProps) {
  const [editingTag, setEditingTag] = useState<Tag | null>(null);
  const [deletingTag, setDeletingTag] = useState<Tag | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);
  const [isCreatingTag, setIsCreatingTag] = useState(false);
  const [localSelectedTagIds, setLocalSelectedTagIds] =
    useState<string[]>(selectedTagIds);

  // Update local state when selectedTagIds prop changes
  useEffect(() => {
    setLocalSelectedTagIds(selectedTagIds);
  }, [selectedTagIds]);

  const handleTagSelectionChange = (tagId: string, isSelected: boolean) => {
    const newSelectedTagIds = isSelected
      ? [...localSelectedTagIds, tagId]
      : localSelectedTagIds.filter((id) => id !== tagId);

    setLocalSelectedTagIds(newSelectedTagIds);
  };

  const handleEditTag = async (tag: Partial<Tag>) => {
    try {
      await onUpdateTag(tag);
      setEditingTag(null);
    } catch (error) {
      console.error("Error updating tag:", error);
    }
  };

  const handleCreateTag = async (tag: Partial<Tag>) => {
    try {
      await onCreateTag(tag);
      setIsCreatingTag(false);
    } catch (error) {
      console.error("Error creating tag:", error);
    }
  };

  const handleDeleteTag = async () => {
    if (!deletingTag) return;

    try {
      setIsDeleting(true);
      await onDeleteTag(deletingTag.id);
      // Remove from selection if it was selected
      if (localSelectedTagIds.includes(deletingTag.id)) {
        setLocalSelectedTagIds(
          localSelectedTagIds.filter((id) => id !== deletingTag.id)
        );
      }
    } catch (error) {
      console.error("Error deleting tag:", error);
    } finally {
      setIsDeleting(false);
      setDeletingTag(null);
    }
  };

  const handleApply = () => {
    onApply(localSelectedTagIds);
  };

  return (
    <div className="bg-[var(--blossom-card-bg-secondary)] p-4 rounded-lg">
      <div className="space-y-2">
        {/* Select All/Unselect All Button */}
        <div className="flex justify-end mb-2">
          <button
            onClick={() => {
              const allTagIds = tags.map((tag) => tag.id);
              const newSelectedTagIds =
                localSelectedTagIds.length === tags.length ? [] : allTagIds;
              setLocalSelectedTagIds(newSelectedTagIds);
            }}
            className="text-sm text-[var(--blossom-pink-primary)] hover:text-[var(--blossom-pink-hover)]"
          >
            {localSelectedTagIds.length === tags.length
              ? "Unselect All"
              : "Select All"}
          </button>
        </div>

        {/* Existing Tags */}
        {tags.map((tag) => (
          <div
            key={tag.id}
            className={`flex items-center justify-between bg-white rounded-lg border border-[var(--blossom-border)] ${
              editingTag?.id === tag.id ? "py-1" : "p-3"
            }`}
          >
            {editingTag?.id === tag.id ? (
              <div className="flex items-center gap-3 w-full pl-3">
                <input
                  type="checkbox"
                  checked
                  disabled
                  className="rounded border-[var(--blossom-border)] text-[var(--blossom-pink-primary)] focus:ring-[var(--blossom-pink-primary)] opacity-50"
                />
                <div className="flex-1 -ml-1">
                  <CreateOrUpdateTag
                    onCreateTag={handleCreateTag}
                    onUpdateTag={handleEditTag}
                    onCancel={() => setEditingTag(null)}
                    initialName={tag.name}
                    initialColor={tag.color}
                    tagId={tag.id}
                  />
                </div>
              </div>
            ) : (
              <>
                <div className="flex items-center gap-3">
                  <input
                    type="checkbox"
                    checked={localSelectedTagIds.includes(tag.id)}
                    onChange={(e) =>
                      handleTagSelectionChange(tag.id, e.target.checked)
                    }
                    className="rounded border-[var(--blossom-border)] text-[var(--blossom-pink-primary)] focus:ring-[var(--blossom-pink-primary)]"
                  />
                  <div
                    className="w-4 h-4 rounded-full border border-[var(--blossom-border)]"
                    style={{ backgroundColor: tag.color }}
                  />
                  <span className="text-sm text-[var(--blossom-text-dark)]">
                    {tag.name}
                  </span>
                </div>
                <div className="flex items-center">
                  <button
                    type="button"
                    onClick={() => setEditingTag(tag)}
                    className="text-[var(--blossom-text-dark)]/50 hover:text-[var(--blossom-text-dark)] p-1"
                    title="Edit tag"
                  >
                    <svg
                      xmlns="http://www.w3.org/2000/svg"
                      className="h-5 w-5"
                      viewBox="0 0 20 20"
                      fill="currentColor"
                    >
                      <path d="M13.586 3.586a2 2 0 112.828 2.828l-.793.793-2.828-2.828.793-.793zM11.379 5.793L3 14.172V17h2.828l8.38-8.379-2.83-2.828z" />
                    </svg>
                  </button>
                  <button
                    type="button"
                    onClick={() => setDeletingTag(tag)}
                    className="text-red-500 hover:text-red-600 p-1"
                    title="Delete tag"
                  >
                    <svg
                      xmlns="http://www.w3.org/2000/svg"
                      className="h-5 w-5"
                      viewBox="0 0 20 20"
                      fill="currentColor"
                    >
                      <path
                        fillRule="evenodd"
                        d="M9 2a1 1 0 00-.894.553L7.382 4H4a1 1 0 000 2v10a2 2 0 002 2h8a2 2 0 002-2V6a1 1 0 100-2h-3.382l-.724-1.447A1 1 0 0011 2H9zM7 8a1 1 0 012 0v6a1 1 0 11-2 0V8zm5-1a1 1 0 00-1 1v6a1 1 0 102 0V8a1 1 0 00-1-1z"
                        clipRule="evenodd"
                      />
                    </svg>
                  </button>
                </div>
              </>
            )}
          </div>
        ))}

        {/* New Tag Row */}
        {isCreatingTag ? (
          <div className="bg-white py-1 rounded-lg border border-[var(--blossom-border)]">
            <div className="flex items-center gap-3 pl-3">
              <input
                type="checkbox"
                checked
                disabled
                className="rounded border-[var(--blossom-border)] text-[var(--blossom-pink-primary)] focus:ring-[var(--blossom-pink-primary)] opacity-50"
              />
              <div className="flex-1 -ml-1">
                <CreateOrUpdateTag
                  onCreateTag={handleCreateTag}
                  onUpdateTag={handleEditTag}
                  onCancel={() => setIsCreatingTag(false)}
                />
              </div>
            </div>
          </div>
        ) : (
          <button
            onClick={() => setIsCreatingTag(true)}
            className="w-full bg-white py-4 px-3 rounded-lg border border-[var(--blossom-border)] hover:bg-[var(--blossom-pink-light)]/10 transition-colors flex items-center gap-2 text-[var(--blossom-pink-primary)] hover:text-[var(--blossom-pink-primary)]"
          >
            <svg
              xmlns="http://www.w3.org/2000/svg"
              className="h-5 w-5"
              viewBox="0 0 20 20"
              fill="currentColor"
            >
              <path
                fillRule="evenodd"
                d="M10 3a1 1 0 011 1v5h5a1 1 0 110 2h-5v5a1 1 0 11-2 0v-5H4a1 1 0 110-2h5V4a1 1 0 011-1z"
                clipRule="evenodd"
              />
            </svg>
            <span className="text-sm text-[var(--blossom-pink-primary)]">
              Add New Tag
            </span>
          </button>
        )}

        {/* Apply/Filter Button */}
        <div className="flex justify-end mt-4">
          <button
            onClick={handleApply}
            className="bg-[var(--blossom-pink-primary)] hover:bg-[var(--blossom-pink-hover)] text-white py-2 px-4 rounded transition-colors flex items-center text-sm"
          >
            {mode === "apply" ? "Apply Tags" : "Apply Filter"}
          </button>
        </div>
      </div>

      {/* Delete Confirmation Modal */}
      <DeleteConfirmationModal
        isOpen={!!deletingTag}
        isDeleting={isDeleting}
        itemName={deletingTag?.name || ""}
        itemType="Tag"
        onCancel={() => setDeletingTag(null)}
        onConfirm={handleDeleteTag}
      />
    </div>
  );
}
