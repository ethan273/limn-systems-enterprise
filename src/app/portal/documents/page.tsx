"use client";

import React, { useState } from "react";
import { api } from "@/lib/api/client";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  FileText,
  Download,
  Search,
  File,
  Image as ImageIcon,
  FileArchive,
  Calendar,
  Folder,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { format } from "date-fns";

// Dynamic route configuration
export const dynamic = 'force-dynamic';

const documentTypeConfig: Record<string, { label: string; icon: React.ReactNode; className: string }> = {
  invoice: {
    label: "Invoice",
    icon: <FileText className="w-4 h-4" aria-hidden="true" />,
    className: "bg-blue-100 text-blue-800 border-blue-300",
  },
  quote: {
    label: "Quote",
    icon: <FileText className="w-4 h-4" aria-hidden="true" />,
    className: "bg-purple-100 text-purple-800 border-purple-300",
  },
  contract: {
    label: "Contract",
    icon: <FileText className="w-4 h-4" aria-hidden="true" />,
    className: "bg-green-100 text-green-800 border-green-300",
  },
  shop_drawing: {
    label: "Shop Drawing",
    icon: <ImageIcon className="w-4 h-4" aria-hidden="true" />,
    className: "bg-orange-100 text-orange-800 border-orange-300",
  },
  photo: {
    label: "Photo",
    icon: <ImageIcon className="w-4 h-4" aria-hidden="true" />,
    className: "bg-pink-100 text-pink-800 border-pink-300",
  },
  shipping: {
    label: "Shipping Document",
    icon: <FileArchive className="w-4 h-4" aria-hidden="true" />,
    className: "bg-teal-100 text-teal-800 border-teal-300",
  },
  other: {
    label: "Other",
    icon: <File className="w-4 h-4" aria-hidden="true" />,
    className: "badge-neutral",
  },
};

export default function DocumentsPage() {
  const [typeFilter, setTypeFilter] = useState<string>("all");
  const [searchQuery, setSearchQuery] = useState("");

  // Fetch customer documents
  const { data, isLoading } = api.portal.getCustomerDocuments.useQuery({
    documentType: typeFilter === "all" ? undefined : typeFilter,
    limit: 100,
    offset: 0,
  });

  const documents = data?.documents || [];

  // Client-side search filtering
  const filteredDocuments = documents.filter((doc) => {
    if (!searchQuery) return true;
    const searchLower = searchQuery.toLowerCase();
    return (
      doc.name?.toLowerCase().includes(searchLower) ||
      doc.project_name?.toLowerCase().includes(searchLower) ||
      doc.category?.toLowerCase().includes(searchLower)
    );
  });

  // Calculate statistics
  const stats = {
    total: documents.length,
    invoices: documents.filter((d) => d.type === "invoice").length,
    shopDrawings: documents.filter((d) => d.type === "shop_drawing").length,
    shipping: documents.filter((d) => d.type === "shipping").length,
    photos: documents.filter((d) => d.type === "photo").length,
  };

  const handleDownload = (doc: any) => {
    const url = doc.download_url || doc.url || doc.google_drive_url;
    if (url) {
      window.open(url, '_blank');
    }
  };

  return (
    <div className="container mx-auto p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Documents</h1>
          <p className="text-muted-foreground">Access your project documents and files</p>
        </div>
      </div>

      {/* Statistics Cards */}
      <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Documents</CardTitle>
            <Folder className="h-4 w-4 text-muted-foreground" aria-hidden="true" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.total}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Invoices</CardTitle>
            <FileText className="h-4 w-4 text-muted-foreground" aria-hidden="true" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-blue-600">{stats.invoices}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Shop Drawings</CardTitle>
            <ImageIcon className="h-4 w-4 text-muted-foreground" aria-hidden="true" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-orange-600">{stats.shopDrawings}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Shipping Docs</CardTitle>
            <FileArchive className="h-4 w-4 text-muted-foreground" aria-hidden="true" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-teal-600">{stats.shipping}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Photos</CardTitle>
            <ImageIcon className="h-4 w-4 text-muted-foreground" aria-hidden="true" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-pink-600">{stats.photos}</div>
          </CardContent>
        </Card>
      </div>

      {/* Filters */}
      <Card>
        <CardHeader>
          <CardTitle>Filter Documents</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col md:flex-row gap-4">
            {/* Search */}
            <div className="flex-1">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground w-4 h-4" aria-hidden="true" />
                <Input
                  placeholder="Search documents, descriptions, or projects..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>

            {/* Type Filter */}
            <div className="w-full md:w-[250px]">
              <Select value={typeFilter} onValueChange={setTypeFilter}>
                <SelectTrigger>
                  <SelectValue placeholder="Filter by type" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Types</SelectItem>
                  <SelectItem value="invoice">Invoices</SelectItem>
                  <SelectItem value="quote">Quotes</SelectItem>
                  <SelectItem value="contract">Contracts</SelectItem>
                  <SelectItem value="shop_drawing">Shop Drawings</SelectItem>
                  <SelectItem value="photo">Photos</SelectItem>
                  <SelectItem value="shipping">Shipping Documents</SelectItem>
                  <SelectItem value="other">Other</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Documents Table */}
      <Card>
        <CardHeader>
          <CardTitle>Document Library</CardTitle>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="text-center py-8 text-muted-foreground">Loading documents...</div>
          ) : filteredDocuments.length === 0 ? (
            <div className="text-center py-12 text-muted-foreground">
              <FileText className="w-12 h-12 mx-auto mb-2 opacity-50" aria-hidden="true" />
              <p>No documents found</p>
              {searchQuery && <p className="text-sm mt-2">Try adjusting your search</p>}
            </div>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Document Name</TableHead>
                    <TableHead>Type</TableHead>
                    <TableHead>Project</TableHead>
                    <TableHead>Description</TableHead>
                    <TableHead>Upload Date</TableHead>
                    <TableHead>Size</TableHead>
                    <TableHead>Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredDocuments.map((doc) => {
                    const typeConfig = documentTypeConfig[doc.type || 'other'] || documentTypeConfig.other;
                    const downloadUrl = doc.download_url || doc.url || doc.google_drive_url;

                    return (
                      <TableRow key={doc.id} className="hover:bg-muted/50">
                        <TableCell>
                          <div className="flex items-center gap-2">
                            {typeConfig.icon}
                            <span className="font-medium">{doc.name || "Untitled"}</span>
                          </div>
                        </TableCell>
                        <TableCell>
                          <Badge variant="outline" className={cn(typeConfig.className)}>
                            {typeConfig.label}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          <span className="text-sm">{doc.project_name || "—"}</span>
                        </TableCell>
                        <TableCell>
                          <span className="text-sm text-muted-foreground">
                            {doc.category || "—"}
                          </span>
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center gap-1 text-sm">
                            <Calendar className="w-3 h-3 text-muted-foreground" aria-hidden="true" />
                            {doc.created_at
                              ? format(new Date(doc.created_at), "MMM d, yyyy")
                              : "—"}
                          </div>
                        </TableCell>
                        <TableCell>
                          <span className="text-sm text-muted-foreground">
                            {doc.size
                              ? `${(Number(doc.size) / 1024 / 1024).toFixed(2)} MB`
                              : "—"}
                          </span>
                        </TableCell>
                        <TableCell>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handleDownload(doc)}
                            disabled={!downloadUrl}
                          >
                            <Download className="w-4 h-4 mr-2" aria-hidden="true" />
                            Download
                          </Button>
                        </TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
