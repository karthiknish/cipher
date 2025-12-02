"use client";
import { Plus, Tag, X, ListBullets } from "@phosphor-icons/react";
import { ProductFormProps, SUGGESTED_TAGS } from "./types";

interface DetailsTabProps extends ProductFormProps {
  newTag: string;
  setNewTag: React.Dispatch<React.SetStateAction<string>>;
}

export function DetailsTab({
  formData,
  setFormData,
  newTag,
  setNewTag,
}: DetailsTabProps) {
  const addTag = () => {
    if (newTag.trim() && !formData.tags?.includes(newTag.trim())) {
      setFormData((prev) => ({
        ...prev,
        tags: [...(prev.tags || []), newTag.trim()],
      }));
      setNewTag("");
    }
  };

  const removeTag = (tag: string) => {
    setFormData((prev) => ({
      ...prev,
      tags: prev.tags?.filter((t) => t !== tag) || [],
    }));
  };

  const addSuggestedTag = (tag: string) => {
    if (!formData.tags?.includes(tag)) {
      setFormData((prev) => ({ ...prev, tags: [...(prev.tags || []), tag] }));
    }
  };

  return (
    <div className="p-8">
      <div className="flex items-center gap-3 mb-6">
        <div className="w-10 h-10 bg-black rounded-lg flex items-center justify-center">
          <ListBullets className="w-5 h-5 text-white" />
        </div>
        <div>
          <h2 className="text-lg font-medium">Details & SEO</h2>
          <p className="text-sm text-gray-500">Additional product information</p>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-8">
        <div className="space-y-6">
          <div>
            <label className="block text-xs tracking-wider text-gray-500 mb-2">
              MATERIAL
            </label>
            <input
              type="text"
              value={formData.material || ""}
              onChange={(e) =>
                setFormData((prev) => ({ ...prev, material: e.target.value }))
              }
              className="w-full px-4 py-3 border border-gray-200 rounded-lg focus:border-black outline-none transition"
              placeholder="e.g., 100% Organic Cotton"
            />
          </div>

          <div>
            <label className="block text-xs tracking-wider text-gray-500 mb-2">
              CARE INSTRUCTIONS
            </label>
            <textarea
              value={formData.careInstructions || ""}
              onChange={(e) =>
                setFormData((prev) => ({
                  ...prev,
                  careInstructions: e.target.value,
                }))
              }
              className="w-full px-4 py-3 border border-gray-200 rounded-lg focus:border-black outline-none transition resize-none"
              placeholder="Machine wash cold, tumble dry low..."
              rows={4}
            />
          </div>
        </div>

        <div className="space-y-6">
          {/* Tags */}
          <div>
            <label className="block text-xs tracking-wider text-gray-500 mb-2">
              TAGS
              <span className="text-gray-400 font-normal ml-2">
                ({formData.tags?.length || 0} tags)
              </span>
            </label>
            <div className="flex gap-2 mb-3">
              <input
                type="text"
                value={newTag}
                onChange={(e) => setNewTag(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter") {
                    e.preventDefault();
                    addTag();
                  }
                }}
                className="flex-1 px-4 py-3 border border-gray-200 rounded-lg focus:border-black outline-none transition"
                placeholder="Add a tag..."
              />
              <button
                type="button"
                onClick={addTag}
                disabled={!newTag.trim()}
                className="px-4 py-3 bg-black text-white rounded-lg hover:bg-gray-900 transition disabled:opacity-50"
              >
                <Plus className="w-4 h-4" />
              </button>
            </div>

            {formData.tags && formData.tags.length > 0 ? (
              <div className="flex flex-wrap gap-2">
                {formData.tags.map((tag) => (
                  <span
                    key={tag}
                    className="inline-flex items-center gap-1 px-3 py-1.5 bg-gray-100 rounded-full text-sm"
                  >
                    <Tag className="w-3 h-3 text-gray-400" />
                    {tag}
                    <button
                      type="button"
                      onClick={() => removeTag(tag)}
                      className="ml-1 text-gray-400 hover:text-red-500"
                    >
                      <X className="w-3 h-3" />
                    </button>
                  </span>
                ))}
              </div>
            ) : (
              <p className="text-xs text-gray-400">
                Tags help with search and filtering
              </p>
            )}
          </div>

          {/* Quick Tags */}
          <div>
            <p className="text-xs text-gray-400 mb-2">SUGGESTED TAGS</p>
            <div className="flex flex-wrap gap-2">
              {SUGGESTED_TAGS.map((tag) => (
                <button
                  key={tag}
                  type="button"
                  onClick={() => addSuggestedTag(tag)}
                  disabled={formData.tags?.includes(tag)}
                  className="px-3 py-1 border border-gray-200 rounded-full text-xs hover:border-black transition disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  + {tag}
                </button>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
