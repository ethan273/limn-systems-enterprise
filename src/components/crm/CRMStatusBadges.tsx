'use client';

import React from 'react';
import { Badge } from '@/components/ui/badge';
import { CheckCircle, Clock, AlertCircle, XCircle, TrendingUp, Building2, Users, Mail } from 'lucide-react';

// Contact Status Types
export type ContactStatus = 'active' | 'inactive' | 'pending' | 'archived';

// Lead Status Types
export type LeadStatus = 'new' | 'contacted' | 'qualified' | 'proposal' | 'negotiation' | 'closed_won' | 'closed_lost';

// Customer Status Types
export type CustomerStatus = 'active' | 'inactive' | 'pending' | 'suspended';

// Prospect Status Types
export type ProspectStatus = 'hot' | 'warm' | 'cold';

// Lead Source Types
export type LeadSource = 'website' | 'referral' | 'advertising' | 'social_media' | 'email' | 'phone' | 'trade_show' | 'other';

// Customer Type
export type CustomerType = 'individual' | 'business' | 'enterprise';

// Pipeline Stage Types
export type PipelineStage = 'initial' | 'contacted' | 'qualified' | 'proposal' | 'negotiation' | 'decision' | 'closed';

// Contact Source Types
export type ContactSource = 'website' | 'referral' | 'linkedin' | 'cold_call' | 'email' | 'trade_show' | 'advertising' | 'social_media' | 'other';

interface ContactStatusBadgeProps {
 status: ContactStatus;
 className?: string;
}

interface LeadStatusBadgeProps {
 status: LeadStatus;
 className?: string;
}

interface CustomerStatusBadgeProps {
 status: CustomerStatus;
 className?: string;
}

interface ProspectStatusBadgeProps {
 status: ProspectStatus;
 className?: string;
}

interface LeadSourceBadgeProps {
 source: LeadSource;
 className?: string;
}

interface CustomerTypeBadgeProps {
 type: CustomerType;
 className?: string;
}

interface PipelineStageBadgeProps {
 stage: PipelineStage;
 className?: string;
}

interface ContactSourceBadgeProps {
 source: ContactSource;
 className?: string;
}

// Contact Status Badge
export function ContactStatusBadge({ status, className = '' }: ContactStatusBadgeProps) {
 const getStatusConfig = (status: ContactStatus) => {
 switch (status) {
 case 'active':
 return {
 label: 'Active',
 className: 'bg-green-500/10 text-green-400 border-green-500/20',
 icon: CheckCircle,
 };
 case 'inactive':
 return {
 label: 'Inactive',
 className: 'card text-tertiary border/20',
 icon: Clock,
 };
 case 'pending':
 return {
 label: 'Pending',
 className: 'bg-yellow-500/10 text-yellow-400 border-yellow-500/20',
 icon: AlertCircle,
 };
 case 'archived':
 return {
 label: 'Archived',
 className: 'bg-red-500/10 text-red-400 border-red-500/20',
 icon: XCircle,
 };
 default:
 return {
 label: 'Unknown',
 className: 'card text-tertiary border/20',
 icon: AlertCircle,
 };
 }
 };

 const config = getStatusConfig(status);
 const Icon = config.icon;

 return (
 <Badge className={`${config.className} ${className} flex items-center gap-1`}>
 <Icon className="w-3 h-3" />
 {config.label}
 </Badge>
 );
}

// Lead Status Badge
export function LeadStatusBadge({ status, className = '' }: LeadStatusBadgeProps) {
 const getStatusConfig = (status: LeadStatus) => {
 switch (status) {
 case 'new':
 return {
 label: 'New',
 className: 'bg-blue-500/10 text-blue-400 border-blue-500/20',
 icon: Mail,
 };
 case 'contacted':
 return {
 label: 'Contacted',
 className: 'bg-purple-500/10 text-purple-400 border-purple-500/20',
 icon: CheckCircle,
 };
 case 'qualified':
 return {
 label: 'Qualified',
 className: 'bg-indigo-500/10 text-indigo-400 border-indigo-500/20',
 icon: TrendingUp,
 };
 case 'proposal':
 return {
 label: 'Proposal',
 className: 'bg-yellow-500/10 text-yellow-400 border-yellow-500/20',
 icon: AlertCircle,
 };
 case 'negotiation':
 return {
 label: 'Negotiation',
 className: 'bg-orange-500/10 text-orange-400 border-orange-500/20',
 icon: Clock,
 };
 case 'closed_won':
 return {
 label: 'Won',
 className: 'bg-green-500/10 text-green-400 border-green-500/20',
 icon: CheckCircle,
 };
 case 'closed_lost':
 return {
 label: 'Lost',
 className: 'bg-red-500/10 text-red-400 border-red-500/20',
 icon: XCircle,
 };
 default:
 return {
 label: 'Unknown',
 className: 'card text-tertiary border/20',
 icon: AlertCircle,
 };
 }
 };

 const config = getStatusConfig(status);
 const Icon = config.icon;

 return (
 <Badge className={`${config.className} ${className} flex items-center gap-1`}>
 <Icon className="w-3 h-3" />
 {config.label}
 </Badge>
 );
}

