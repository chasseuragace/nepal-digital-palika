# Palika Gallery Implementation Guide (Standardized)

## Overview

The Palika Gallery system provides a centralized asset library for each Palika. Instead of tying images to specific entities (like blog posts or events), assets are scoped primarily to a `palika_id`. This allows admins to manage a reusable library of images and documents that can be referenced throughout the platform.

## Architecture

### 1. Database Schema (`assets` table)

The system uses the core `assets` table for all gallery items:

- `palika_id`: Scopes the asset to a specific Palika.
- `file_type`: 'image' or 'document'.
- `is_featured`: Indicates the primary image for the Palika profile.
- `sort_order`: Controls display priority.
- `public_url`: Direct URL to the asset in Supabase storage.

### 2. API Endpoints

- **GET `/api/gallery`**: Fetches assets. Supports filtering by `palika_id` or `generic_gallery=true`.
- **POST `/api/gallery/upload`**: Handles file uploads. Automatically scopes to the admin's `palika_id`.
- **PUT `/api/gallery`**: Updates asset metadata (e.g., setting an image as "Featured").
- **DELETE `/api/gallery`**: Removes the asset from both the database and storage.

### 3. Unified UI Component

The `AssetGallery` component is the single point of entry for managing assets:

- **Upload Mode**: Allows admins to add new items.
- **Select Mode**: Used in profile editors to pick an existing image from the library.
- **Featured Logic**: Automatically manages unsetting previous featured images when a new one is selected.

## Key Workflows

### Profile Synchronization

When a Palika Profile is saved via `PUT /api/palika-profile`, the system automatically synchronizes the `gallery_images` array in the profile JSONB by pulling the latest set of images from the `assets` table.

## Maintenance

The old `palika_gallery` table and related `/api/palika-gallery` routes have been removed in favor of this standardized approach. All new asset-related features should be implemented in the core `gallery` API and `AssetGallery` component.
