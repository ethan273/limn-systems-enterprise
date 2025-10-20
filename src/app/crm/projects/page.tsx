"use client";

import React, { useState } from "react";
import { useRouter } from "next/navigation";
import { api } from "@/lib/api/client";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import {
 Select,
 SelectContent,
 SelectItem,
 SelectTrigger,
 SelectValue
} from "@/components/ui/select";
import {
 Dialog,
 DialogContent,
 DialogDescription,
 DialogFooter,
 DialogHeader,
 DialogTitle,
} from "@/components/ui/dialog";
import {
 DropdownMenu,
 DropdownMenuContent,
 DropdownMenuItem,
 DropdownMenuSeparator,
 DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
 Search,
 Plus,
 Package,
 MoreVertical,
 Edit,
 Trash2,
 Eye,
 Filter,
 DollarSign,
 ClipboardList,
 Target,
 CheckCircle2,
 Clock,
 AlertCircle,
 AlertTriangle,
 RefreshCw
} from "lucide-react";
import { toast } from "@/hooks/use-toast";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import {
  PageHeader,
  StatsGrid,
  type StatItem,
} from "@/components/common";
import { OrderCreationDialog, type OrderCreationFormData } from "@/components/crm/OrderCreationDialog";
import { generateProductSku } from "@/lib/utils/product-sku-generator";
import { getFullName } from "@/lib/utils/name-utils";
import { LoadingState } from "@/components/common";

interface Project {
 id: string;
 name: string;
 description?: string | null;
 client_id: string;
 client_name: string;
 client_company?: string | null;
 status: 'planning' | 'active' | 'review' | 'completed' | 'on_hold' | 'cancelled';
 priority: 'low' | 'medium' | 'high' | 'urgent';
 start_date?: Date | null;
 end_date?: Date | null;
 budget?: number | null;
 actual_cost?: number | null;
 ordered_items_count: number;
 ordered_items_value: number;
 completion_percentage: number;
 manager_id?: string | null;
 manager_name?: string | null;
 notes?: string | null;
 created_at?: Date | null;
 updated_at?: Date | null;
}

interface ProjectFormData {
 name: string;
 description: string;
 client_id: string;
 status: string;
 priority: string;
 start_date: string;
 end_date: string;
 budget: string;
 manager_id: string;
 notes: string;
}

