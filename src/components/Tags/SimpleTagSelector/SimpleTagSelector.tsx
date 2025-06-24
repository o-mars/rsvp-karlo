import { Tag } from "@/src/models/interfaces";

interface SimpleTagSelectorProps {
  tags: Tag[];
  selectedTagIds: string[];
  onSelectionChange: (selectedTagIds: string[]) => void;
  showUntagged?: boolean;
}

export default function SimpleTagSelector({
  tags,
  selectedTagIds,
  onSelectionChange,
  showUntagged = true,
}: SimpleTagSelectorProps) {
  const handleTagToggle = (tagId: string) => {
    const newSelectedTagIds = selectedTagIds.includes(tagId)
      ? selectedTagIds.filter((id) => id !== tagId)
      : [...selectedTagIds, tagId];

    onSelectionChange(newSelectedTagIds);
  };

  const handleUntaggedToggle = () => {
    const newSelectedTagIds = selectedTagIds.includes("untagged")
      ? selectedTagIds.filter((id) => id !== "untagged")
      : [...selectedTagIds, "untagged"];

    onSelectionChange(newSelectedTagIds);
  };

  return (
    <div className="flex flex-wrap gap-2">
      {/* Tag-specific filters */}
      {tags.map((tag) => (
        <button
          key={tag.id}
          type="button"
          onClick={() => handleTagToggle(tag.id)}
          className={`px-3 py-1.5 rounded-full text-sm transition-colors ${
            selectedTagIds.includes(tag.id)
              ? "text-white"
              : "bg-white border border-[var(--blossom-border)] text-[var(--blossom-text-dark)] hover:bg-[var(--blossom-pink-light)]"
          }`}
          style={
            selectedTagIds.includes(tag.id)
              ? { backgroundColor: tag.color }
              : undefined
          }
        >
          {tag.name}
        </button>
      ))}

      {/* Untagged Guests option - only show if enabled */}
      {showUntagged && (
        <button
          type="button"
          onClick={handleUntaggedToggle}
          className={`px-3 py-1.5 rounded-full text-sm transition-colors ${
            selectedTagIds.includes("untagged")
              ? "bg-gray-600 text-white"
              : "bg-white border border-[var(--blossom-border)] text-[var(--blossom-text-dark)] hover:bg-gray-50"
          }`}
        >
          Untagged Guests
        </button>
      )}
    </div>
  );
}