// Customer Status Badge
export function CustomerStatusBadge({ status, className = '' }: CustomerStatusBadgeProps) {
 const getStatusConfig = (status: CustomerStatus) => {
 switch (status) {
 case 'active':
 return {
 label: 'Active',
 className: 'bg-green-500/10 text-green-400 border-green-500/20',
 icon: CheckCircle,
 };
 case 'inactive':
 return {
 label: 'Inactive',
 className: 'card text-tertiary border/20',
 icon: Clock,
 };
 case 'pending':
 return {
 label: 'Pending',
 className: 'bg-yellow-500/10 text-yellow-400 border-yellow-500/20',
 icon: AlertCircle,
 };
 case 'suspended':
 return {
 label: 'Suspended',
 className: 'bg-red-500/10 text-red-400 border-red-500/20',
 icon: XCircle,
 };
 default:
 return {
 label: 'Unknown',
 className: 'card text-tertiary border/20',
 icon: AlertCircle,
 };
 }
 };

 const config = getStatusConfig(status);
 const Icon = config.icon;

 return (
 <Badge className={`${config.className} ${className} flex items-center gap-1`}>
 <Icon className="w-3 h-3" />
 {config.label}
 </Badge>
 );
}

// Prospect Status Badge
export function ProspectStatusBadge({ status, className = '' }: ProspectStatusBadgeProps) {
 const getStatusConfig = (status: ProspectStatus) => {
 switch (status) {
 case 'hot':
 return {
 label: 'Hot',
 className: 'bg-red-500/10 text-red-400 border-red-500/20',
 icon: TrendingUp,
 };
 case 'warm':
 return {
 label: 'Warm',
 className: 'bg-yellow-500/10 text-yellow-400 border-yellow-500/20',
 icon: AlertCircle,
 };
 case 'cold':
 return {
 label: 'Cold',
 className: 'bg-blue-500/10 text-blue-400 border-blue-500/20',
 icon: Clock,
 };
 default:
 return {
 label: 'Unknown',
 className: 'card text-tertiary border/20',
 icon: AlertCircle,
 };
 }
 };

 const config = getStatusConfig(status);
 const Icon = config.icon;

 return (
 <Badge className={`${config.className} ${className} flex items-center gap-1`}>
 <Icon className="w-3 h-3" />
 {config.label}
 </Badge>
 );
}

// Lead Source Badge
export function LeadSourceBadge({ source, className = '' }: LeadSourceBadgeProps) {
 const getSourceConfig = (source: LeadSource) => {
 switch (source) {
 case 'website':
 return {
 label: 'Website',
 className: 'bg-blue-500/10 text-blue-400 border-blue-500/20',
 };
 case 'referral':
 return {
 label: 'Referral',
 className: 'bg-green-500/10 text-green-400 border-green-500/20',
 };
 case 'advertising':
 return {
 label: 'Advertising',
 className: 'bg-purple-500/10 text-purple-400 border-purple-500/20',
 };
 case 'social_media':
 return {
 label: 'Social Media',
 className: 'bg-pink-500/10 text-pink-400 border-pink-500/20',
 };
 case 'email':
 return {
 label: 'Email',
 className: 'bg-indigo-500/10 text-indigo-400 border-indigo-500/20',
 };
 case 'phone':
 return {
 label: 'Phone',
 className: 'bg-yellow-500/10 text-yellow-400 border-yellow-500/20',
 };
 case 'trade_show':
 return {
 label: 'Trade Show',
 className: 'bg-orange-500/10 text-orange-400 border-orange-500/20',
 };
 case 'other':
 return {
 label: 'Other',
 className: 'card text-tertiary border/20',
 };
 default:
 return {
 label: 'Unknown',
 className: 'card text-tertiary border/20',
 };
 }
 };

 const config = getSourceConfig(source);

 return (
 <Badge variant="outline" className={`${config.className} ${className}`}>
 {config.label}
 </Badge>
 );
}