function ProjectDialog({
 project,
 isOpen,
 onClose,
 onSave,
}: {
 project?: Project;
 isOpen: boolean;
 onClose: () => void;
 onSave: (_data: ProjectFormData) => void;
}) {
 const [formData, setFormData] = useState<ProjectFormData>({
 name: project?.name || "",
 description: project?.description || "",
 client_id: project?.client_id || "",
 status: project?.status || "planning",
 priority: project?.priority || "medium",
 start_date: project?.start_date ? project.start_date.toISOString().split('T')[0] : "",
 end_date: project?.end_date ? project.end_date.toISOString().split('T')[0] : "",
 budget: project?.budget?.toString() || "",
 manager_id: project?.manager_id || "",
 notes: project?.notes || "",
 });

 const { data: customers } = api.crm.customers.getAll.useQuery({
 limit: 100,
 offset: 0,
 });

 const handleSave = () => {
 if (!formData.name.trim()) {
 toast({
 title: "Validation Error",
 description: "Project name is required.",
 variant: "destructive",
 });
 return;
 }

 if (!formData.client_id) {
 toast({
 title: "Validation Error",
 description: "Client selection is required.",
 variant: "destructive",
 });
 return;
 }

 onSave(formData);
 };

 const statuses = [
 { value: "planning", label: "Planning" },
 { value: "active", label: "Active" },
 { value: "review", label: "Review" },
 { value: "completed", label: "Completed" },
 { value: "on_hold", label: "On Hold" },
 { value: "cancelled", label: "Cancelled" },
 ];

 const priorities = [
 { value: "low", label: "Low" },
 { value: "medium", label: "Medium" },
 { value: "high", label: "High" },
 { value: "urgent", label: "Urgent" },
 ];

 return (
 <Dialog open={isOpen} onOpenChange={onClose}>
 <DialogContent className="max-w-2xl">
 <DialogHeader>
 <DialogTitle>
 {project ? "Edit Project" : "Create New Project"}
 </DialogTitle>
 <DialogDescription>
 {project
 ? "Update project information and timeline."
 : "Create a new project and assign it to a client."}
 </DialogDescription>
 </DialogHeader>

 <div className="grid gap-4 py-4">
 <div className="grid grid-cols-2 gap-4">
 <div className="space-y-2">
 <Label htmlFor="name">Project Name *</Label>
 <Input
 id="name"
 value={formData.name}
 onChange={(e) => setFormData({ ...formData, name: e.target.value })}
 placeholder="Enter project name"
 />
 </div>
 <div className="space-y-2">
 <Label htmlFor="client_id">Client *</Label>
 <Select
 value={formData.client_id}
 onValueChange={(value) => setFormData({ ...formData, client_id: value })}
 >
 <SelectTrigger>
 <SelectValue placeholder="Select client" />
 </SelectTrigger>
 <SelectContent>
 {customers?.items?.map((customer) => (
 <SelectItem key={customer.id} value={customer.id}>
 {getFullName(customer)} {customer.company ? `(${customer.company})` : ""}
 </SelectItem>
 ))}
 </SelectContent>
 </Select>
 </div>
 </div>

 <div className="space-y-2">
 <Label htmlFor="description">Description</Label>
 <Textarea
 id="description"
 value={formData.description}
 onChange={(e) => setFormData({ ...formData, description: e.target.value })}
 placeholder="Project description"
 rows={3}
 />
 </div>

 <div className="grid grid-cols-2 gap-4">
 <div className="space-y-2">
 <Label htmlFor="status">Status</Label>
 <Select
 value={formData.status}
 onValueChange={(value) => setFormData({ ...formData, status: value })}
 >
 <SelectTrigger>
 <SelectValue />
 </SelectTrigger>
 <SelectContent>
 {statuses.map((status) => (
 <SelectItem key={status.value} value={status.value}>
 {status.label}
 </SelectItem>
 ))}
 </SelectContent>
 </Select>
 </div>
 <div className="space-y-2">
 <Label htmlFor="priority">Priority</Label>
 <Select
 value={formData.priority}
 onValueChange={(value) => setFormData({ ...formData, priority: value })}
 >
 <SelectTrigger>
 <SelectValue />
 </SelectTrigger>
 <SelectContent>
 {priorities.map((priority) => (
 <SelectItem key={priority.value} value={priority.value}>
 {priority.label}
 </SelectItem>
 ))}
 </SelectContent>
 </Select>
 </div>
 </div>

 <div className="grid grid-cols-2 gap-4">
 <div className="space-y-2">
 <Label htmlFor="start_date">Start Date</Label>
 <Input
 id="start_date"
 type="date"
 value={formData.start_date}
 onChange={(e) => setFormData({ ...formData, start_date: e.target.value })}
 />
 </div>
 <div className="space-y-2">
 <Label htmlFor="end_date">End Date</Label>
 <Input
 id="end_date"
 type="date"
 value={formData.end_date}
 onChange={(e) => setFormData({ ...formData, end_date: e.target.value })}
 />
 </div>
 </div>

 <div className="space-y-2">
 <Label htmlFor="budget">Budget ($)</Label>
 <Input
 id="budget"
 type="number"
 step="0.01"
 value={formData.budget}
 onChange={(e) => setFormData({ ...formData, budget: e.target.value })}
 placeholder="0.00"
 />
 </div>

 <div className="space-y-2">
 <Label htmlFor="notes">Notes</Label>
 <Textarea
 id="notes"
 value={formData.notes}
 onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
 placeholder="Additional notes"
 rows={3}
 />
 </div>
 </div>

 <DialogFooter>
 <Button variant="outline" onClick={onClose}>
 Cancel
 </Button>
 <Button onClick={handleSave}>
 {project ? "Update Project" : "Create Project"}
 </Button>
 </DialogFooter>
 </DialogContent>
 </Dialog>
 );
}

