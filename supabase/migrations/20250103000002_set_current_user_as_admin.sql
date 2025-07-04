INSERT INTO user_roles (user_id, role)
SELECT id, 'admin'
FROM auth.users
WHERE email IS NOT NULL
LIMIT 1
ON CONFLICT (user_id) DO UPDATE SET role = 'admin';
