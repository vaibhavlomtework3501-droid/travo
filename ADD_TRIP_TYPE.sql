-- Add trip_type column to trips table
ALTER TABLE public.trips ADD COLUMN trip_type TEXT NOT NULL DEFAULT 'pickup' CHECK (trip_type IN ('pickup', 'drop'));