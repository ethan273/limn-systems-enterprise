"use client";

import { useState } from "react";
import { api } from "@/lib/api/client";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Link,
  Plus,
  MoreVertical,
  Trash2,
  ExternalLink,
  User,
  ShoppingCart,
  FolderOpen,
  Package,
  Palette,
  Factory,
  Users,
} from "lucide-react";

interface TaskEntityLinksProps {
  taskId: string;
  onUpdate?: () => void;
}

type EntityType = 'client' | 'project' | 'order' | 'collection' | 'item' | 'designer' | 'manufacturer' | 'partner';
type LinkType = 'related' | 'blocks' | 'depends_on';

export default function TaskEntityLinks({ taskId, onUpdate }: TaskEntityLinksProps) {
  const [isLinkDialogOpen, setIsLinkDialogOpen] = useState(false);
  const [selectedEntityType, setSelectedEntityType] = useState<EntityType>('client');
  const [selectedLinkType, setSelectedLinkType] = useState<LinkType>('related');

  const { data: entityLinks, isLoading, refetch } = api.tasks.getEntityLinks.useQuery({
    task_id: taskId,
  });

  const addEntityLinkMutation = api.tasks.addEntityLink.useMutation({
    onSuccess: () => {
      refetch();
      setIsLinkDialogOpen(false);
      onUpdate?.();
    },
  });

  const removeEntityLinkMutation = api.tasks.removeEntityLink.useMutation({
    onSuccess: () => {
      refetch();
      onUpdate?.();
    },
  });

  // Mock user ID - in production this would come from session
  const mockUserId = "550e8400-e29b-41d4-a716-446655440000";

  const handleAddEntityLink = () => {
    // Mock entity ID - in production this would come from a search/select dialog
    const mockEntityId = "880e8400-e29b-41d4-a716-446655440000";
    const mockEntityName = `Sample ${selectedEntityType}`;

    addEntityLinkMutation.mutate({
      task_id: taskId,
      entity_type: selectedEntityType,
      entity_id: mockEntityId,
      entity_name: mockEntityName,
      link_type: selectedLinkType,
      created_by: mockUserId,
    });
  };

  const handleRemoveEntityLink = (linkId: string) => {
    if (confirm("Are you sure you want to remove this link?")) {
      removeEntityLinkMutation.mutate({
        id: linkId,
        user_id: mockUserId,
      });
    }
  };

  const getEntityIcon = (entityType: EntityType) => {
    switch (entityType) {
      case 'client':
        return <User className="h-4 w-4 text-blue-400" />;
      case 'project':
        return <FolderOpen className="h-4 w-4 text-green-400" />;
      case 'order':
        return <ShoppingCart className="h-4 w-4 text-purple-400" />;
      case 'collection':
        return <Package className="h-4 w-4 text-yellow-400" />;
      case 'item':
        return <Package className="h-4 w-4 text-cyan-400" />;
      case 'designer':
        return <Palette className="h-4 w-4 text-pink-400" />;
      case 'manufacturer':
        return <Factory className="h-4 w-4 text-orange-400" />;
      case 'partner':
        return <Users className="h-4 w-4 text-indigo-400" />;
      default:
        return <Link className="h-4 w-4 text-gray-400" />;
    }
  };

  const getEntityColor = (entityType: EntityType) => {
    switch (entityType) {
      case 'client':
        return 'border-blue-400/30 bg-blue-400/10 text-blue-400';
      case 'project':
        return 'border-green-400/30 bg-green-400/10 text-green-400';
      case 'order':
        return 'border-purple-400/30 bg-purple-400/10 text-purple-400';
      case 'collection':
        return 'border-yellow-400/30 bg-yellow-400/10 text-yellow-400';
      case 'item':
        return 'border-cyan-400/30 bg-cyan-400/10 text-cyan-400';
      case 'designer':
        return 'border-pink-400/30 bg-pink-400/10 text-pink-400';
      case 'manufacturer':
        return 'border-orange-400/30 bg-orange-400/10 text-orange-400';
      case 'partner':
        return 'border-indigo-400/30 bg-indigo-400/10 text-indigo-400';
      default:
        return 'border-gray-400/30 bg-gray-400/10 text-gray-400';
    }
  };

  const getLinkTypeColor = (linkType: LinkType) => {
    switch (linkType) {
      case 'related':
        return 'bg-gray-500/20 text-gray-400 border-gray-500/20';
      case 'blocks':
        return 'bg-red-500/20 text-red-400 border-red-500/20';
      case 'depends_on':
        return 'bg-yellow-500/20 text-yellow-400 border-yellow-500/20';
      default:
        return 'bg-gray-500/20 text-gray-400 border-gray-500/20';
    }
  };

  if (isLoading) {
    return (
      <div className="space-y-3">
        <div className="flex items-center gap-2 text-sm font-medium text-gray-300">
          <Link className="h-4 w-4" />
          Linked Items
        </div>
        <div className="text-sm text-gray-500">Loading linked items...</div>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2 text-sm font-medium text-gray-300">
          <Link className="h-4 w-4" />
          Linked Items ({entityLinks?.length || 0})
        </div>
        <Dialog open={isLinkDialogOpen} onOpenChange={setIsLinkDialogOpen}>
          <DialogTrigger asChild>
            <Button variant="outline" size="sm" className="text-xs">
              <Plus className="h-3 w-3 mr-1" />
              Link Item
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-md">
            <DialogHeader>
              <DialogTitle>Link Entity</DialogTitle>
            </DialogHeader>
            <div className="space-y-4">
              <div className="space-y-2">
                <label className="text-sm font-medium text-gray-300">
                  Entity Type
                </label>
                <Select
                  value={selectedEntityType}
                  onValueChange={(value: EntityType) => setSelectedEntityType(value)}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="client">Client</SelectItem>
                    <SelectItem value="project">Project</SelectItem>
                    <SelectItem value="order">Order</SelectItem>
                    <SelectItem value="collection">Collection</SelectItem>
                    <SelectItem value="item">Item</SelectItem>
                    <SelectItem value="designer">Designer</SelectItem>
                    <SelectItem value="manufacturer">Manufacturer</SelectItem>
                    <SelectItem value="partner">Partner</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium text-gray-300">
                  Link Type
                </label>
                <Select
                  value={selectedLinkType}
                  onValueChange={(value: LinkType) => setSelectedLinkType(value)}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="related">Related</SelectItem>
                    <SelectItem value="blocks">Blocks</SelectItem>
                    <SelectItem value="depends_on">Depends On</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="flex justify-end gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setIsLinkDialogOpen(false)}
                  disabled={addEntityLinkMutation.isPending}
                >
                  Cancel
                </Button>
                <Button
                  size="sm"
                  onClick={handleAddEntityLink}
                  disabled={addEntityLinkMutation.isPending}
                >
                  {addEntityLinkMutation.isPending ? "Linking..." : "Link Entity"}
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      <div className="space-y-2">
        {entityLinks && entityLinks.length > 0 ? (
          entityLinks.map((link) => (
            <div
              key={link.id}
              className={`flex items-center justify-between p-2 rounded border transition-colors hover:bg-gray-700/30 ${getEntityColor(link.entity_type as EntityType)}`}
            >
              <div className="flex items-center gap-3 flex-1 min-w-0">
                {getEntityIcon(link.entity_type as EntityType)}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <p className="text-sm font-medium truncate">
                      {link.entity_name || `Unknown ${link.entity_type}`}
                    </p>
                    <Badge
                      variant="outline"
                      className={`text-xs ${getLinkTypeColor(link.link_type as LinkType)}`}
                    >
                      {link.link_type.replace('_', ' ')}
                    </Badge>
                  </div>
                  <p className="text-xs opacity-75 capitalize">
                    {link.entity_type}
                  </p>
                </div>
              </div>

              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
                    <MoreVertical className="h-4 w-4" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end">
                  <DropdownMenuItem>
                    <ExternalLink className="h-4 w-4 mr-2" />
                    View Details
                  </DropdownMenuItem>
                  <DropdownMenuItem
                    className="text-red-400"
                    onClick={() => handleRemoveEntityLink(link.id)}
                    disabled={removeEntityLinkMutation.isPending}
                  >
                    <Trash2 className="h-4 w-4 mr-2" />
                    Remove Link
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
          ))
        ) : (
          <div className="text-sm text-gray-500 py-2">
            No linked items
          </div>
        )}
      </div>
    </div>
  );
}