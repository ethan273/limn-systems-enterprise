"use client";

import { use,  useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { api } from "@/lib/api/client";
import { useAuthContext } from "@/lib/auth/AuthProvider";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "@/hooks/use-toast";
import {
  EntityDetailHeader,
  InfoCard,
  StatusBadge,
  LoadingState,
  EmptyState,
  type EntityMetadata,
} from "@/components/common";
import { ArrowLeft, Share2, Copy, Image as ImageIcon, Calendar, Layers } from "lucide-react";
import Link from "next/link";
import { format } from "date-fns";

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
 <div className="page-container">
 <LoadingState message="Loading mood board details..." size="lg" />
 </div>
 );
 }

 if (!user || !board) {
 return (
 <div className="page-container">
 <EmptyState
 icon={ImageIcon}
 title="Mood Board Not Found"
 description="The mood board you're looking for doesn't exist or you don't have permission to view it."
 action={{
 label: 'Back to Boards',
 onClick: () => router.push("/design/boards"),
 icon: ArrowLeft,
 }}
 />
 </div>
 );
 }

 const images = (board.images as any[]) || [];

 const metadata: EntityMetadata[] = [
 { icon: Layers, value: board.board_type, label: 'Type' },
 { icon: ImageIcon, value: `${images.length} images`, label: 'Images' },
 { icon: Calendar, value: board.created_at ? format(new Date(board.created_at), "MMM dd, yyyy") : "N/A", label: 'Created' },
 ];

 return (
 <div className="page-container">
 {/* Header */}
 <div className="page-header">
 <Button variant="ghost" onClick={() => router.push("/design/boards")} className="btn-secondary">
 <ArrowLeft className="icon-sm" aria-hidden="true" />
 Back
 </Button>
 </div>

 <EntityDetailHeader
 icon={ImageIcon}
 title={board.name}
 subtitle={board.description || "No description provided"}
 metadata={metadata}
 status={board.status}
 actions={[
 {
 label: board.is_shared ? 'Revoke Share' : 'Share Board',
 icon: Share2,
 onClick: board.is_shared ? handleRevokeShareLink : handleGenerateShareLink,
 variant: board.is_shared ? 'outline' : 'default',
 },
 ]}
 />

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

 {/* Board Details */}
 <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-6">
 <InfoCard
 title="Board Information"
 items={[
 { label: 'Board Number', value: board.board_number },
 { label: 'Board Type', value: board.board_type },
 { label: 'Status', value: <StatusBadge status={board.status} /> },
 { label: 'Images', value: `${images.length}` },
 { label: 'Shared', value: board.is_shared ? "Yes" : "No" },
 { label: 'Created', value: board.created_at ? format(new Date(board.created_at), "MMM dd, yyyy") : "N/A" },
 ]}
 />

 {board.designers && (
 <InfoCard
 title="Designer"
 items={[
 { label: 'Name', value: board.designers.name },
 { label: 'Company', value: board.designers.company_name || "N/A" },
 ]}
 />
 )}

 {board.design_projects && (
 <InfoCard
 title="Associated Project"
 items={[
 { label: 'Project Name', value: board.design_projects.project_name },
 { label: 'Project Code', value: board.design_projects.project_code || "No code" },
 { label: '', value: <Link href={`/design/projects/${board.design_projects.id}`}><Button variant="outline" size="sm">View Project</Button></Link> },
 ]}
 />
 )}
 </div>

 <div className="grid grid-cols-1 gap-6">
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
 </div>
 );
}
