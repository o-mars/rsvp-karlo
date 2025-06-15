import { useState, useEffect } from "react";
import { Tag, TagId } from "@/src/models/interfaces";

interface CreateOrUpdateTagProps {
  onCreateTag: (tag: Partial<Tag>) => Promise<void>;
  onUpdateTag?: (tag: Partial<Tag>) => Promise<void>;
  onCancel: () => void;
  initialName?: string;
  initialColor?: string;
  tagId?: TagId;
}

export default function CreateOrUpdateTag({
  onCreateTag,
  onUpdateTag,
  onCancel,
  initialName = "",
  initialColor = "#ec4899",
  tagId,
}: CreateOrUpdateTagProps) {
  const [newTagName, setNewTagName] = useState(initialName);
  const [newTagColor, setNewTagColor] = useState(initialColor);

  // Update state when initial values change
  useEffect(() => {
    setNewTagName(initialName);
    setNewTagColor(initialColor);
  }, [initialName, initialColor]);

  const handleSubmit = async () => {
    if (!newTagName.trim()) return;

    try {
      if (tagId) {
        await onUpdateTag?.({
          id: tagId,
          name: newTagName.trim(),
          color: newTagColor,
        });
      } else {
        await onCreateTag({
          name: newTagName.trim(),
          color: newTagColor,
        });
      }
      setNewTagName("");
      setNewTagColor("#ec4899");
      onCancel();
    } catch (error) {
      console.error("Error saving tag:", error);
    }
  };

  return (
    <div className="flex items-center justify-between gap-2 bg-white rounded-lg pl-1 pr-3 py-2">
      <div className="flex items-center gap-3 flex-1 min-w-0">
        <div
          className="w-4 h-4 rounded-full border border-[var(--blossom-border)] cursor-pointer flex-shrink-0"
          style={{ backgroundColor: newTagColor }}
        >
          <input
            type="color"
            value={newTagColor}
            onChange={(e) => setNewTagColor(e.target.value)}
            className="opacity-0 absolute w-4 h-4 cursor-pointer"
          />
        </div>
        <input
          type="text"
          value={newTagName}
          onChange={(e) => setNewTagName(e.target.value)}
          className="border-none focus:outline-none focus:ring-0 text-sm text-[var(--blossom-text-dark)] bg-transparent w-full"
          placeholder="New tag name"
          autoFocus
        />
      </div>
      <div className="flex items-center flex-shrink-0">
        <button
          type="button"
          onClick={onCancel}
          className="text-red-500 hover:text-red-600 p-1"
        >
          <svg
            xmlns="http://www.w3.org/2000/svg"
            className="h-5 w-5"
            viewBox="0 0 20 20"
            fill="currentColor"
          >
            <path
              fillRule="evenodd"
              d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z"
              clipRule="evenodd"
            />
          </svg>
        </button>
        <button
          type="button"
          onClick={handleSubmit}
          disabled={!newTagName.trim()}
          className={`p-1 ${
            newTagName.trim()
              ? "text-green-600 hover:text-green-700"
              : "text-gray-400"
          }`}
        >
          <svg
            xmlns="http://www.w3.org/2000/svg"
            className="h-5 w-5"
            viewBox="0 0 20 20"
            fill="currentColor"
          >
            <path
              fillRule="evenodd"
              d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
              clipRule="evenodd"
            />
          </svg>
        </button>
      </div>
    </div>
  );
}
