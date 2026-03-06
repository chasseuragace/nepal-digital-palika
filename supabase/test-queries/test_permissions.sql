-- Check what permissions palika_admin has
SELECT rp.role_id, r.name as role_name, p.name as permission_name
FROM public.role_permissions rp
JOIN public.roles r ON rp.role_id = r.id
JOIN public.permissions p ON rp.permission_id = p.id
WHERE r.name = 'palika_admin'
ORDER BY p.name;
