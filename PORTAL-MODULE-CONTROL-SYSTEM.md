# Portal Module Control System - Implementation Plan

**Created**: October 8, 2025
**Status**: Ready to implement
**Purpose**: Scalable admin control for all portal module visibility across all portal types

---

## Current State Analysis

### ✅ What Already Works

1. **Database**: `portal_settings` table exists with module toggles
2. **API**: `getPortalSettings` procedure exists in `/src/server/api/routers/portal.ts:220`
3. **UI**: All portal layouts fetch and respect settings:
   - Customer portal: `/portal/layout.tsx:44` (checks settings)
   - Designer portal: `/portal/designer/layout.tsx` (hardcoded navigation)
   - Factory portal: `/portal/factory/layout.tsx` (hardcoded navigation)
4. **Admin Pages**:
   - `/admin/portals` - Portal user management (exists, has "Configure" buttons but not connected)
   - `/admin/settings` - General system settings (exists, for system config not portal modules)

### ❌ What's Missing

1. **Universal Portal Settings Table** - Current `portal_settings` only for customers
2. **Admin API Procedures** - No procedures to get/update portal module settings
3. **Admin Configuration UI** - "Configure" buttons in `/admin/portals` not functional
4. **Settings Integration** - Designer/Factory/QC layouts don't check settings

---

## Portal Modules Inventory

### Customer Portal (`/portal`)
- Dashboard (always visible)
- Orders (controlled by `show_production_tracking`)
- Shipping (controlled by `show_shipping_info`)
- Financials (controlled by `show_financial_details`)
- Documents (always visible)
- Profile (always visible)

### Designer Portal (`/portal/designer`)
- Dashboard (always visible)
- Projects
- Documents
- Quality
- Settings (always visible)

### Factory Portal (`/portal/factory`)
- Dashboard (always visible)
- Production Orders
- Shipping
- Documents
- Quality
- Settings (always visible)

### QC Portal (`/portal/qc`)
- Dashboard (always visible)
- Quality Checks
- Documents
- Reports
- Settings (always visible)

---

## Implementation Plan

### Phase 1: Universal Database Schema

**Option A: Extend `portal_settings` table**
```sql
ALTER TABLE portal_settings
  ADD COLUMN portal_type VARCHAR(50) DEFAULT 'customer',
  ADD COLUMN entity_id UUID, -- customer_id, partner_id, or user_id
  ADD COLUMN enabled_modules JSONB DEFAULT '{}',
  DROP CONSTRAINT portal_settings_customer_id_key,
  ADD UNIQUE (portal_type, entity_id);
```

**Option B: Create new `portal_module_settings` table** (RECOMMENDED - cleaner)
```sql
CREATE TABLE portal_module_settings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  portal_type VARCHAR(50) NOT NULL, -- 'customer', 'designer', 'factory', 'qc'
  entity_id UUID, -- Links to customers, partners, or NULL for defaults
  module_key VARCHAR(100) NOT NULL, -- 'orders', 'shipping', 'financials', etc.
  is_enabled BOOLEAN DEFAULT true,
  permissions JSONB DEFAULT '{}', -- Optional: per-module permissions
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(portal_type, entity_id, module_key)
);

CREATE INDEX idx_portal_module_settings_lookup
  ON portal_module_settings(portal_type, entity_id);
```

### Phase 2: Admin API Procedures

Add to `/src/server/api/routers/admin.ts`:

```typescript
portalModules: createTRPCRouter({
  // Get module settings for a portal type + entity
  getSettings: protectedProcedure
    .input(z.object({
      portalType: z.enum(['customer', 'designer', 'factory', 'qc']),
      entityId: z.string().uuid().optional(), // NULL = defaults
    }))
    .query(async ({ input }) => {
      const settings = await prisma.portal_module_settings.findMany({
        where: {
          portal_type: input.portalType,
          entity_id: input.entityId || null,
        },
      });

      return settings.map(s => ({
        moduleKey: s.module_key,
        isEnabled: s.is_enabled,
        permissions: s.permissions,
      }));
    }),

  // Update module settings
  updateSettings: protectedProcedure
    .input(z.object({
      portalType: z.enum(['customer', 'designer', 'factory', 'qc']),
      entityId: z.string().uuid().optional(),
      modules: z.array(z.object({
        moduleKey: z.string(),
        isEnabled: z.boolean(),
        permissions: z.record(z.boolean()).optional(),
      })),
    }))
    .mutation(async ({ input }) => {
      // Upsert each module setting
      await Promise.all(
        input.modules.map(mod =>
          prisma.portal_module_settings.upsert({
            where: {
              portal_type_entity_id_module_key: {
                portal_type: input.portalType,
                entity_id: input.entityId || null,
                module_key: mod.moduleKey,
              },
            },
            create: {
              portal_type: input.portalType,
              entity_id: input.entityId || null,
              module_key: mod.moduleKey,
              is_enabled: mod.isEnabled,
              permissions: mod.permissions || {},
            },
            update: {
              is_enabled: mod.isEnabled,
              permissions: mod.permissions || {},
              updated_at: new Date(),
            },
          })
        )
      );

      return { success: true };
    }),

  // Get available modules for a portal type
  getAvailableModules: protectedProcedure
    .input(z.object({
      portalType: z.enum(['customer', 'designer', 'factory', 'qc']),
    }))
    .query(({ input }) => {
      const modulesByPortal = {
        customer: [
          { key: 'orders', label: 'Orders', alwaysVisible: false },
          { key: 'shipping', label: 'Shipping', alwaysVisible: false },
          { key: 'financials', label: 'Financials', alwaysVisible: false },
          { key: 'documents', label: 'Documents', alwaysVisible: true },
          { key: 'profile', label: 'Profile', alwaysVisible: true },
        ],
        designer: [
          { key: 'projects', label: 'Projects', alwaysVisible: false },
          { key: 'documents', label: 'Documents', alwaysVisible: false },
          { key: 'quality', label: 'Quality', alwaysVisible: false },
        ],
        factory: [
          { key: 'orders', label: 'Production Orders', alwaysVisible: false },
          { key: 'shipping', label: 'Shipping', alwaysVisible: false },
          { key: 'documents', label: 'Documents', alwaysVisible: false },
          { key: 'quality', label: 'Quality', alwaysVisible: false },
        ],
        qc: [
          { key: 'quality_checks', label: 'Quality Checks', alwaysVisible: false },
          { key: 'documents', label: 'Documents', alwaysVisible: false },
          { key: 'reports', label: 'Reports', alwaysVisible: false },
        ],
      };

      return modulesByPortal[input.portalType] || [];
    }),
}),
```

### Phase 3: Portal API Update

Update `getPortalSettings` in `/src/server/api/routers/portal.ts`:

```typescript
getPortalSettings: portalProcedure
  .query(async ({ ctx }) => {
    // Determine portal type from context
    const portalType = ctx.portalType; // 'customer', 'designer', 'factory', 'qc'
    const entityId = ctx.customerId || ctx.partnerId || ctx.entityId;

    // Fetch module settings
    const moduleSettings = await prisma.portal_module_settings.findMany({
      where: {
        portal_type: portalType,
        entity_id: entityId,
      },
    });

    // Convert to lookup object
    const settings: Record<string, boolean> = {};
    moduleSettings.forEach(s => {
      settings[s.module_key] = s.is_enabled;
    });

    // Backwards compatibility: map to old field names
    return {
      show_production_tracking: settings.orders ?? true,
      show_financial_details: settings.financials ?? true,
      show_shipping_info: settings.shipping ?? true,
      modules: settings, // New format for future use
    };
  }),
```

### Phase 4: Admin UI Component

Create `/src/components/admin/PortalModuleConfigDialog.tsx`:

