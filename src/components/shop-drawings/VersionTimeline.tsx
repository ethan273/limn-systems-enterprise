"use client"

import * as React from "react"
import { formatDistanceToNow, format } from "date-fns"
import { FileText, Clock, Archive, CheckCircle2, User } from "lucide-react"
import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { cn } from "@/lib/utils"

export type VersionStatus = "current" | "superseded" | "archived"

export interface Version {
 id: string
 versionNumber: string
 fileName: string
 fileSize: number
 uploadedAt: Date
 uploadedBy: {
 id: string
 name: string
 }
 status: VersionStatus
 notes?: string | null
}

export interface VersionTimelineProps {
 versions: Version[]
 onVersionClick?: (_version: Version) => void
}

const versionStatusConfig: Record<VersionStatus, {
 label: string
 icon: React.ElementType
 className: string
}> = {
 current: {
 label: "Current",
 icon: CheckCircle2,
 className: "bg-green-100 text-green-800 border-green-300"
 },
 superseded: {
 label: "Superseded",
 icon: Clock,
 className: "bg-orange-100 text-orange-800 border-orange-300"
 },
 archived: {
 label: "Archived",
 icon: Archive,
 className: "card border"
 }
}

/**
 * Formats file size from bytes to human-readable format
 */
function formatFileSize(bytes: number): string {
 if (bytes === 0) return "0 Bytes"

 const k = 1024
 const i = Math.floor(Math.log(bytes) / Math.log(k))

 // Safe size unit selection
 let sizeUnit: string
 if (i === 0) sizeUnit = "Bytes"
 else if (i === 1) sizeUnit = "KB"
 else if (i === 2) sizeUnit = "MB"
 else sizeUnit = "GB"

 return Math.round((bytes / Math.pow(k, i)) * 100) / 100 + " " + sizeUnit
}

export function VersionTimeline({ versions, onVersionClick }: VersionTimelineProps) {
 const handleVersionClick = (version: Version) => (e: React.MouseEvent<HTMLButtonElement>) => {
 e.preventDefault()
 if (onVersionClick) {
 onVersionClick(version)
 }
 }

 if (versions.length === 0) {
 return (
 <Card className="p-8">
 <div className="text-center text-muted-foreground">
 <FileText className="w-12 h-12 mx-auto mb-2 opacity-50" aria-hidden="true" />
 <p className="text-sm">No versions available</p>
 </div>
 </Card>
 )
 }

 return (
 <div className="space-y-4" role="list" aria-label="Version history timeline">
 {versions.map((version, index) => {
 const config = versionStatusConfig[version.status]
 const StatusIcon = config.icon
 const isLast = index === versions.length - 1

 return (
 <div key={version.id} className="relative" role="listitem">
 {/* Timeline connector line */}
 {!isLast && (
 <div
 className="absolute left-4 top-12 bottom-0 w-0.5 bg-border -translate-x-1/2"
 aria-hidden="true"
 />
 )}

 <Card className={cn(
 "relative transition-all hover:shadow-md",
 version.status === "current" && "border-green-500 border-2"
 )}>
 <CardContent className="p-4">
 <div className="flex items-start gap-4">
 {/* Timeline dot */}
 <div className={cn(
 "flex-shrink-0 w-8 h-8 rounded-full flex items-center justify-center border-2",
 version.status === "current" && "bg-green-500 border-green-600",
 version.status === "superseded" && "bg-orange-500 border-orange-600",
 version.status === "archived" && "card border"
 )}>
 <StatusIcon
 className="w-4 h-4 text-white"
 aria-hidden="true"
 />
 </div>

 {/* Version content */}
 <div className="flex-1 min-w-0 space-y-2">
 <div className="flex items-start justify-between gap-4 flex-wrap">
 <div className="flex-1 min-w-0">
 <div className="flex items-center gap-2 flex-wrap">
 <h3 className="font-semibold text-base">
 Version {version.versionNumber}
 </h3>
 <Badge
 variant="outline"
 className={cn("text-xs", config.className)}
 >
 <StatusIcon className="w-3 h-3 mr-1" aria-hidden="true" />
 {config.label}
 </Badge>
 </div>

 <div className="flex items-center gap-1 text-sm text-muted-foreground mt-1">
 <User className="w-3 h-3" aria-hidden="true" />
 <span>{version.uploadedBy.name}</span>
 <span className="mx-1">•</span>
 <time dateTime={version.uploadedAt.toISOString()}>
 {formatDistanceToNow(version.uploadedAt, { addSuffix: true })}
 </time>
 </div>

 <div className="text-sm text-muted-foreground mt-1">
 {format(version.uploadedAt, "MMM d, yyyy 'at' h:mm a")}
 </div>
 </div>

 {onVersionClick && (
 <Button
 variant="outline"
 size="sm"
 onClick={handleVersionClick(version)}
 aria-label={`View version ${version.versionNumber}`}
 >
 <FileText className="w-4 h-4 mr-1" aria-hidden="true" />
 View
 </Button>
 )}
 </div>

 <div className="flex items-center gap-4 text-xs text-muted-foreground">
 <span className="truncate" title={version.fileName}>
 <FileText className="w-3 h-3 inline mr-1" aria-hidden="true" />
 {version.fileName}
 </span>
 <span className="flex-shrink-0">
 {formatFileSize(version.fileSize)}
 </span>
 </div>

 {version.notes && (
 <div className="mt-2 text-sm text-foreground bg-muted/50 p-2 rounded">
 {version.notes}
 </div>
 )}
 </div>
 </div>
 </CardContent>
 </Card>
 </div>
 )
 })}
 </div>
 )
}
