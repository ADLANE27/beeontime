-- Insert missing employee record for authenticated user
INSERT INTO employees (
  id, 
  email, 
  first_name, 
  last_name
) 
VALUES (
  '1b5ca1ab-4bf0-4fff-a15e-00ac039143a5',
  'a.debassi@aftraduction.fr',
  'Adlane',
  'Debassi'
)
ON CONFLICT (id) DO NOTHING;