"use client"

import * as React from "react"
import {
 MessageCircle,
 HelpCircle,
 AlertCircle,
 ThumbsUp,
 X
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { cn } from "@/lib/utils"
import type { CommentType } from "./CommentCard"

export interface AnnotationPoint {
 id: string
 x: number // percentage (0-100)
 y: number // percentage (0-100)
 commentId: string
 commentType: CommentType
 commentText: string
 author: {
 id: string
 name: string
 }
 createdAt: Date
}

export interface PDFAnnotationProps {
 annotations: AnnotationPoint[]
 onAnnotationClick?: (_annotation: AnnotationPoint) => void
 onAddAnnotation?: (_x: number, _y: number) => void
 pdfPageNumber: number
 containerWidth: number
 containerHeight: number
 disabled?: boolean
 selectedAnnotationId?: string | null
}

const annotationTypeConfig: Record<CommentType, {
 icon: React.ElementType
 color: string
 bgColor: string
 borderColor: string
}> = {
 general: {
 icon: MessageCircle,
 color: "text-blue-600",
 bgColor: "bg-blue-500",
 borderColor: "border-blue-600"
 },
 question: {
 icon: HelpCircle,
 color: "text-purple-600",
 bgColor: "bg-purple-500",
 borderColor: "border-purple-600"
 },
 issue: {
 icon: AlertCircle,
 color: "text-red-600",
 bgColor: "bg-red-500",
 borderColor: "border-red-600"
 },
 approval: {
 icon: ThumbsUp,
 color: "text-green-600",
 bgColor: "bg-green-500",
 borderColor: "border-green-600"
 }
}

function AnnotationMarker({
 annotation,
 isSelected,
 onClick,
 index
}: {
 annotation: AnnotationPoint
 isSelected: boolean
 onClick: (_e: React.MouseEvent<HTMLButtonElement>) => void
 index: number
}) {
 const config = annotationTypeConfig[annotation.commentType]
 const Icon = config.icon
 const [showTooltip, setShowTooltip] = React.useState(false)

 return (
 <div
 className="absolute transform -translate-x-1/2 -translate-y-1/2 z-10"
 style={{
 left: `${annotation.x}%`,
 top: `${annotation.y}%`
 }}
 >
 <button
 onClick={onClick}
 onMouseEnter={() => setShowTooltip(true)}
 onMouseLeave={() => setShowTooltip(false)}
 className={cn(
 "relative w-8 h-8 rounded-full flex items-center justify-center",
 "transition-all duration-200 shadow-lg hover:scale-110",
 "border-2 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary",
 config.bgColor,
 config.borderColor,
 isSelected && "scale-125 ring-2 ring-primary ring-offset-2"
 )}
 aria-label={`Annotation ${index + 1}: ${annotation.commentType} by ${annotation.author.name}`}
 >
 <Icon className="w-4 h-4 text-white" aria-hidden="true" />
 <Badge
 className={cn(
 "absolute -top-1 -right-1 w-5 h-5 p-0 flex items-center justify-center",
 "bg-white border border"
 )}
 >
 {index + 1}
 </Badge>
 </button>

 {/* Tooltip */}
 {showTooltip && !isSelected && (
 <div
 className={cn(
 "absolute left-1/2 -translate-x-1/2 top-full mt-2",
 "card text-white text-xs rounded px-2 py-1",
 "whitespace-nowrap shadow-lg z-20 pointer-events-none",
 "max-w-xs"
 )}
 >
 <div className="font-semibold">{annotation.author.name}</div>
 <div className="truncate max-w-[200px]">
 {annotation.commentText}
 </div>
 <div
 className="absolute left-1/2 -translate-x-1/2 -top-1 w-2 h-2 card rotate-45"
 aria-hidden="true"
 />
 </div>
 )}
 </div>
 )
}

export function PDFAnnotation({
 annotations,
 onAnnotationClick,
 onAddAnnotation,
 pdfPageNumber,
 containerWidth,
 containerHeight,
 disabled = false,
 selectedAnnotationId = null
}: PDFAnnotationProps) {
 const containerRef = React.useRef<HTMLDivElement>(null)
 const [isAddingAnnotation, setIsAddingAnnotation] = React.useState(false)
 const [tempAnnotationPos, setTempAnnotationPos] = React.useState<{
 x: number
 y: number
 } | null>(null)

 // Filter annotations for current page
 const pageAnnotations = annotations.filter(
 (annotation) => annotation.commentId.includes(`page-${pdfPageNumber}`)
 )

 const handleContainerClick = (e: React.MouseEvent<HTMLDivElement>) => {
 if (disabled || !onAddAnnotation || !isAddingAnnotation) return

 const container = containerRef.current
 if (!container) return

 // Get click position relative to container
 const rect = container.getBoundingClientRect()
 const x = ((e.clientX - rect.left) / rect.width) * 100
 const y = ((e.clientY - rect.top) / rect.height) * 100

 // Clamp values to 0-100
 const clampedX = Math.max(0, Math.min(100, x))
 const clampedY = Math.max(0, Math.min(100, y))

 setTempAnnotationPos({ x: clampedX, y: clampedY })
 onAddAnnotation(clampedX, clampedY)
 setIsAddingAnnotation(false)
 }

 const handleAnnotationClick = (annotation: AnnotationPoint) => (
 e: React.MouseEvent<HTMLButtonElement>
 ) => {
 e.stopPropagation()
 if (onAnnotationClick) {
 onAnnotationClick(annotation)
 }
 }

 const toggleAddMode = (e: React.MouseEvent<HTMLButtonElement>) => {
 e.preventDefault()
 setIsAddingAnnotation(!isAddingAnnotation)
 setTempAnnotationPos(null)
 }

 const handleCancelAdd = (e: React.MouseEvent<HTMLButtonElement>) => {
 e.preventDefault()
 e.stopPropagation()
 setIsAddingAnnotation(false)
 setTempAnnotationPos(null)
 }

 React.useEffect(() => {
 // Reset add mode when changing pages
 setIsAddingAnnotation(false)
 setTempAnnotationPos(null)
 }, [pdfPageNumber])

 return (
 <div className="relative">
 {/* Control buttons */}
 {onAddAnnotation && !disabled && (
 <div className="absolute top-2 right-2 z-20 flex gap-2">
 <Button
 variant={isAddingAnnotation ? "default" : "secondary"}
 size="sm"
 onClick={toggleAddMode}
 className="shadow-lg"
 aria-label={isAddingAnnotation ? "Cancel adding annotation" : "Add annotation"}
 >
 {isAddingAnnotation ? (
 <>
 <X className="w-4 h-4 mr-1" aria-hidden="true" />
 Cancel
 </>
 ) : (
 <>
 <MessageCircle className="w-4 h-4 mr-1" aria-hidden="true" />
 Add Comment
 </>
 )}
 </Button>
 </div>
 )}

 {/* Annotation layer */}
 <div
 ref={containerRef}
 className={cn(
 "absolute inset-0 w-full h-full",
 isAddingAnnotation && "cursor-crosshair bg-blue-500/5"
 )}
 onClick={handleContainerClick}
 role="region"
 aria-label="PDF annotation layer"
 style={{
 width: containerWidth,
 height: containerHeight
 }}
 >
 {/* Render annotations */}
 {pageAnnotations.map((annotation, index) => (
 <AnnotationMarker
 key={annotation.id}
 annotation={annotation}
 isSelected={annotation.id === selectedAnnotationId}
 onClick={handleAnnotationClick(annotation)}
 index={index}
 />
 ))}

 {/* Temporary annotation position */}
 {tempAnnotationPos && (
 <div
 className="absolute w-8 h-8 rounded-full bg-blue-500/50 border-2 border-blue-600 transform -translate-x-1/2 -translate-y-1/2 animate-pulse"
 style={{
 left: `${tempAnnotationPos.x}%`,
 top: `${tempAnnotationPos.y}%`
 }}
 aria-hidden="true"
 />
 )}

 {/* Add mode hint */}
 {isAddingAnnotation && (
 <div className="absolute bottom-4 left-1/2 transform -translate-x-1/2 card/90 text-white px-4 py-2 rounded-lg shadow-lg text-sm">
 Click anywhere on the PDF to add a comment
 <Button
 variant="ghost"
 size="sm"
 onClick={handleCancelAdd}
 className="ml-2 h-6 px-2 text-white hover:bg-white/20"
 aria-label="Cancel adding annotation"
 >
 <X className="w-3 h-3" aria-hidden="true" />
 </Button>
 </div>
 )}
 </div>
 </div>
 )
}
