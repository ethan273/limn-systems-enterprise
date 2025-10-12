# Flipbook Library

Core utilities and business logic for the flipbook feature.

## Modules

- `pdf-converter.ts` - PDF to image conversion (pdf.js + sharp)
- `s3-uploader.ts` - AWS S3 asset upload and management
- `flipbook-engine.ts` - Core rendering logic and page turning physics
- `ai-generator.ts` - OpenAI integration for AI-powered generation
- `analytics.ts` - Event tracking and metrics collection
- `template-manager.ts` - Template system management
- `hotspot-manager.ts` - Hotspot creation and interaction logic

## Design Principles

- Type-safe: Full TypeScript with strict mode
- Isolated: No dependencies on production code
- Testable: Pure functions where possible
- Performance: Optimized for large catalogs (500+ pages)