// Customer Type Badge
export function CustomerTypeBadge({ type, className = '' }: CustomerTypeBadgeProps) {
 const getTypeConfig = (type: CustomerType) => {
 switch (type) {
 case 'individual':
 return {
 label: 'Individual',
 className: 'bg-blue-500/10 text-blue-400 border-blue-500/20',
 icon: Users,
 };
 case 'business':
 return {
 label: 'Business',
 className: 'bg-purple-500/10 text-purple-400 border-purple-500/20',
 icon: Building2,
 };
 case 'enterprise':
 return {
 label: 'Enterprise',
 className: 'bg-orange-500/10 text-orange-400 border-orange-500/20',
 icon: Building2,
 };
 default:
 return {
 label: 'Unknown',
 className: 'card text-tertiary border/20',
 icon: AlertCircle,
 };
 }
 };

 const config = getTypeConfig(type);
 const Icon = config.icon;

 return (
 <Badge className={`${config.className} ${className} flex items-center gap-1`}>
 <Icon className="w-3 h-3" />
 {config.label}
 </Badge>
 );
}

// Pipeline Stage Badge
export function PipelineStageBadge({ stage, className = '' }: PipelineStageBadgeProps) {
 const getStageConfig = (stage: PipelineStage) => {
 switch (stage) {
 case 'initial':
 return {
 label: 'Initial',
 className: 'card text-tertiary border/20',
 icon: Clock,
 };
 case 'contacted':
 return {
 label: 'Contacted',
 className: 'bg-blue-500/10 text-blue-400 border-blue-500/20',
 icon: Mail,
 };
 case 'qualified':
 return {
 label: 'Qualified',
 className: 'bg-green-500/10 text-green-400 border-green-500/20',
 icon: CheckCircle,
 };
 case 'proposal':
 return {
 label: 'Proposal',
 className: 'bg-yellow-500/10 text-yellow-400 border-yellow-500/20',
 icon: AlertCircle,
 };
 case 'negotiation':
 return {
 label: 'Negotiation',
 className: 'bg-orange-500/10 text-orange-400 border-orange-500/20',
 icon: TrendingUp,
 };
 case 'decision':
 return {
 label: 'Decision',
 className: 'bg-purple-500/10 text-purple-400 border-purple-500/20',
 icon: AlertCircle,
 };
 case 'closed':
 return {
 label: 'Closed',
 className: 'bg-green-600/10 text-green-500 border-green-600/20',
 icon: CheckCircle,
 };
 default:
 return {
 label: 'Unknown',
 className: 'card text-tertiary border/20',
 icon: AlertCircle,
 };
 }
 };

 const config = getStageConfig(stage);
 const Icon = config.icon;

 return (
 <Badge className={`${config.className} ${className} flex items-center gap-1`}>
 <Icon className="w-3 h-3" />
 {config.label}
 </Badge>
 );
}

