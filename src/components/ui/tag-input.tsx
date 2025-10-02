import React, { useState, KeyboardEvent } from 'react';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { X } from 'lucide-react';

interface TagInputProps {
 value: string;
 onChange: (_value: string) => void;
 placeholder?: string;
 id?: string;
 className?: string;
}

export function TagInput({ value, onChange, placeholder, id, className }: TagInputProps) {
 const [inputValue, setInputValue] = useState('');

 // Parse the comma-separated string into tags
 const tags = value ? value.split(',').map(tag => tag.trim()).filter(Boolean) : [];

 const addTag = (tag: string) => {
 const trimmedTag = tag.trim();
 if (trimmedTag && !tags.includes(trimmedTag)) {
 const newTags = [...tags, trimmedTag];
 onChange(newTags.join(', '));
 }
 setInputValue('');
 };

 const removeTag = (tagToRemove: string) => {
 const newTags = tags.filter(tag => tag !== tagToRemove);
 onChange(newTags.join(', '));
 };

 const handleKeyDown = (e: KeyboardEvent<HTMLInputElement>) => {
 if (e.key === 'Enter') {
 e.preventDefault();
 addTag(inputValue);
 } else if (e.key === 'Backspace' && !inputValue && tags.length > 0) {
 removeTag(tags[tags.length - 1]);
 } else if (e.key === ',') {
 e.preventDefault();
 addTag(inputValue);
 }
 };

 const handleInputBlur = () => {
 if (inputValue.trim()) {
 addTag(inputValue);
 }
 };

 return (
 <div className={`min-h-[40px] w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-within:ring-2 focus-within:ring-ring focus-within:ring-offset-2 ${className}`}>
 <div className="flex flex-wrap gap-1 mb-1">
 {tags.map((tag, index) => (
 <Badge key={index} variant="secondary" className="text-xs">
 {tag}
 <button
 type="button"
 onClick={() => removeTag(tag)}
 className="ml-1 hover:text-destructive"
 >
 <X className="h-3 w-3" />
 </button>
 </Badge>
 ))}
 </div>
 <Input
 id={id}
 type="text"
 value={inputValue}
 onChange={(e) => setInputValue(e.target.value)}
 onKeyDown={handleKeyDown}
 onBlur={handleInputBlur}
 placeholder={tags.length === 0 ? placeholder : 'Add another...'}
 className="border-0 p-0 h-6 focus-visible:ring-0 focus-visible:ring-offset-0"
 />
 </div>
 );
}