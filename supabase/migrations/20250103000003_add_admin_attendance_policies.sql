-- Add admin policies for attendance records management
-- This allows admins to view, create, and update attendance records for all users

-- Policy for admins to view all attendance records
CREATE POLICY "Admins can view all attendance records" 
ON public.attendance_records 
FOR SELECT 
USING (
  EXISTS (
    SELECT 1 FROM user_roles 
    WHERE user_id = auth.uid() 
    AND role = 'admin'
  )
);

-- Policy for admins to create attendance records for any user
CREATE POLICY "Admins can create attendance records for any user" 
ON public.attendance_records 
FOR INSERT 
WITH CHECK (
  EXISTS (
    SELECT 1 FROM user_roles 
    WHERE user_id = auth.uid() 
    AND role = 'admin'
  )
);

-- Policy for admins to update any attendance record
CREATE POLICY "Admins can update any attendance record" 
ON public.attendance_records 
FOR UPDATE 
USING (
  EXISTS (
    SELECT 1 FROM user_roles 
    WHERE user_id = auth.uid() 
    AND role = 'admin'
  )
);

-- Policy for admins to view all profiles (needed for the dropdown)
CREATE POLICY "Admins can view all profiles" 
ON public.profiles 
FOR SELECT 
USING (
  EXISTS (
    SELECT 1 FROM user_roles 
    WHERE user_id = auth.uid() 
    AND role = 'admin'
  )
);
