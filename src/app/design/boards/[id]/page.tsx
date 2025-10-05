"use client";

import { use,  useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { api } from "@/lib/api/client";
import { useAuthContext } from "@/lib/auth/AuthProvider";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "@/hooks/use-toast";
import { ArrowLeft, Share2, Copy, Image as ImageIcon } from "lucide-react";
import Link from "next/link";

export const dynamic = 'force-dynamic';

export default function MoodBoardDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
 const router = useRouter();
 const { user, loading: authLoading } = useAuthContext();
 const [shareUrl, setShareUrl] = useState<string>("");

 useEffect(() => {
 if (!authLoading && !user) {
 router.push("/login");
 }
 }, [authLoading, user, router]);

 const { data: board, isLoading } = api.moodBoards.getById.useQuery(
 { id: id },
 { enabled: !authLoading && !!user && !!id }
 );

 const generateShareLinkMutation = api.moodBoards.generateShareLink.useMutation();
 const revokeShareLinkMutation = api.moodBoards.revokeShareLink.useMutation();

 const handleGenerateShareLink = async () => {
 try {
 const result = await generateShareLinkMutation.mutateAsync({
 id: id,
 expiresInDays: 30,
 });
 setShareUrl(result.share_url);
 toast({
 title: "Success",
 description: "Share link generated successfully!",
 });
 } catch (error) {
 toast({
 title: "Error",
 description: "Failed to generate share link. Please try again.",
 variant: "destructive",
 });
 }
 };

 const handleCopyShareLink = () => {
 if (shareUrl) {
 navigator.clipboard.writeText(shareUrl);
 toast({
 title: "Copied",
 description: "Share link copied to clipboard!",
 });
 }
 };

 const handleRevokeShareLink = async () => {
 try {
 await revokeShareLinkMutation.mutateAsync({ id: id });
 setShareUrl("");
 toast({
 title: "Success",
 description: "Share link revoked successfully!",
 });
 window.location.reload();
 } catch (error) {
 toast({
 title: "Error",
 description: "Failed to revoke share link. Please try again.",
 variant: "destructive",
 });
 }
 };

 if (authLoading || isLoading) {
 return (
 <div className="container mx-auto py-6">
 <div className="flex items-center justify-center h-64">
 <div className="text-center">
 <div className="animate-spin rounded-full h-12 w-12 border-b-2 border mx-auto mb-4"></div>
 <p className="text-muted-foreground">Loading...</p>
 </div>
 </div>
 </div>
 );
 }

 if (!user || !board) {
 return null;
 }

 const images = (board.images as any[]) || [];

 return (
 <div className="container mx-auto py-6 max-w-6xl">
 {/* Header */}
 <div className="mb-6">
 <Link href="/design/boards">
 <Button variant="ghost" size="sm" className="mb-4">
 <ArrowLeft className="mr-2 h-4 w-4" />
 Back to Boards
 </Button>
 </Link>
 <div className="flex items-start justify-between">
 <div>
 <div className="flex items-center gap-3 mb-2">
 <h1 className="text-3xl font-bold">{board.name}</h1>
 <Badge variant="outline" className="capitalize">{board.board_type}</Badge>
 <Badge variant="outline">{board.status}</Badge>
 </div>
 <p className="text-muted-foreground">{board.description || "No description provided"}</p>
 <p className="text-sm text-muted-foreground mt-1">
 Board Number: {board.board_number}
 </p>
 </div>
 <div className="flex gap-2">
 {!board.is_shared ? (
 <Button onClick={handleGenerateShareLink} disabled={generateShareLinkMutation.isPending}>
 <Share2 className="mr-2 h-4 w-4" />
 {generateShareLinkMutation.isPending ? "Generating..." : "Share Board"}
 </Button>
 ) : (
 <Button variant="outline" onClick={handleRevokeShareLink} disabled={revokeShareLinkMutation.isPending}>
 <Share2 className="mr-2 h-4 w-4" />
 {revokeShareLinkMutation.isPending ? "Revoking..." : "Revoke Share"}
 </Button>
 )}
 </div>
 </div>
 </div>

 {/* Share Link Display */}
 {(shareUrl || board.is_shared) && (
 <Card className="mb-6">
 <CardHeader>
 <CardTitle className="text-lg">Share Link</CardTitle>
 <CardDescription>
 Anyone with this link can view the mood board (expires in 30 days)
 </CardDescription>
 </CardHeader>
 <CardContent>
 <div className="flex gap-2">
 <div className="flex-1 p-3 bg-muted rounded border font-mono text-sm break-all">
 {shareUrl || `${window.location.origin}/boards/shared/${board.share_token}`}
 </div>
 <Button variant="outline" onClick={handleCopyShareLink}>
 <Copy className="h-4 w-4" />
 </Button>
 </div>
 </CardContent>
 </Card>
 )}

 <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
 {/* Image Grid - Main Content */}
 <div className="lg:col-span-2 space-y-6">
 <Card>
 <CardHeader>
 <CardTitle>Board Images</CardTitle>
 <CardDescription>Visual references and inspiration</CardDescription>
 </CardHeader>
 <CardContent>
 {images.length > 0 ? (
 <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
 {images.map((image: any, index: number) => (
 <div
 key={index}
 className="aspect-square bg-gradient-to-br from-gray-100 to-gray-200 rounded-lg flex items-center justify-center overflow-hidden"
 >
 {image.url ? (
 // eslint-disable-next-line @next/next/no-img-element
 <img
 src={image.url}
 alt={image.title || `Image ${index + 1}`}
 className="w-full h-full object-cover"
 />
 ) : (
 <ImageIcon className="h-12 w-12 text-secondary" />
 )}
 </div>
 ))}
 </div>
 ) : (
 <div className="py-12 text-center">
 <ImageIcon className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
 <p className="text-muted-foreground">No images added to this board yet</p>
 <Button variant="outline" size="sm" className="mt-4">
 Add Images
 </Button>
 </div>
 )}
 </CardContent>
 </Card>

 {/* Notes Section */}
 <Card>
 <CardHeader>
 <CardTitle>Notes</CardTitle>
 </CardHeader>
 <CardContent>
 <Textarea
 value={board.notes || ""}
 placeholder="Add notes about this mood board..."
 rows={6}
 readOnly
 className="resize-none"
 />
 </CardContent>
 </Card>
 </div>

 {/* Sidebar - Board Info */}
 <div className="space-y-6">
 <Card>
 <CardHeader>
 <CardTitle>Board Details</CardTitle>
 </CardHeader>
 <CardContent className="space-y-4">
 <div className="flex items-center justify-between">
 <span className="text-sm text-muted-foreground">Board Type</span>
 <Badge variant="outline" className="capitalize">{board.board_type}</Badge>
 </div>
 <div className="flex items-center justify-between">
 <span className="text-sm text-muted-foreground">Status</span>
 <Badge variant="outline">{board.status}</Badge>
 </div>
 <div className="flex items-center justify-between">
 <span className="text-sm text-muted-foreground">Images</span>
 <span className="text-sm font-medium">{images.length}</span>
 </div>
 <div className="flex items-center justify-between">
 <span className="text-sm text-muted-foreground">Shared</span>
 <span className="text-sm font-medium">{board.is_shared ? "Yes" : "No"}</span>
 </div>
 </CardContent>
 </Card>

 {board.design_projects && (
 <Card>
 <CardHeader>
 <CardTitle>Associated Project</CardTitle>
 </CardHeader>
 <CardContent>
 <div className="space-y-3">
 <div>
 <h3 className="font-medium">{board.design_projects.project_name}</h3>
 <p className="text-sm text-muted-foreground">
 {board.design_projects.project_code || "No code"}
 </p>
 </div>
 <Link href={`/design/projects/${board.design_projects.id}`}>
 <Button variant="outline" size="sm" className="w-full">
 View Project
 </Button>
 </Link>
 </div>
 </CardContent>
 </Card>
 )}

 {board.designers && (
 <Card>
 <CardHeader>
 <CardTitle>Designer</CardTitle>
 </CardHeader>
 <CardContent>
 <div className="space-y-1">
 <p className="font-medium">{board.designers.name}</p>
 {board.designers.company_name && (
 <p className="text-sm text-muted-foreground">{board.designers.company_name}</p>
 )}
 </div>
 </CardContent>
 </Card>
 )}

 <Card>
 <CardHeader>
 <CardTitle>Created By</CardTitle>
 </CardHeader>
 <CardContent>
 <p className="text-sm">{board.users?.email || "Unknown"}</p>
 {board.created_at && (
 <p className="text-xs text-muted-foreground mt-1">
 {new Date(board.created_at).toLocaleDateString()}
 </p>
 )}
 </CardContent>
 </Card>
 </div>
 </div>
 </div>
 );
}
