# Flipbook Components

React components specific to the flipbook feature.

## Core Components

- `FlipbookViewer.tsx` - WebGL/Three.js 3D flipbook viewer
- `PageRenderer.tsx` - Individual page content rendering
- `HotspotEditor.tsx` - Interactive hotspot creation and editing
- `TemplateBuilder.tsx` - Visual template editor (Figma-like interface)
- `AIGenerator.tsx` - AI-powered flipbook generation UI
- `AnalyticsDashboard.tsx` - Flipbook metrics and analytics

## Usage

All components are behind the `features.flipbooks` flag and should only be imported
in flipbook-specific code.

```typescript
import { features } from '@/lib/features';
import { FlipbookViewer } from '@/components/flipbooks/FlipbookViewer';

if (features.flipbooks) {
  // Use component
}
```
