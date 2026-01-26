-- Migration to add is_deleted column to tables for sync
-- Run this in your Supabase SQL Editor

ALTER TABLE public.todos ADD COLUMN IF NOT EXISTS is_deleted BOOLEAN DEFAULT FALSE;
ALTER TABLE public.expenses ADD COLUMN IF NOT EXISTS is_deleted BOOLEAN DEFAULT FALSE;
ALTER TABLE public.calendar_events ADD COLUMN IF NOT EXISTS is_deleted BOOLEAN DEFAULT FALSE;

-- Update the existing records to have is_deleted = false
UPDATE public.todos SET is_deleted = FALSE WHERE is_deleted IS NULL;
UPDATE public.expenses SET is_deleted = FALSE WHERE is_deleted IS NULL;
UPDATE public.calendar_events SET is_deleted = FALSE WHERE is_deleted IS NULL;
