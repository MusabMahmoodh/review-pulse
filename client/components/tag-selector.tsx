"use client";

import { useState } from "react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Check, X, Tag as TagIcon, Plus } from "lucide-react";
import type { Tag } from "@/lib/types";
import { cn } from "@/lib/utils";

interface TagSelectorProps {
  tags: Tag[];
  selectedTagIds: string[];
  onSelectionChange: (tagIds: string[]) => void;
  maxSelections?: number;
  className?: string;
  disabled?: boolean;
}

export function TagSelector({
  tags,
  selectedTagIds,
  onSelectionChange,
  maxSelections,
  className,
  disabled = false,
}: TagSelectorProps) {
  const [open, setOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");

  const activeTags = tags.filter((tag) => tag.isActive);
  const filteredTags = activeTags.filter((tag) =>
    tag.name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const selectedTags = activeTags.filter((tag) =>
    selectedTagIds.includes(tag.id)
  );

  const handleTagToggle = (tagId: string) => {
    if (disabled) return;

    if (selectedTagIds.includes(tagId)) {
      onSelectionChange(selectedTagIds.filter((id) => id !== tagId));
    } else {
      if (maxSelections && selectedTagIds.length >= maxSelections) {
        return;
      }
      onSelectionChange([...selectedTagIds, tagId]);
    }
  };

  const handleRemoveTag = (tagId: string) => {
    if (disabled) return;
    onSelectionChange(selectedTagIds.filter((id) => id !== tagId));
  };

  return (
    <div className={cn("space-y-2", className)}>
      <Label>Tags (Optional)</Label>
      
      {/* Selected Tags Display */}
      {selectedTags.length > 0 && (
        <div className="flex flex-wrap gap-2 p-2 border rounded-md min-h-[2.5rem]">
          {selectedTags.map((tag) => (
            <Badge
              key={tag.id}
              variant="secondary"
              className="gap-1 pr-1"
              style={
                tag.color
                  ? {
                      backgroundColor: `${tag.color}20`,
                      borderColor: tag.color,
                      color: tag.color,
                    }
                  : {}
              }
            >
              <TagIcon className="h-3 w-3" />
              {tag.name}
              {!disabled && (
                <button
                  type="button"
                  onClick={() => handleRemoveTag(tag.id)}
                  className="ml-1 hover:bg-destructive/20 rounded-full p-0.5"
                >
                  <X className="h-3 w-3" />
                </button>
              )}
            </Badge>
          ))}
        </div>
      )}

      {/* Tag Selector Popover */}
      {!disabled && (
        <Popover open={open} onOpenChange={setOpen}>
          <PopoverTrigger asChild>
            <Button
              type="button"
              variant="outline"
              className="w-full justify-start"
            >
              <Plus className="h-4 w-4 mr-2" />
              {selectedTags.length > 0
                ? `${selectedTags.length} tag${selectedTags.length > 1 ? "s" : ""} selected`
                : "Add tags"}
            </Button>
          </PopoverTrigger>
          <PopoverContent className="w-80 p-0" align="start">
            <div className="p-3 border-b">
              <Input
                placeholder="Search tags..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="h-9"
              />
            </div>
            <div className="max-h-60 overflow-y-auto p-2">
              {filteredTags.length === 0 ? (
                <div className="p-4 text-center text-sm text-muted-foreground">
                  {searchQuery ? "No tags found" : "No tags available"}
                </div>
              ) : (
                <div className="space-y-1">
                  {filteredTags.map((tag) => {
                    const isSelected = selectedTagIds.includes(tag.id);
                    const isMaxReached =
                      maxSelections &&
                      selectedTagIds.length >= maxSelections &&
                      !isSelected;

                    return (
                      <button
                        key={tag.id}
                        type="button"
                        onClick={() => handleTagToggle(tag.id)}
                        disabled={isMaxReached}
                        className={cn(
                          "w-full flex items-center gap-2 p-2 rounded-md text-left hover:bg-accent transition-colors",
                          isSelected && "bg-accent",
                          isMaxReached && "opacity-50 cursor-not-allowed"
                        )}
                      >
                        <div
                          className={cn(
                            "h-4 w-4 rounded border-2 flex items-center justify-center",
                            isSelected && "bg-primary border-primary"
                          )}
                          style={
                            tag.color && isSelected
                              ? {
                                  backgroundColor: tag.color,
                                  borderColor: tag.color,
                                }
                              : {}
                          }
                        >
                          {isSelected && (
                            <Check className="h-3 w-3 text-white" />
                          )}
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2">
                            <span className="font-medium text-sm">
                              {tag.name}
                            </span>
                            {tag.color && (
                              <div
                                className="h-3 w-3 rounded-full border"
                                style={{ backgroundColor: tag.color }}
                              />
                            )}
                          </div>
                          {tag.description && (
                            <p className="text-xs text-muted-foreground truncate">
                              {tag.description}
                            </p>
                          )}
                        </div>
                      </button>
                    );
                  })}
                </div>
              )}
            </div>
            {maxSelections && (
              <div className="p-2 border-t text-xs text-muted-foreground text-center">
                {selectedTagIds.length} / {maxSelections} selected
              </div>
            )}
          </PopoverContent>
        </Popover>
      )}
    </div>
  );
}

