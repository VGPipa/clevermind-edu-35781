-- Agregar política para permitir a usuarios crear su primer rol al registrarse
CREATE POLICY "Users can create their first role on signup"
ON public.user_roles
FOR INSERT
TO authenticated
WITH CHECK (
  user_id = auth.uid() 
  AND NOT EXISTS (
    SELECT 1 FROM public.user_roles 
    WHERE user_id = auth.uid()
  )
);