// Contact Source Badge
export function ContactSourceBadge({ source, className = '' }: ContactSourceBadgeProps) {
 const getSourceConfig = (source: ContactSource) => {
 switch (source) {
 case 'website':
 return {
 label: 'Website',
 className: 'bg-blue-500/10 text-blue-400 border-blue-500/20',
 icon: Building2,
 };
 case 'referral':
 return {
 label: 'Referral',
 className: 'bg-green-500/10 text-green-400 border-green-500/20',
 icon: Users,
 };
 case 'linkedin':
 return {
 label: 'LinkedIn',
 className: 'bg-blue-600/10 text-blue-500 border-blue-600/20',
 icon: Users,
 };
 case 'cold_call':
 return {
 label: 'Cold Call',
 className: 'bg-purple-500/10 text-purple-400 border-purple-500/20',
 icon: Mail,
 };
 case 'email':
 return {
 label: 'Email',
 className: 'bg-orange-500/10 text-orange-400 border-orange-500/20',
 icon: Mail,
 };
 case 'trade_show':
 return {
 label: 'Trade Show',
 className: 'bg-indigo-500/10 text-indigo-400 border-indigo-500/20',
 icon: Building2,
 };
 case 'advertising':
 return {
 label: 'Advertising',
 className: 'bg-red-500/10 text-red-400 border-red-500/20',
 icon: TrendingUp,
 };
 case 'social_media':
 return {
 label: 'Social Media',
 className: 'bg-pink-500/10 text-pink-400 border-pink-500/20',
 icon: TrendingUp,
 };
 case 'other':
 return {
 label: 'Other',
 className: 'card text-tertiary border/20',
 icon: AlertCircle,
 };
 default:
 return {
 label: 'Unknown',
 className: 'card text-tertiary border/20',
 icon: AlertCircle,
 };
 }
 };

 const config = getSourceConfig(source);
 const Icon = config.icon;

 return (
 <Badge className={`${config.className} ${className} flex items-center gap-1`}>
 <Icon className="w-3 h-3" />
 {config.label}
 </Badge>
 );
}

// Utility function to get all status options for forms
export const getContactStatusOptions = (): Array<{ value: ContactStatus; label: string }> => [
 { value: 'active', label: 'Active' },
 { value: 'inactive', label: 'Inactive' },
 { value: 'pending', label: 'Pending' },
 { value: 'archived', label: 'Archived' },
];

export const getLeadStatusOptions = (): Array<{ value: LeadStatus; label: string }> => [
 { value: 'new', label: 'New' },
 { value: 'contacted', label: 'Contacted' },
 { value: 'qualified', label: 'Qualified' },
 { value: 'proposal', label: 'Proposal' },
 { value: 'negotiation', label: 'Negotiation' },
 { value: 'closed_won', label: 'Closed Won' },
 { value: 'closed_lost', label: 'Closed Lost' },
];

export const getCustomerStatusOptions = (): Array<{ value: CustomerStatus; label: string }> => [
 { value: 'active', label: 'Active' },
 { value: 'inactive', label: 'Inactive' },
 { value: 'pending', label: 'Pending' },
 { value: 'suspended', label: 'Suspended' },
];

export const getProspectStatusOptions = (): Array<{ value: ProspectStatus; label: string }> => [
 { value: 'hot', label: 'Hot' },
 { value: 'warm', label: 'Warm' },
 { value: 'cold', label: 'Cold' },
];

export const getLeadSourceOptions = (): Array<{ value: LeadSource; label: string }> => [
 { value: 'website', label: 'Website' },
 { value: 'referral', label: 'Referral' },
 { value: 'advertising', label: 'Advertising' },
 { value: 'social_media', label: 'Social Media' },
 { value: 'email', label: 'Email' },
 { value: 'phone', label: 'Phone' },
 { value: 'trade_show', label: 'Trade Show' },
 { value: 'other', label: 'Other' },
];

export const getCustomerTypeOptions = (): Array<{ value: CustomerType; label: string }> => [
 { value: 'individual', label: 'Individual' },
 { value: 'business', label: 'Business' },
 { value: 'enterprise', label: 'Enterprise' },
];

export const getPipelineStageOptions = (): Array<{ value: PipelineStage; label: string }> => [
 { value: 'initial', label: 'Initial' },
 { value: 'contacted', label: 'Contacted' },
 { value: 'qualified', label: 'Qualified' },
 { value: 'proposal', label: 'Proposal' },
 { value: 'negotiation', label: 'Negotiation' },
 { value: 'decision', label: 'Decision' },
 { value: 'closed', label: 'Closed' },
];

export const getContactSourceOptions = (): Array<{ value: ContactSource; label: string }> => [
 { value: 'website', label: 'Website' },
 { value: 'referral', label: 'Referral' },
 { value: 'linkedin', label: 'LinkedIn' },
 { value: 'cold_call', label: 'Cold Call' },
 { value: 'email', label: 'Email' },
 { value: 'trade_show', label: 'Trade Show' },
 { value: 'advertising', label: 'Advertising' },
 { value: 'social_media', label: 'Social Media' },
 { value: 'other', label: 'Other' },
];