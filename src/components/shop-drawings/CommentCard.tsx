"use client"

import * as React from "react"
import { formatDistanceToNow } from "date-fns"
import {
 MessageCircle,
 CheckCircle2,
 AlertCircle,
 HelpCircle,
 ThumbsUp,
 Reply,
 Check
} from "lucide-react"
import { Card, CardContent, CardFooter, CardHeader } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { cn } from "@/lib/utils"

export type CommentType = "general" | "question" | "issue" | "approval"
export type CommentStatus = "open" | "resolved"

export interface Comment {
 id: string
 text: string
 author: {
 id: string
 name: string
 avatar?: string | null
 }
 createdAt: Date
 type: CommentType
 status?: CommentStatus
 parentId?: string | null
 replies?: Comment[]
 resolvedAt?: Date | null
 resolvedBy?: {
 id: string
 name: string
 } | null
}

export interface CommentCardProps {
 comment: Comment
 onReply?: (_commentId: string) => void
 onResolve?: (_commentId: string) => void
 isNested?: boolean
}

const commentTypeConfig: Record<CommentType, {
 label: string
 icon: React.ElementType
 variant: "default" | "secondary" | "destructive" | "outline"
 className: string
}> = {
 general: {
 label: "General",
 icon: MessageCircle,
 variant: "secondary",
 className: "bg-info text-info hover:bg-info"
 },
 question: {
 label: "Question",
 icon: HelpCircle,
 variant: "outline",
 className: "bg-primary text-primary hover:bg-primary"
 },
 issue: {
 label: "Issue",
 icon: AlertCircle,
 variant: "destructive",
 className: "bg-destructive text-destructive hover:bg-destructive"
 },
 approval: {
 label: "Approval",
 icon: ThumbsUp,
 variant: "default",
 className: "bg-success text-success hover:bg-success"
 }
}

export function CommentCard({
 comment,
 onReply,
 onResolve,
 isNested = false
}: CommentCardProps) {
 const config = commentTypeConfig[comment.type]
 const TypeIcon = config.icon
 const isResolved = comment.status === "resolved"
 const hasReplies = comment.replies && comment.replies.length > 0

 // Get initials for avatar fallback
 const getInitials = (name: string): string => {
 return name
 .split(" ")
 .map(n => n[0])
 .join("")
 .toUpperCase()
 .slice(0, 2)
 }

 const handleReply = (e: React.MouseEvent<HTMLButtonElement>) => {
 e.preventDefault()
 if (onReply) {
 onReply(comment.id)
 }
 }

 const handleResolve = (e: React.MouseEvent<HTMLButtonElement>) => {
 e.preventDefault()
 if (onResolve) {
 onResolve(comment.id)
 }
 }

 return (
 <div className={cn("space-y-2", isNested && "ml-12")}>
 <Card className={cn(
 "transition-all",
 isResolved && "opacity-60 bg-muted/50",
 !isNested && "shadow-md"
 )}>
 <CardHeader className="pb-3">
 <div className="flex items-start justify-between gap-4">
 <div className="flex items-start gap-3 flex-1">
 <Avatar className="h-10 w-10">
 <AvatarImage
 src={comment.author.avatar || undefined}
 alt={comment.author.name}
 />
 <AvatarFallback className="bg-primary/10 text-primary">
 {getInitials(comment.author.name)}
 </AvatarFallback>
 </Avatar>

 <div className="flex-1 min-w-0">
 <div className="flex items-center gap-2 flex-wrap">
 <span className="font-semibold text-sm">
 {comment.author.name}
 </span>
 <Badge
 variant={config.variant}
 className={cn("text-xs", config.className)}
 >
 <TypeIcon className="w-3 h-3 mr-1" aria-hidden="true" />
 {config.label}
 </Badge>
 {isResolved && (
 <Badge
 variant="outline"
 className="bg-success text-success border-success"
 >
 <CheckCircle2 className="w-3 h-3 mr-1" aria-hidden="true" />
 Resolved
 </Badge>
 )}
 </div>
 <time
 className="text-xs text-muted-foreground"
 dateTime={comment.createdAt.toISOString()}
 >
 {formatDistanceToNow(comment.createdAt, { addSuffix: true })}
 </time>
 </div>
 </div>
 </div>
 </CardHeader>

 <CardContent className="pb-3">
 <p className="text-sm text-foreground whitespace-pre-wrap break-words">
 {comment.text}
 </p>
 </CardContent>

 {(isResolved && comment.resolvedBy) && (
 <CardFooter className="pt-0 pb-3">
 <div className="text-xs text-muted-foreground">
 Resolved by {comment.resolvedBy.name}
 {comment.resolvedAt && (
 <> {formatDistanceToNow(comment.resolvedAt, { addSuffix: true })}</>
 )}
 </div>
 </CardFooter>
 )}

 {!isResolved && (onReply || onResolve) && (
 <CardFooter className="pt-0 pb-4 gap-2">
 {onReply && (
 <Button
 variant="ghost"
 size="sm"
 onClick={handleReply}
 aria-label="Reply to comment"
 >
 <Reply className="w-4 h-4 mr-1" aria-hidden="true" />
 Reply
 </Button>
 )}
 {onResolve && !isNested && (
 <Button
 variant="outline"
 size="sm"
 onClick={handleResolve}
 aria-label="Resolve comment"
 >
 <Check className="w-4 h-4 mr-1" aria-hidden="true" />
 Resolve
 </Button>
 )}
 </CardFooter>
 )}
 </Card>

 {hasReplies && (
 <div className="space-y-2" role="list" aria-label="Replies">
 {comment.replies?.map((reply) => (
 <CommentCard
 key={reply.id}
 comment={reply}
 onReply={onReply}
 onResolve={onResolve}
 isNested={true}
 />
 ))}
 </div>
 )}
 </div>
 )
}