```typescript
'use client';

import { useState } from 'react';
import { api } from '@/lib/api/client';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Select } from '@/components/ui/select';

interface Props {
  portalType: 'customer' | 'designer' | 'factory' | 'qc';
  isOpen: boolean;
  onClose: () => void;
}

export function PortalModuleConfigDialog({ portalType, isOpen, onClose }: Props) {
  const [selectedEntityId, setSelectedEntityId] = useState<string | null>(null);

  // Fetch available modules
  const { data: modules } = api.admin.portalModules.getAvailableModules.useQuery({
    portalType,
  });

  // Fetch current settings
  const { data: settings, refetch } = api.admin.portalModules.getSettings.useQuery({
    portalType,
    entityId: selectedEntityId || undefined,
  });

  // Update mutation
  const updateMutation = api.admin.portalModules.updateSettings.useMutation({
    onSuccess: () => {
      refetch();
      onClose();
    },
  });

  const [moduleStates, setModuleStates] = useState<Record<string, boolean>>({});

  // Initialize states when settings load
  useEffect(() => {
    if (settings) {
      const states: Record<string, boolean> = {};
      settings.forEach(s => {
        states[s.moduleKey] = s.isEnabled;
      });
      setModuleStates(states);
    }
  }, [settings]);

  const handleSave = () => {
    updateMutation.mutate({
      portalType,
      entityId: selectedEntityId || undefined,
      modules: Object.entries(moduleStates).map(([key, enabled]) => ({
        moduleKey: key,
        isEnabled: enabled,
      })),
    });
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>
            Configure {portalType.charAt(0).toUpperCase() + portalType.slice(1)} Portal Modules
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          {/* Entity Selector */}
          <div>
            <Label>Configure For</Label>
            <Select
              value={selectedEntityId || 'default'}
              onValueChange={(v) => setSelectedEntityId(v === 'default' ? null : v)}
            >
              <option value="default">Default Settings (All Users)</option>
              {/* TODO: Fetch and list entities based on portal type */}
            </Select>
          </div>

          {/* Module Toggles */}
          <div className="space-y-3">
            {modules?.map((mod) => (
              <div key={mod.key} className="flex items-center justify-between">
                <Label>{mod.label}</Label>
                {mod.alwaysVisible ? (
                  <span className="text-sm text-muted-foreground">Always Visible</span>
                ) : (
                  <Switch
                    checked={moduleStates[mod.key] ?? true}
                    onCheckedChange={(checked) =>
                      setModuleStates({ ...moduleStates, [mod.key]: checked })
                    }
                  />
                )}
              </div>
            ))}
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={onClose}>Cancel</Button>
          <Button onClick={handleSave} disabled={updateMutation.isPending}>
            Save Settings
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
```

### Phase 5: Connect to Admin Portals Page

Update `/src/app/admin/portals/page.tsx`:

```typescript
import { PortalModuleConfigDialog } from '@/components/admin/PortalModuleConfigDialog';

export default function PortalManagementPage() {
  const [configDialogOpen, setConfigDialogOpen] = useState(false);
  const [selectedPortalType, setSelectedPortalType] = useState<'customer' | 'designer' | 'factory' | 'qc'>('customer');

  // ... existing code ...

  return (
    <div>
      {/* ... existing portal cards ... */}

      <Button
        onClick={() => {
          setSelectedPortalType(type); // from map
          setConfigDialogOpen(true);
        }}
      >
        Configure
      </Button>

      <PortalModuleConfigDialog
        portalType={selectedPortalType}
        isOpen={configDialogOpen}
        onClose={() => setConfigDialogOpen(false)}
      />
    </div>
  );
}
```

### Phase 6: Update Portal Layouts

Update each portal layout to check settings:

**Designer Portal** (`/portal/designer/layout.tsx`):
```typescript
const { data: portalSettings } = api.portal.getPortalSettings.useQuery();

const navigation = [
  { name: 'Dashboard', href: '/portal/designer', icon: LayoutDashboard, show: true },
  { name: 'Projects', href: '/portal/designer/projects', icon: Palette, show: portalSettings?.modules?.projects !== false },
  { name: 'Documents', href: '/portal/designer/documents', icon: FileText, show: portalSettings?.modules?.documents !== false },
  { name: 'Quality', href: '/portal/designer/quality', icon: CheckCircle, show: portalSettings?.modules?.quality !== false },
  { name: 'Settings', href: '/portal/designer/settings', icon: Settings, show: true },
].filter(item => item.show);
```

Apply same pattern to Factory and QC portals.

---

## Migration Steps

1. ✅ Document current state (this file)
2. Run database migration to create `portal_module_settings` table
3. Add admin API procedures to `/src/server/api/routers/admin.ts`
4. Update portal API `getPortalSettings` procedure
5. Create `PortalModuleConfigDialog` component
6. Connect dialog to `/admin/portals` page
7. Update Designer/Factory/QC portal layouts to check settings
8. Test with various module combinations
9. Seed default settings for existing portals

---

## Benefits

- ✅ **Scalable**: Works for all current and future portal types
- ✅ **Flexible**: Per-entity or default settings
- ✅ **Clean**: Single source of truth for module visibility
- ✅ **Maintainable**: Easy to add new modules or portal types
- ✅ **Backwards Compatible**: Existing customer portal continues working

---

## Next Steps

**READY TO BUILD** - All design decisions documented. Proceed with implementation?
