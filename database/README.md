# Database Setup Guide

This folder contains the complete database schema for SportSwap marketplace.

## Quick Start

1. **Create a Supabase project** at [supabase.com](https://supabase.com)

2. **Run the schema**
   - Go to your Supabase Dashboard
   - Navigate to SQL Editor
   - Copy the contents of `00_schema.sql`
   - Paste and execute in the SQL Editor

3. **Create Storage Buckets**
   - Go to Storage in Supabase Dashboard
   - Create two public buckets:
     - `profile-pictures`
     - `listing-images`
   - Set policies to allow:
     - Public read access
     - Authenticated users can upload

## Database Tables

### Core Tables
- **profiles** - User profile information (extends auth.users)
- **listings** - Product listings with details
- **listing_images** - Multiple images per listing

### Messaging System
- **conversations** - Chat threads between buyers/sellers
- **messages** - Individual messages in conversations

### Transaction System
- **offers** - Price negotiation offers
- **transactions** - Completed sales records
- **reviews** - User ratings and feedback

### Features
- **favorites** - User's saved listings

## Row Level Security (RLS)

All tables have RLS policies configured to ensure:
- Users can only modify their own data
- Public data is viewable by everyone
- Private conversations are only accessible to participants
- Secure authentication checks on all operations

## Indexes

Performance indexes are created on:
- Foreign keys
- Frequently queried columns (status, category, etc.)
- Timestamp columns for sorting

## Triggers

Automatic `updated_at` timestamp triggers are configured for:
- profiles
- listings
- offers