export default function ProjectsPage() {
 const router = useRouter();
 const [searchTerm, setSearchTerm] = useState("");
 const [selectedStatus, setSelectedStatus] = useState("");
 const [selectedPriority, setSelectedPriority] = useState("");
 const [selectedProject, setSelectedProject] = useState<Project | undefined>();
 const [isProjectDialogOpen, setIsProjectDialogOpen] = useState(false);
 const [orderCreationProjectId, setOrderCreationProjectId] = useState<string>("");
 const [isOrderDialogOpen, setIsOrderDialogOpen] = useState(false);

 // Query all materials at parent level for SKU generation in handleSaveOrder
 const { data: allMaterialsForSKU, isLoading: isLoadingMaterials } = api.products.getAllMaterials.useQuery();

 // State for tracking order items across dialog sessions
 const [orderItems, setOrderItems] = useState<Array<{
 id: string;
 product_name: string;
 product_sku: string; // Hierarchical material SKU for manufacturing
 project_sku: string; // Client/project tracking SKU
 base_sku: string; // Original catalog SKU
 quantity: number;
 unit_price: number;
 total_price: number;
 material_selections: Record<string, string>;
 custom_specifications?: string;
 }>>([]);

 // Get projects from API
 const { data: projectsData, isLoading: isLoadingProjects, error: projectsError } = api.projects.getAll.useQuery({
 limit: 100,
 offset: 0,
 });

 const projects = projectsData?.items || [];

 // Get collections and customers for SKU generation
 const { data: collections, isLoading: isLoadingCollections, error: collectionsError } = api.products.getAllCollections.useQuery();
 const { data: customersData, isLoading: isLoadingCustomers, error: customersError } = api.crm.customers.getAll.useQuery({
 limit: 100,
 offset: 0,
 });
 const _customers = customersData?.items || [];

 // Get tRPC utils for cache invalidation (must be before early returns)
 const utils = api.useUtils();

 // Loading state check
 if (isLoadingProjects || isLoadingMaterials || isLoadingCollections || isLoadingCustomers) {
   return (
     <div className="page-container">
       <LoadingState message="Loading projects..." size="lg" />
     </div>
   );
 }

 // Error state check
 if (projectsError || collectionsError || customersError) {
   return (
     <div className="page-container">
       <div className="flex flex-col items-center justify-center py-12 space-y-4">
         <div className="flex items-center justify-center w-16 h-16 rounded-full bg-destructive/10">
           <AlertTriangle className="w-8 h-8 text-destructive" />
         </div>
         <div className="text-center space-y-2">
           <h3 className="text-lg font-semibold">Failed to load projects</h3>
           <p className="text-sm text-muted-foreground max-w-md">
             {projectsError?.message || collectionsError?.message || customersError?.message || 'An error occurred while loading the projects.'}
           </p>
         </div>
         <Button
           onClick={() => {
             utils.projects.getAll.invalidate();
             utils.products.getAllCollections.invalidate();
             utils.crm.customers.getAll.invalidate();
           }}
           variant="outline"
           className="gap-2"
         >
           <RefreshCw className="w-4 h-4" />
           Try Again
         </Button>
       </div>
     </div>
   );
 }

 const filteredProjects = projects.filter((project: any) => {
 const matchesSearch = project.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
 (project.customers?.name || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
 (project.customers?.company || '').toLowerCase().includes(searchTerm.toLowerCase());

 const matchesStatus = !selectedStatus || selectedStatus === "all" || project.status === selectedStatus;
 const matchesPriority = !selectedPriority || selectedPriority === "all" || project.priority === selectedPriority;

 return matchesSearch && matchesStatus && matchesPriority;
 });

 const statuses = [
 { value: "planning", label: "Planning", color: "btn-primary text-info dark:btn-primary dark:text-info", icon: Target },
 { value: "active", label: "Active", color: "bg-warning-muted text-warning dark:bg-warning-muted dark:text-warning", icon: Clock },
 { value: "review", label: "Review", color: "btn-secondary text-secondary dark:btn-secondary dark:text-secondary", icon: Eye },
 { value: "completed", label: "Completed", color: "bg-success-muted text-success dark:bg-success-muted dark:text-success", icon: CheckCircle2 },
 { value: "on_hold", label: "On Hold", color: "bg-orange-100 text-warning dark:bg-orange-900 dark:text-warning", icon: AlertCircle },
 { value: "cancelled", label: "Cancelled", color: "bg-destructive-muted text-destructive dark:bg-destructive-muted dark:text-destructive", icon: AlertCircle },
 ];

 const priorities = [
 { value: "low", label: "Low", color: "badge-neutral" },
 { value: "medium", label: "Medium", color: "btn-primary text-info dark:btn-primary dark:text-info" },
 { value: "high", label: "High", color: "bg-orange-100 text-warning dark:bg-orange-900 dark:text-warning" },
 { value: "urgent", label: "Urgent", color: "bg-destructive-muted text-destructive dark:bg-destructive-muted dark:text-destructive" },
 ];

 const getStatusInfo = (status: string) => {
 return statuses.find(s => s.value === status) || statuses[0];
 };

 const getPriorityColor = (priority: string) => {
 return priorities.find(p => p.value === priority)?.color || "badge-neutral";
 };

 const handleCreateProject = () => {
 setSelectedProject(undefined);
 setIsProjectDialogOpen(true);
 };

 const handleEditProject = (project: Project) => {
 setSelectedProject(project);
 setIsProjectDialogOpen(true);
 };

 const createProjectMutation = api.projects.create.useMutation();
 const updateProjectMutation = api.projects.update.useMutation();
 const createCRMOrderMutation = api.orders.createWithItems.useMutation();
 const createProductionOrderMutation = api.productionOrders.create.useMutation();
 const createInvoiceForOrderMutation = api.productionInvoices.createForOrder.useMutation();

 const handleSaveProject = async (data: ProjectFormData) => {
 try {
 const projectData = {
 name: data.name,
 customer_id: data.client_id || undefined, // Map client_id to customer_id for API, convert empty string to undefined
 description: data.description || undefined,
 status: data.status as 'planning' | 'active' | 'on_hold' | 'completed' | 'cancelled',
 priority: data.priority as 'low' | 'medium' | 'high' | 'urgent',
 start_date: data.start_date ? new Date(data.start_date) : undefined,
 end_date: data.end_date ? new Date(data.end_date) : undefined,
 budget: data.budget ? parseFloat(data.budget) : undefined,
 };

 if (selectedProject) {
 await updateProjectMutation.mutateAsync({
 id: selectedProject.id,
 ...projectData,
 });
 } else {
 await createProjectMutation.mutateAsync(projectData);
 }

 toast({
 title: selectedProject ? "Project Updated" : "Project Created",
 description: `${data.name} has been ${selectedProject ? "updated" : "created"} successfully.`,
 });

 setIsProjectDialogOpen(false);
 // Invalidate queries for instant updates
 utils.projects.getAll.invalidate();
 } catch (error) {
 toast({
 title: "Error",
 description: `Failed to ${selectedProject ? "update" : "create"} project. Please try again.`,
 variant: "destructive",
 });
 }
 };

 const handleCreateOrder = (projectId: string) => {
 setOrderCreationProjectId(projectId);
 setIsOrderDialogOpen(true);
 };

 const handleFinalizeOrder = async (projectId: string) => {
 if (orderItems.length === 0) {
 toast({
 title: "Error",
 description: "No items in order to finalize.",
 variant: "destructive",
 });
 return;
 }

 try {
 // Find the project to get customer_id
 const project = projects.find((p: any) => p.id === projectId);
 if (!project) {
 toast({
 title: "Error",
 description: "Project not found.",
 variant: "destructive",
 });
 return;
 }

 // STEP 1: Create CRM Order with all items
 const crmOrderResult = await createCRMOrderMutation.mutateAsync({
 project_id: projectId,
 customer_id: project.customer_id,
 collection_id: orderItems[0]?.base_sku ? undefined : undefined,
 order_items: orderItems.map(item => ({
 product_name: item.product_name,
 product_sku: item.product_sku,
 project_sku: item.project_sku,
 base_sku: item.base_sku,
 quantity: item.quantity,
 unit_price: item.unit_price,
 total_price: item.total_price,
 material_selections: item.material_selections,
 custom_specifications: item.custom_specifications,
 })),
 notes: `Order created from project: ${project.name}`,
 priority: 'normal',
 });

 const crmOrderId = crmOrderResult.order.id;
 const crmOrderNumber = crmOrderResult.order.order_number;

 // STEP 2: Create production orders (one per order item) - all linked to CRM order
 const createdProductionOrders: any[] = [];
 let totalCost = 0;

 for (const item of orderItems) {
 // Determine product type from base SKU prefix
 // If base_sku starts with collection prefix (e.g., "XX-"), it's a catalog item
 // Otherwise, it's a custom item
 const isCustomItem = !item.base_sku || item.base_sku.startsWith('TEMP-') || item.base_sku.startsWith('CUSTOM-');
 const productType = isCustomItem ? 'concept' : 'catalog';

 // Try to find catalog item ID by matching base_sku
 let catalogItemId: string | undefined;
 if (!isCustomItem) {
 // Query catalog items via tRPC to find matching SKU
 // Note: This would require adding a catalog item lookup by SKU to tRPC API
 // For now, we'll leave as undefined and handle in production order detail view
 catalogItemId = undefined;
 }

 const result = await createProductionOrderMutation.mutateAsync({
 order_id: crmOrderId, // CRITICAL: Links back to CRM order for grouping/shipping
 project_id: projectId,
 product_type: productType,
 catalog_item_id: catalogItemId,
 item_name: item.product_name,
 item_description: `${item.project_sku} - ${item.custom_specifications || ''}`,
 quantity: item.quantity,
 unit_price: item.unit_price,
 estimated_ship_date: undefined,
 factory_id: undefined,
 factory_notes: undefined,
 });

 createdProductionOrders.push(result.order);
 totalCost += item.total_price;
 }

 // STEP 3: Create ONE deposit invoice for the entire CRM order (50%)
 const invoiceResult = await createInvoiceForOrderMutation.mutateAsync({
 order_id: crmOrderId,
 invoice_type: 'deposit',
 });

 toast({
 title: "Success",
 description: `Order ${crmOrderNumber} created with ${createdProductionOrders.length} item${createdProductionOrders.length > 1 ? 's' : ''} totaling $${totalCost.toFixed(2)}. Deposit invoice ${invoiceResult.invoice.invoice_number} generated for $${Number(invoiceResult.invoice.total).toFixed(2)}.`,
 variant: "default",
 });

 // Clear order items and close dialog
 setOrderItems([]);
 setIsOrderDialogOpen(false);

 // Invalidate queries for instant updates
 utils.projects.getAll.invalidate();
 utils.orders.getWithProductionDetails.invalidate();

 } catch (error: any) {
 console.error('Error creating order:', error);
 toast({
 title: "Error",
 description: error.message || "Failed to create order. Please try again.",
 variant: "destructive",
 });
 }
 };


 const handleSaveOrder = async (data: OrderCreationFormData) => {
 try {
 // Find the project to get customer_id
 const project = projects.find((p: any) => p.id === data.project_id);
 if (!project) {
 toast({
 title: "Error",
 description: "Project not found.",
 variant: "destructive",
 });
 return;
 }

 // Get collection info for SKU generation
 const selectedCollection = collections?.find((c: any) => c.id === data.collection_id);
 const collectionPrefix = (selectedCollection as any)?.prefix || 'XX';

 // Get material names from IDs for SKU generation
 const getMaterialName = (materialId: string) => {
 if (!materialId) return '';
 const material = allMaterialsForSKU?.find((m: any) => m.id === materialId);
 return (material as any)?.name || '';
 };

 // Prepare material selections for SKU (using names)
 const materialSelections = {
 fabric_brand: getMaterialName(data.fabric_brand_id),
 fabric_collection: getMaterialName(data.fabric_collection_id),
 fabric_color: getMaterialName(data.fabric_color_id),
 wood_type: getMaterialName(data.wood_type_id),
 wood_finish: getMaterialName(data.wood_finish_id),
 metal_type: getMaterialName(data.metal_type_id),
 metal_finish: getMaterialName(data.metal_finish_id),
 metal_color: getMaterialName(data.metal_color_id),
 stone_type: getMaterialName(data.stone_type_id),
 stone_finish: getMaterialName(data.stone_finish_id),
 weaving_material: getMaterialName(data.weaving_material_id),
 weaving_pattern: getMaterialName(data.weaving_pattern_id),
 weaving_color: getMaterialName(data.weaving_color_id),
 carving_style: getMaterialName(data.carving_style_id),
 carving_pattern: getMaterialName(data.carving_pattern_id),
 };

 // Generate base SKU (using catalog system: PREFIX-ITEM-VERSION)
 const itemCode = data.product_name.substring(0, 3).toUpperCase();
 const version = String(orderItems.length + 1).padStart(3, '0');
 const baseSKU = `${collectionPrefix}-${itemCode}-${version}`;

 // Generate hierarchical product SKU using utility function
 const productSKU = generateProductSku(baseSKU, materialSelections);

 // Generate project tracking SKU (temporary - will be generated on server when order is saved)
 const projectSKU = `TEMP-${Date.now()}`;

 // Create new order item with dual SKUs
 const newOrderItem = {
 id: `temp_${Date.now()}`, // Temporary ID until saved to database
 product_name: data.product_name,
 product_sku: productSKU, // Hierarchical SKU for manufacturing
 project_sku: projectSKU, // Client/project tracking SKU
 base_sku: baseSKU, // Original catalog SKU
 quantity: parseInt(data.quantity),
 unit_price: parseFloat(data.unit_price),
 total_price: parseInt(data.quantity) * parseFloat(data.unit_price),
 material_selections: materialSelections,
 custom_specifications: data.custom_specifications,
 };

 // Add to order items list
 setOrderItems(prev => [...prev, newOrderItem]);

 toast({
 title: "Success",
 description: `Order item "${data.product_name}" added successfully! Product SKU: ${productSKU}`,
 variant: "default",
 });

 // Note: Dialog is closed by the dialog component itself

 toast({
 title: "Order Created",
 description: `${data.product_name} has been added to the project.`,
 });

 setIsOrderDialogOpen(false);
 // Invalidate queries for instant updates
 utils.projects.getAll.invalidate();
 utils.orders.getWithProductionDetails.invalidate();
 } catch (error) {
 toast({
 title: "Error",
 description: "Failed to create order. Please try again.",
 variant: "destructive",
 });
 }
 };

 const formatPrice = (price: number) => {
 return new Intl.NumberFormat("en-US", {
 style: "currency",
 currency: "USD",
 }).format(price);
 };

 const formatDate = (date?: Date | null) => {
 if (!date) return "N/A";
 return new Intl.DateTimeFormat("en-US", {
 month: "short",
 day: "numeric",
 year: "numeric",
 }).format(date);
 };

 const clearFilters = () => {
 setSearchTerm("");
 setSelectedStatus("");
 setSelectedPriority("");
 };

 const getTotalBudget = () => {
 return filteredProjects.reduce((sum, project) => sum + (project.budget || 0), 0);
 };

 const getTotalActualCost = () => {
 return filteredProjects.reduce((sum, project) => sum + (project.actual_cost || 0), 0);
 };

 const stats: StatItem[] = [
    {
      title: "Total Projects",
      value: filteredProjects.length,
      icon: ClipboardList,
    },
    {
      title: "Total Budget",
      value: formatPrice(getTotalBudget()),
      icon: DollarSign,
    },
    {
      title: "Actual Cost",
      value: formatPrice(getTotalActualCost()),
      icon: Package,
    },
    {
      title: "Active Projects",
      value: filteredProjects.filter((p: any) => p.status === 'active').length,
      icon: Clock,
    },
  ];

 return (
 <div className="page-container">
 <PageHeader
 title="Projects"
 description="Manage client projects with integrated order creation and tracking"
 actions={[
 {
 label: "Create Project",
 icon: Plus,
 onClick: handleCreateProject,
 },
 ]}
 />

 <StatsGrid stats={stats} />

 {/* Filters */}
 <Card>
 <CardContent className="card-content-compact">
 <div className="filters-section">
 <div className="search-input-wrapper">
 <Search className="search-icon" aria-hidden="true" />
 <Input
 placeholder="Search projects..."
 value={searchTerm}
 onChange={(e) => setSearchTerm(e.target.value)}
 className="search-input"
 />
 </div>

 <Select value={selectedStatus} onValueChange={setSelectedStatus}>
 <SelectTrigger className="filter-select">
 <SelectValue placeholder="Status" />
 </SelectTrigger>
 <SelectContent>
 <SelectItem value="all">All statuses</SelectItem>
 {statuses.map((status) => (
 <SelectItem key={status.value} value={status.value}>
 {status.label}
 </SelectItem>
 ))}
 </SelectContent>
 </Select>

 <Select value={selectedPriority} onValueChange={setSelectedPriority}>
 <SelectTrigger className="filter-select">
 <SelectValue placeholder="Priority" />
 </SelectTrigger>
 <SelectContent>
 <SelectItem value="all">All priorities</SelectItem>
 {priorities.map((priority) => (
 <SelectItem key={priority.value} value={priority.value}>
 {priority.label}
 </SelectItem>
 ))}
 </SelectContent>
 </Select>

 {(selectedStatus || selectedPriority || searchTerm) && (
 <Button variant="outline" size="sm" onClick={clearFilters} className="filter-select">
 <Filter className="icon-sm" aria-hidden="true" />
 Clear Filters
 </Button>
 )}
 </div>
 </CardContent>
 </Card>

 <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">

 <div className="text-sm text-muted-foreground">
 {filteredProjects.length} projects • {formatPrice(getTotalBudget())} budget
 </div>
 </div>

 {/* Projects Table */}
 <div className="mt-6 rounded-md border">
 <Table>
 <TableHeader>
 <TableRow>
 <TableHead>Project</TableHead>
 <TableHead>Company</TableHead>
 <TableHead>Status</TableHead>
 <TableHead>Priority</TableHead>
 <TableHead>Progress</TableHead>
 <TableHead>Budget</TableHead>
 <TableHead>Timeline</TableHead>
 <TableHead className="text-right">Actions</TableHead>
 </TableRow>
 </TableHeader>
 <TableBody>
 {filteredProjects.map((project) => {
 const statusInfo = getStatusInfo(project.status);
 const StatusIcon = statusInfo.icon;

 return (
 <TableRow
 key={project.id}
 className="cursor-pointer hover:bg-muted/50"
 onClick={() => router.push(`/crm/projects/${project.id}`)}
 >
 <TableCell>
 <div className="space-y-1">
 <div className="font-medium">{project.name}</div>
 {project.description && (
 <div className="text-sm text-muted-foreground line-clamp-1">
 {project.description}
 </div>
 )}
 </div>
 </TableCell>
 <TableCell>
 <div className="space-y-1">
						<div className="font-medium text-sm">{project.client_company || project.client_name || '—'}</div>
 </div>
 </TableCell>
 <TableCell>
 <Badge className={statusInfo.color}>
 <StatusIcon className="mr-1 h-3 w-3" />
 {statusInfo.label}
 </Badge>
 </TableCell>
 <TableCell>
 <Badge className={getPriorityColor(project.priority)}>
 {priorities.find(p => p.value === project.priority)?.label}
 </Badge>
 </TableCell>
 <TableCell>
 <div className="flex items-center gap-2">
 <div className="w-16 bg-muted rounded-full h-2 overflow-hidden">
 <div
 className="bg-primary h-2 rounded-full transition-all"
 style={{ width: `${project.completion_percentage}%` }}
 />
 </div>
 <span className="text-sm font-medium min-w-[3ch]">{project.completion_percentage}%</span>
 </div>
 </TableCell>
 <TableCell>
 <div className="space-y-1">
 <div className="font-medium text-sm">{formatPrice(project.budget || 0)}</div>
 <div className="text-xs text-muted-foreground">
 Spent: {formatPrice(project.actual_cost || 0)}
 </div>
 </div>
 </TableCell>
 <TableCell>
 <div className="space-y-1">
 <div className="text-sm">{formatDate(project.start_date)}</div>
 <div className="text-xs text-muted-foreground">
 End: {formatDate(project.end_date)}
 </div>
 </div>
 </TableCell>
 <TableCell className="text-right">
 <DropdownMenu>
 <DropdownMenuTrigger asChild onClick={(e) => e.stopPropagation()}>
 <Button variant="ghost" size="sm">
 <MoreVertical className="h-4 w-4" />
 </Button>
 </DropdownMenuTrigger>
 <DropdownMenuContent align="end">
 <DropdownMenuItem onClick={(e) => { e.stopPropagation(); handleCreateOrder(project.id); }}>
 <Plus className="mr-2 h-4 w-4" />
 Create Order
 </DropdownMenuItem>
 <DropdownMenuItem onClick={(e) => { e.stopPropagation(); handleEditProject(project); }}>
 <Edit className="mr-2 h-4 w-4" />
 Edit
 </DropdownMenuItem>
 <DropdownMenuItem onClick={(e) => { e.stopPropagation(); router.push(`/crm/projects/${project.id}`); }}>
 <Eye className="mr-2 h-4 w-4" />
 View Details
 </DropdownMenuItem>
 <DropdownMenuSeparator />
 <DropdownMenuItem className="text-destructive" onClick={(e) => e.stopPropagation()}>
 <Trash2 className="mr-2 h-4 w-4" />
 Delete
 </DropdownMenuItem>
 </DropdownMenuContent>
 </DropdownMenu>
 </TableCell>
 </TableRow>

 );
 })}
 </TableBody>
 </Table>
 </div>

 {/* Empty State */}
 {filteredProjects.length === 0 && (
 <div className="mt-12 text-center">
 <ClipboardList className="mx-auto h-12 w-12 text-muted-foreground" />
 <h3 className="mt-4 text-lg font-medium">No projects found</h3>
 <p className="mt-2 text-muted-foreground">
 {searchTerm || selectedStatus || selectedPriority
 ? "Try adjusting your search criteria."
 : "Get started by creating your first project."}
 </p>
 {!(searchTerm || selectedStatus || selectedPriority) && (
 <Button className="mt-4" onClick={handleCreateProject}>
 <Plus className="mr-2 h-4 w-4" />
 Create Project
 </Button>
 )}
 </div>
 )}

 {/* Project Dialog */}
 <ProjectDialog
 project={selectedProject}
 isOpen={isProjectDialogOpen}
 onClose={() => setIsProjectDialogOpen(false)}
 onSave={handleSaveProject}
 />

 {/* Order Creation Dialog */}
 <OrderCreationDialog
 projectId={orderCreationProjectId}
 isOpen={isOrderDialogOpen}
 onClose={() => setIsOrderDialogOpen(false)}
 _onSave={handleSaveOrder}
 orderItems={orderItems}
 setOrderItems={setOrderItems}
 onFinalizeOrder={handleFinalizeOrder}
 />
 </div>
 );
}
