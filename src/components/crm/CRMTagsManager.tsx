'use client';

import React, { useState, useRef, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import {
 Dialog,
 DialogContent,
 DialogDescription,
 DialogFooter,
 DialogHeader,
 DialogTitle,
 DialogTrigger,
} from '@/components/ui/dialog';
import {
 DropdownMenu,
 DropdownMenuContent,
 DropdownMenuItem,
 DropdownMenuSeparator,
 DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Separator } from '@/components/ui/separator';
import {
 Tag,
 Plus,
 X,
 Edit,
 Trash2,
 Hash,
 Search,
 // Filter not used
 MoreHorizontal,
 Check,
 Copy,
} from 'lucide-react';

interface CRMTagsManagerProps {
 tags: string[];
 onTagsChange: (_tags: string[]) => void;
 label?: string;
 placeholder?: string;
 maxTags?: number;
 predefinedTags?: string[];
 showPredefinedTags?: boolean;
 allowCustomTags?: boolean;
 className?: string;
 variant?: 'default' | 'compact' | 'inline';
}

interface TagInputProps {
 value: string;
 onChange: (_value: string) => void;
 onSubmit: () => void;
 onCancel: () => void;
 placeholder?: string;
 autoFocus?: boolean;
}

function TagInput({ value, onChange, onSubmit, onCancel, placeholder, autoFocus = true }: TagInputProps) {
 const inputRef = useRef<HTMLInputElement>(null);

 useEffect(() => {
 if (autoFocus && inputRef.current) {
 inputRef.current.focus();
 }
 }, [autoFocus]);

 const handleKeyDown = (e: React.KeyboardEvent) => {
 if (e.key === 'Enter') {
 e.preventDefault();
 onSubmit();
 } else if (e.key === 'Escape') {
 e.preventDefault();
 onCancel();
 }
 };

 return (
 <Input
 ref={inputRef}
 value={value}
 onChange={(e) => onChange(e.target.value)}
 onKeyDown={handleKeyDown}
 onBlur={onCancel}
 placeholder={placeholder || 'Enter tag name...'}
 className="h-8 text-sm"
 autoComplete="off"
 />
 );
}

// Predefined common CRM tags
const DEFAULT_CRM_TAGS = [
 'VIP',
 'High Value',
 'Decision Maker',
 'Influencer',
 'Champion',
 'Blocker',
 'Budget Holder',
 'Technical Contact',
 'Follow Up',
 'Qualified',
 'Hot Lead',
 'Warm Lead',
 'Cold Lead',
 'Nurture',
 'Demo Scheduled',
 'Proposal Sent',
 'Contract Sent',
 'On Hold',
 'Lost',
 'Reactivate',
 'Referral Source',
 'Partner',
 'Competitor',
 'Trade Show',
 'Website',
 'Social Media',
 'Email Campaign',
 'Cold Call',
 'Inbound',
 'Outbound',
];

export function CRMTagsManager({
 tags,
 onTagsChange,
 label = 'Tags',
 placeholder = 'Add tags...',
 maxTags,
 predefinedTags = DEFAULT_CRM_TAGS,
 showPredefinedTags = true,
 allowCustomTags = true,
 className = '',
 variant = 'default',
}: CRMTagsManagerProps) {
 const [isAddingTag, setIsAddingTag] = useState(false);
 const [newTagValue, setNewTagValue] = useState('');
 const [isDialogOpen, setIsDialogOpen] = useState(false);
 const [searchTerm, setSearchTerm] = useState('');
 const [editingTag, setEditingTag] = useState<string | null>(null);
 const [editingValue, setEditingValue] = useState('');

 const filteredPredefinedTags = predefinedTags.filter(
 (tag) =>
 !tags.includes(tag) &&
 tag.toLowerCase().includes(searchTerm.toLowerCase())
 );

 const addTag = (tagName: string) => {
 const trimmedTag = tagName.trim();
 if (trimmedTag && !tags.includes(trimmedTag)) {
 if (!maxTags || tags.length < maxTags) {
 onTagsChange([...tags, trimmedTag]);
 }
 }
 setNewTagValue('');
 setIsAddingTag(false);
 };

 const removeTag = (tagToRemove: string) => {
 onTagsChange(tags.filter(tag => tag !== tagToRemove));
 };

 const editTag = (oldTag: string, newTag: string) => {
 const trimmedTag = newTag.trim();
 if (trimmedTag && trimmedTag !== oldTag && !tags.includes(trimmedTag)) {
 const updatedTags = tags.map(tag => tag === oldTag ? trimmedTag : tag);
 onTagsChange(updatedTags);
 }
 setEditingTag(null);
 setEditingValue('');
 };

 const startEditing = (tag: string) => {
 setEditingTag(tag);
 setEditingValue(tag);
 };

 const handleAddCustomTag = () => {
 addTag(newTagValue);
 };

 const handleAddPredefinedTag = (tag: string) => {
 addTag(tag);
 setSearchTerm('');
 };

 const copyTagsToClipboard = () => {
 navigator.clipboard.writeText(tags.join(', '));
 };

 if (variant === 'compact') {
 return (
 <div className={`space-y-2 ${className}`}>
 <Label className="text-sm font-medium">{label}</Label>
 <div className="flex flex-wrap gap-1">
 {tags.map((tag) => (
 <Badge
 key={tag}
 variant="outline"
 className="text-xs flex items-center gap-1 pr-1"
 >
 <Tag className="w-2 h-2" />
 {tag}
 <Button
 variant="ghost"
 size="sm"
 onClick={() => removeTag(tag)}
 className="h-4 w-4 p-0 hover:bg-red-500/20 ml-1"
 >
 <X className="w-2 h-2" />
 </Button>
 </Badge>
 ))}
 <Button
 variant="outline"
 size="sm"
 onClick={() => setIsDialogOpen(true)}
 className="h-6 px-2 text-xs"
 disabled={Boolean(maxTags && tags.length >= maxTags)}
 >
 <Plus className="w-3 h-3 mr-1" />
 Add
 </Button>
 </div>
 </div>
 );
 }

 if (variant === 'inline') {
 return (
 <div className={`flex flex-wrap items-center gap-2 ${className}`}>
 {tags.map((tag) => (
 <Badge
 key={tag}
 variant="outline"
 className="flex items-center gap-1 pr-1"
 >
 <Tag className="w-3 h-3" />
 {editingTag === tag ? (
 <TagInput
 value={editingValue}
 onChange={setEditingValue}
 onSubmit={() => editTag(tag, editingValue)}
 onCancel={() => {
 setEditingTag(null);
 setEditingValue('');
 }}
 placeholder="Edit tag..."
 />
 ) : (
 <>
 {tag}
 <DropdownMenu>
 <DropdownMenuTrigger asChild>
 <Button
 variant="ghost"
 size="sm"
 className="h-4 w-4 p-0 hover:card ml-1"
 >
 <MoreHorizontal className="w-3 h-3" />
 </Button>
 </DropdownMenuTrigger>
 <DropdownMenuContent align="end">
 <DropdownMenuItem onClick={() => startEditing(tag)}>
 <Edit className="w-3 h-3 mr-2" />
 Edit
 </DropdownMenuItem>
 <DropdownMenuSeparator />
 <DropdownMenuItem
 onClick={() => removeTag(tag)}
 className="text-red-400"
 >
 <Trash2 className="w-3 h-3 mr-2" />
 Remove
 </DropdownMenuItem>
 </DropdownMenuContent>
 </DropdownMenu>
 </>
 )}
 </Badge>
 ))}
 {isAddingTag ? (
 <TagInput
 value={newTagValue}
 onChange={setNewTagValue}
 onSubmit={handleAddCustomTag}
 onCancel={() => {
 setIsAddingTag(false);
 setNewTagValue('');
 }}
 placeholder={placeholder}
 />
 ) : (
 <Button
 variant="outline"
 size="sm"
 onClick={() => setIsAddingTag(true)}
 className="h-7 px-3 text-sm"
 disabled={Boolean(maxTags && tags.length >= maxTags)}
 >
 <Plus className="w-3 h-3 mr-1" />
 Add Tag
 </Button>
 )}
 </div>
 );
 }

 return (
 <div className={`space-y-3 ${className}`}>
 <div className="flex items-center justify-between">
 <Label className="text-sm font-medium">
 {label}
 {tags.length > 0 && ` (${tags.length})`}
 {maxTags && ` / ${maxTags}`}
 </Label>
 {tags.length > 0 && (
 <Button
 variant="ghost"
 size="sm"
 onClick={copyTagsToClipboard}
 className="h-6 px-2 text-xs text-tertiary hover:text-foreground"
 >
 <Copy className="w-3 h-3 mr-1" />
 Copy
 </Button>
 )}
 </div>

 {/* Tags Display */}
 {tags.length > 0 && (
 <div className="flex flex-wrap gap-2">
 {tags.map((tag) => (
 <Badge
 key={tag}
 variant="outline"
 className="flex items-center gap-1 pr-1 group"
 >
 <Tag className="w-3 h-3" />
 {editingTag === tag ? (
 <TagInput
 value={editingValue}
 onChange={setEditingValue}
 onSubmit={() => editTag(tag, editingValue)}
 onCancel={() => {
 setEditingTag(null);
 setEditingValue('');
 }}
 placeholder="Edit tag..."
 />
 ) : (
 <>
 {tag}
 <DropdownMenu>
 <DropdownMenuTrigger asChild>
 <Button
 variant="ghost"
 size="sm"
 className="h-4 w-4 p-0 opacity-0 group-hover:opacity-100 hover:card ml-1"
 >
 <MoreHorizontal className="w-3 h-3" />
 </Button>
 </DropdownMenuTrigger>
 <DropdownMenuContent align="end">
 <DropdownMenuItem onClick={() => startEditing(tag)}>
 <Edit className="w-3 h-3 mr-2" />
 Edit
 </DropdownMenuItem>
 <DropdownMenuSeparator />
 <DropdownMenuItem
 onClick={() => removeTag(tag)}
 className="text-red-400"
 >
 <Trash2 className="w-3 h-3 mr-2" />
 Remove
 </DropdownMenuItem>
 </DropdownMenuContent>
 </DropdownMenu>
 </>
 )}
 </Badge>
 ))}
 </div>
 )}

 {/* Add Tag Controls */}
 <div className="flex gap-2">
 {allowCustomTags && (
 <>
 {isAddingTag ? (
 <div className="flex items-center gap-2 flex-1">
 <TagInput
 value={newTagValue}
 onChange={setNewTagValue}
 onSubmit={handleAddCustomTag}
 onCancel={() => {
 setIsAddingTag(false);
 setNewTagValue('');
 }}
 placeholder={placeholder}
 />
 <Button
 size="sm"
 onClick={handleAddCustomTag}
 disabled={!newTagValue.trim()}
 >
 <Check className="w-4 h-4" />
 </Button>
 </div>
 ) : (
 <Button
 variant="outline"
 size="sm"
 onClick={() => setIsAddingTag(true)}
 disabled={Boolean(maxTags && tags.length >= maxTags)}
 >
 <Plus className="w-4 h-4 mr-2" />
 Add Custom Tag
 </Button>
 )}
 </>
 )}

 {showPredefinedTags && (
 <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
 <DialogTrigger asChild>
 <Button
 variant="outline"
 size="sm"
 disabled={Boolean(maxTags && tags.length >= maxTags)}
 >
 <Hash className="w-4 h-4 mr-2" />
 Browse Tags
 </Button>
 </DialogTrigger>
 <DialogContent className="max-w-md max-h-[80vh] overflow-hidden">
 <DialogHeader>
 <DialogTitle>Add Tags</DialogTitle>
 <DialogDescription>
 Choose from predefined tags or search for specific ones
 </DialogDescription>
 </DialogHeader>

 <div className="space-y-4">
 {/* Search */}
 <div className="relative">
 <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-tertiary w-4 h-4" />
 <Input
 placeholder="Search tags..."
 value={searchTerm}
 onChange={(e) => setSearchTerm(e.target.value)}
 className="pl-10"
 />
 </div>

 {/* Tag Categories */}
 <div className="max-h-80 overflow-y-auto space-y-4">
 <div>
 <h4 className="text-sm font-medium text-tertiary mb-2">Available Tags</h4>
 <div className="flex flex-wrap gap-2">
 {filteredPredefinedTags.map((tag) => (
 <Button
 key={tag}
 variant="outline"
 size="sm"
 onClick={() => handleAddPredefinedTag(tag)}
 className="h-7 px-3 text-sm justify-start"
 disabled={Boolean(maxTags && tags.length >= maxTags)}
 >
 <Plus className="w-3 h-3 mr-1" />
 {tag}
 </Button>
 ))}
 </div>
 </div>

 {searchTerm && filteredPredefinedTags.length === 0 && allowCustomTags && (
 <div>
 <Separator className="my-3" />
 <Button
 variant="outline"
 size="sm"
 onClick={() => {
 addTag(searchTerm);
 setSearchTerm('');
 }}
 className="w-full justify-start"
 disabled={Boolean(maxTags && tags.length >= maxTags)}
 >
 <Plus className="w-4 h-4 mr-2" />
 Create &quot;{searchTerm}&quot;
 </Button>
 </div>
 )}
 </div>
 </div>

 <DialogFooter>
 <Button variant="outline" onClick={() => setIsDialogOpen(false)}>
 Done
 </Button>
 </DialogFooter>
 </DialogContent>
 </Dialog>
 )}
 </div>

 {maxTags && tags.length >= maxTags && (
 <p className="text-xs text-tertiary">
 Maximum number of tags reached ({maxTags})
 </p>
 )}
 </div>
 );
}

// Quick tag variants for specific use cases
export function QuickTagsManager({
 tags,
 onTagsChange,
 className = '',
}: {
 tags: string[];
 onTagsChange: (_tags: string[]) => void;
 className?: string;
}) {
 return (
 <CRMTagsManager
 tags={tags}
 onTagsChange={onTagsChange}
 variant="compact"
 maxTags={5}
 className={className}
 />
 );
}

export function InlineTagsManager({
 tags,
 onTagsChange,
 className = '',
}: {
 tags: string[];
 onTagsChange: (_tags: string[]) => void;
 className?: string;
}) {
 return (
 <CRMTagsManager
 tags={tags}
 onTagsChange={onTagsChange}
 variant="inline"
 className={className}
 />
 );
}

// Predefined tag sets for different CRM entities
export const CONTACT_TAGS = [
 'Decision Maker',
 'Influencer',
 'Champion',
 'Blocker',
 'Budget Holder',
 'Technical Contact',
 'Follow Up',
 'VIP',
 'High Value',
];

export const LEAD_TAGS = [
 'Hot Lead',
 'Warm Lead',
 'Cold Lead',
 'Qualified',
 'Nurture',
 'Demo Scheduled',
 'Proposal Sent',
 'Follow Up',
 'Inbound',
 'Outbound',
];

export const CUSTOMER_TAGS = [
 'VIP',
 'High Value',
 'Partner',
 'Referral Source',
 'Renewal Due',
 'Upsell Opportunity',
 'At Risk',
 'Satisfied',
 'Expanding',
 'Contract Renewal',
];