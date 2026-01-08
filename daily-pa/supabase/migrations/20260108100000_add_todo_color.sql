-- Add color field to todos table for sticky notes feature
ALTER TABLE public.todos 
ADD COLUMN IF NOT EXISTS color VARCHAR(20) DEFAULT 'yellow' 
CHECK (color IN ('yellow', 'blue', 'green', 'pink', 'purple', 'orange'));

-- Add comment
COMMENT ON COLUMN public.todos.color IS 'Sticky note color for visual organization';
