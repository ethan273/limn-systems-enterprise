"use client";

/**
 * Delete Confirmation Dialog Component
 *
 * Reusable dialog for confirming destructive delete actions
 * Prevents accidental deletions with clear messaging
 *
 * @module DeleteConfirmDialog
 */

import {
 AlertDialog,
 AlertDialogAction,
 AlertDialogCancel,
 AlertDialogContent,
 AlertDialogDescription,
 AlertDialogFooter,
 AlertDialogHeader,
 AlertDialogTitle,
 AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { AlertTriangle } from "lucide-react";
import type { ReactNode } from "react";

interface DeleteConfirmDialogProps {
 /**
 * Trigger element (usually a button)
 */
 trigger: ReactNode;

 /**
 * Title of the dialog
 * @default "Are you absolutely sure?"
 */
 title?: string;

 /**
 * Description explaining what will be deleted
 */
 description: string;

 /**
 * Item name to display in the warning
 * @example "Production Order PO-2025-0001"
 */
 itemName?: string;

 /**
 * Callback when delete is confirmed
 */
 onConfirm: () => void | Promise<void>;

 /**
 * Whether the delete action is in progress
 */
 isDeleting?: boolean;
}

export function DeleteConfirmDialog({
 trigger,
 title = "Are you absolutely sure?",
 description,
 itemName,
 onConfirm,
 isDeleting = false,
}: DeleteConfirmDialogProps) {
 return (
 <AlertDialog>
 <AlertDialogTrigger asChild>
 {trigger}
 </AlertDialogTrigger>
 <AlertDialogContent>
 <AlertDialogHeader>
 <div className="flex items-center gap-3">
 <div className="flex h-10 w-10 items-center justify-center rounded-full bg-destructive/10">
 <AlertTriangle className="h-5 w-5 text-destructive" aria-hidden="true" />
 </div>
 <AlertDialogTitle>{title}</AlertDialogTitle>
 </div>
 <AlertDialogDescription className="space-y-2 pt-3">
 <p>{description}</p>
 {itemName && (
 <p className="font-semibold ">
 {itemName}
 </p>
 )}
 <p className="text-destructive">
 This action cannot be undone. This will permanently delete the data from the database.
 </p>
 </AlertDialogDescription>
 </AlertDialogHeader>
 <AlertDialogFooter>
 <AlertDialogCancel disabled={isDeleting}>
 Cancel
 </AlertDialogCancel>
 <AlertDialogAction
 onClick={(e) => {
 e.preventDefault();
 void onConfirm();
 }}
 disabled={isDeleting}
 className="bg-destructive hover:bg-destructive focus:ring-red-600"
 >
 {isDeleting ? "Deleting..." : "Delete"}
 </AlertDialogAction>
 </AlertDialogFooter>
 </AlertDialogContent>
 </AlertDialog>
 );
}
