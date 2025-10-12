# Flipbooks Routes

This directory contains all flipbook-related routes for the application.

## Structure

- `page.tsx` - Flipbooks list/library view
- `[id]/page.tsx` - Individual flipbook viewer
- `[id]/edit/page.tsx` - Flipbook editor
- `builder/page.tsx` - Visual template builder
- `ai/page.tsx` - AI-powered flipbook generation
- `analytics/page.tsx` - Flipbook analytics dashboard

## Feature Flag

All routes in this directory are behind the `NEXT_PUBLIC_ENABLE_FLIPBOOKS` feature flag.
If the flag is disabled, these routes will not be accessible.

## Isolation

These routes are developed on the `feature/flipbooks` branch and do not exist on `main`
until the feature is approved for integration.
