'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/hooks/useAuth';
import { api } from '@/lib/api/client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { ArrowLeft, Settings, Building2, Mail, Phone, MapPin, Globe, Star } from 'lucide-react';

/**
 * Factory Portal Settings Page
 * View factory profile and settings
 */
export default function FactorySettingsPage() {
 const router = useRouter();
 const { user: currentUser, loading: userLoading } = useAuth();

 // Get partner profile
 const { data: partner } = api.partners.getByPortalUser.useQuery(
 undefined,
 { enabled: !!currentUser }
 );

 useEffect(() => {
 if (!userLoading && !currentUser) {
 router.push('/login?redirect=/portal/factory/settings');
 }
 }, [currentUser, userLoading, router]);

 if (userLoading || !partner) {
 return (
 <div className="min-h-screen flex items-center justify-center card">
 <div className="text-center">
 <div className="text-muted-foreground">Loading settings...</div>
 </div>
 </div>
 );
 }

 return (
 <div className="min-h-screen card">
 {/* Header */}
 <div className="bg-card border-b">
 <div className="container mx-auto px-4 py-6">
 <div className="flex items-center justify-between">
 <div className="flex items-center gap-4">
 <Button
 variant="ghost"
 onClick={() => router.push('/portal/factory')}
 >
 <ArrowLeft className="h-4 w-4 mr-2" />
 Back to Dashboard
 </Button>
 <div>
 <h1 className="text-2xl font-bold">Factory Settings</h1>
 <p className="text-muted-foreground">{partner.company_name}</p>
 </div>
 </div>
 </div>
 </div>
 </div>

 <div className="container mx-auto px-4 py-8 space-y-6">
 {/* Company Information */}
 <Card>
 <CardHeader>
 <CardTitle className="flex items-center gap-2">
 <Building2 className="h-5 w-5" />
 Company Information
 </CardTitle>
 </CardHeader>
 <CardContent className="space-y-4">
 <div className="grid gap-4 md:grid-cols-2">
 <div>
 <label className="text-sm font-medium text-muted-foreground">Company Name</label>
 <p className="text-lg font-semibold">{partner.company_name}</p>
 </div>
 {partner.business_name && (
 <div>
 <label className="text-sm font-medium text-muted-foreground">Business Name</label>
 <p className="text-lg">{partner.business_name}</p>
 </div>
 )}
 </div>

 {partner.registration_number && (
 <div>
 <label className="text-sm font-medium text-muted-foreground">Registration Number</label>
 <p className="text-lg">{partner.registration_number}</p>
 </div>
 )}

 <div className="flex items-center gap-2">
 <label className="text-sm font-medium text-muted-foreground">Status:</label>
 <Badge variant={partner.status === 'active' ? 'default' : 'secondary'}>
 {partner.status}
 </Badge>
 </div>

 {partner.quality_rating && (
 <div className="flex items-center gap-2">
 <Star className="h-5 w-5 text-warning" />
 <span className="text-lg font-semibold">{partner.quality_rating} / 5.0</span>
 <span className="text-sm text-muted-foreground">Quality Rating</span>
 </div>
 )}
 </CardContent>
 </Card>

 {/* Contact Information */}
 <Card>
 <CardHeader>
 <CardTitle>Contact Information</CardTitle>
 </CardHeader>
 <CardContent className="space-y-4">
 <div className="grid gap-4 md:grid-cols-2">
 {partner.primary_contact && (
 <div>
 <label className="text-sm font-medium text-muted-foreground">Primary Contact</label>
 <p className="text-lg">{partner.primary_contact}</p>
 </div>
 )}
 {partner.primary_email && (
 <div className="flex items-center gap-2">
 <Mail className="h-4 w-4 text-muted-foreground" />
 <div>
 <label className="text-sm font-medium text-muted-foreground">Email</label>
 <p className="text-lg">{partner.primary_email}</p>
 </div>
 </div>
 )}
 </div>

 {partner.primary_phone && (
 <div className="flex items-center gap-2">
 <Phone className="h-4 w-4 text-muted-foreground" />
 <div>
 <label className="text-sm font-medium text-muted-foreground">Phone</label>
 <p className="text-lg">{partner.primary_phone}</p>
 </div>
 </div>
 )}

 {partner.website && (
 <div className="flex items-center gap-2">
 <Globe className="h-4 w-4 text-muted-foreground" />
 <div>
 <label className="text-sm font-medium text-muted-foreground">Website</label>
 <a
 href={partner.website}
 target="_blank"
 rel="noopener noreferrer"
 className="text-lg text-info hover:underline"
 >
 {partner.website}
 </a>
 </div>
 </div>
 )}
 </CardContent>
 </Card>

 {/* Location */}
 <Card>
 <CardHeader>
 <CardTitle className="flex items-center gap-2">
 <MapPin className="h-5 w-5" />
 Location
 </CardTitle>
 </CardHeader>
 <CardContent className="space-y-2">
 {partner.address_line1 && <p>{partner.address_line1}</p>}
 {partner.address_line2 && <p>{partner.address_line2}</p>}
 <p>
 {[partner.city, partner.state, partner.postal_code].filter(Boolean).join(', ')}
 </p>
 {partner.country && <p className="font-medium">{partner.country}</p>}
 </CardContent>
 </Card>

 {/* Capabilities */}
 {partner.specializations && partner.specializations.length > 0 && (
 <Card>
 <CardHeader>
 <CardTitle>Specializations</CardTitle>
 </CardHeader>
 <CardContent>
 <div className="flex flex-wrap gap-2">
 {partner.specializations.map((spec: string, index: number) => (
 <Badge key={index} variant="secondary">
 {spec}
 </Badge>
 ))}
 </div>
 </CardContent>
 </Card>
 )}

 {/* Settings Placeholder */}
 <Card>
 <CardHeader>
 <CardTitle className="flex items-center gap-2">
 <Settings className="h-5 w-5" />
 Account Settings
 </CardTitle>
 </CardHeader>
 <CardContent>
 <div className="text-center py-8">
 <Settings className="mx-auto h-12 w-12 text-muted-foreground opacity-50 mb-4" />
 <h3 className="text-lg font-semibold mb-2">Advanced Settings Coming Soon</h3>
 <p className="text-muted-foreground mb-4">
 Manage notifications, preferences, and account details.
 </p>
 <div className="space-y-2 text-sm text-muted-foreground">
 <p>✓ Notification preferences</p>
 <p>✓ Password management</p>
 <p>✓ Email subscriptions</p>
 <p>✓ Language and timezone</p>
 </div>
 </div>
 </CardContent>
 </Card>
 </div>
 </div>
 );
}
