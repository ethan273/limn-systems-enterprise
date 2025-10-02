"use client"

import * as React from "react"
import { Document, Page, pdfjs } from "react-pdf"
import {
 ChevronLeft,
 ChevronRight,
 ZoomIn,
 ZoomOut,
 Maximize,
 FileText,
 Loader2,
 AlertCircle
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import { Progress } from "@/components/ui/progress"
import { cn } from "@/lib/utils"
import type { AnnotationPoint } from "./PDFAnnotation"

// Configure PDF.js worker
if (typeof window !== "undefined") {
 pdfjs.GlobalWorkerOptions.workerSrc = `//unpkg.com/pdfjs-dist@${pdfjs.version}/build/pdf.worker.min.js`
}

export type ZoomLevel = "fit" | "actual" | number

export interface PDFViewerProps {
 fileUrl: string
 onPageChange?: (_page: number) => void
 annotations?: AnnotationPoint[]
 initialPage?: number
 className?: string
}

export function PDFViewer({
 fileUrl,
 onPageChange,
 initialPage = 1,
 className
}: PDFViewerProps) {
 const [numPages, setNumPages] = React.useState<number | null>(null)
 const [currentPage, setCurrentPage] = React.useState<number>(initialPage)
 const [scale, setScale] = React.useState<number>(1.0)
 const [isLoading, setIsLoading] = React.useState<boolean>(true)
 const [loadProgress, setLoadProgress] = React.useState<number>(0)
 const [error, setError] = React.useState<string | null>(null)
 const [pageInput, setPageInput] = React.useState<string>(String(initialPage))
 const containerRef = React.useRef<HTMLDivElement>(null)

 const handleDocumentLoadSuccess = ({ numPages: nextNumPages }: { numPages: number }) => {
 setNumPages(nextNumPages)
 setIsLoading(false)
 setError(null)
 }

 const handleDocumentLoadError = (err: Error) => {
 console.error("PDF load error:", err)
 setError("Failed to load PDF document. Please try again.")
 setIsLoading(false)
 }

 const handleDocumentLoadProgress = ({ loaded, total }: { loaded: number; total: number }) => {
 if (total > 0) {
 const progress = Math.round((loaded / total) * 100)
 setLoadProgress(progress)
 }
 }

 const goToPreviousPage = (e: React.MouseEvent<HTMLButtonElement>) => {
 e.preventDefault()
 if (currentPage > 1) {
 const newPage = currentPage - 1
 setCurrentPage(newPage)
 setPageInput(String(newPage))
 if (onPageChange) {
 onPageChange(newPage)
 }
 }
 }

 const goToNextPage = (e: React.MouseEvent<HTMLButtonElement>) => {
 e.preventDefault()
 if (numPages && currentPage < numPages) {
 const newPage = currentPage + 1
 setCurrentPage(newPage)
 setPageInput(String(newPage))
 if (onPageChange) {
 onPageChange(newPage)
 }
 }
 }

 const handlePageInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
 setPageInput(e.target.value)
 }

 const handlePageInputBlur = () => {
 const pageNumber = parseInt(pageInput, 10)
 if (!isNaN(pageNumber) && numPages && pageNumber >= 1 && pageNumber <= numPages) {
 setCurrentPage(pageNumber)
 if (onPageChange) {
 onPageChange(pageNumber)
 }
 } else {
 // Reset to current page if invalid
 setPageInput(String(currentPage))
 }
 }

 const handlePageInputKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
 if (e.key === "Enter") {
 handlePageInputBlur()
 }
 }

 const zoomIn = (e: React.MouseEvent<HTMLButtonElement>) => {
 e.preventDefault()
 setScale(prev => Math.min(prev + 0.25, 3.0))
 }

 const zoomOut = (e: React.MouseEvent<HTMLButtonElement>) => {
 e.preventDefault()
 setScale(prev => Math.max(prev - 0.25, 0.5))
 }

 const fitToWidth = (e: React.MouseEvent<HTMLButtonElement>) => {
 e.preventDefault()
 setScale(1.0)
 }

 const actualSize = (e: React.MouseEvent<HTMLButtonElement>) => {
 e.preventDefault()
 setScale(1.5)
 }

 // Update page input when currentPage changes externally
 React.useEffect(() => {
 setPageInput(String(currentPage))
 }, [currentPage])

 return (
 <div className={cn("flex flex-col h-full", className)}>
 {/* Toolbar */}
 <div className="bg-muted border-b border-border p-2 flex items-center justify-between gap-2 flex-wrap">
 {/* Pagination controls */}
 <div className="flex items-center gap-2">
 <Button
 variant="outline"
 size="sm"
 onClick={goToPreviousPage}
 disabled={currentPage <= 1 || isLoading}
 aria-label="Previous page"
 >
 <ChevronLeft className="w-4 h-4" aria-hidden="true" />
 </Button>

 <div className="flex items-center gap-1 text-sm">
 <label htmlFor="page-input" className="sr-only">
 Current page number
 </label>
 <input
 id="page-input"
 type="text"
 value={pageInput}
 onChange={handlePageInputChange}
 onBlur={handlePageInputBlur}
 onKeyDown={handlePageInputKeyDown}
 disabled={isLoading || !numPages}
 className="w-12 px-2 py-1 text-center border border-border rounded bg-background disabled:opacity-50"
 aria-label="Page number input"
 />
 <span className="text-muted-foreground">
 / {numPages || "-"}
 </span>
 </div>

 <Button
 variant="outline"
 size="sm"
 onClick={goToNextPage}
 disabled={!numPages || currentPage >= numPages || isLoading}
 aria-label="Next page"
 >
 <ChevronRight className="w-4 h-4" aria-hidden="true" />
 </Button>
 </div>

 {/* Zoom controls */}
 <div className="flex items-center gap-2">
 <Button
 variant="outline"
 size="sm"
 onClick={zoomOut}
 disabled={scale <= 0.5 || isLoading}
 aria-label="Zoom out"
 >
 <ZoomOut className="w-4 h-4" aria-hidden="true" />
 </Button>

 <span className="text-sm text-muted-foreground min-w-[3rem] text-center">
 {Math.round(scale * 100)}%
 </span>

 <Button
 variant="outline"
 size="sm"
 onClick={zoomIn}
 disabled={scale >= 3.0 || isLoading}
 aria-label="Zoom in"
 >
 <ZoomIn className="w-4 h-4" aria-hidden="true" />
 </Button>

 <Button
 variant="outline"
 size="sm"
 onClick={fitToWidth}
 disabled={isLoading}
 aria-label="Fit to width"
 >
 <Maximize className="w-4 h-4" aria-hidden="true" />
 Fit
 </Button>

 <Button
 variant="outline"
 size="sm"
 onClick={actualSize}
 disabled={isLoading}
 aria-label="Actual size"
 >
 <FileText className="w-4 h-4" aria-hidden="true" />
 100%
 </Button>
 </div>
 </div>

 {/* PDF container */}
 <div
 ref={containerRef}
 className="flex-1 overflow-auto card flex items-center justify-center p-4"
 >
 {error && (
 <Card className="p-8 max-w-md">
 <div className="text-center space-y-4">
 <AlertCircle className="w-12 h-12 mx-auto text-destructive" aria-hidden="true" />
 <div>
 <h3 className="font-semibold text-lg mb-2">Error Loading PDF</h3>
 <p className="text-sm text-muted-foreground">{error}</p>
 </div>
 <Button
 onClick={() => {
 setError(null)
 setIsLoading(true)
 setLoadProgress(0)
 }}
 aria-label="Retry loading PDF"
 >
 Retry
 </Button>
 </div>
 </Card>
 )}

 {isLoading && !error && (
 <Card className="p-8 max-w-md w-full">
 <div className="text-center space-y-4">
 <Loader2 className="w-12 h-12 mx-auto animate-spin text-primary" aria-hidden="true" />
 <div>
 <h3 className="font-semibold text-lg mb-2">Loading PDF</h3>
 <p className="text-sm text-muted-foreground mb-4">
 Please wait while we load the document...
 </p>
 <Progress value={loadProgress} className="w-full" aria-label="Loading progress" />
 <p className="text-xs text-muted-foreground mt-2">
 {loadProgress}% complete
 </p>
 </div>
 </div>
 </Card>
 )}

 {!error && (
 <Document
 file={fileUrl}
 onLoadSuccess={handleDocumentLoadSuccess}
 onLoadError={handleDocumentLoadError}
 onLoadProgress={handleDocumentLoadProgress}
 loading={null}
 error={null}
 className="pdf-document"
 >
 <Page
 pageNumber={currentPage}
 scale={scale}
 loading={null}
 error={null}
 className="pdf-page shadow-lg"
 renderTextLayer={true}
 renderAnnotationLayer={true}
 />
 </Document>
 )}
 </div>
 </div>
 )
}
