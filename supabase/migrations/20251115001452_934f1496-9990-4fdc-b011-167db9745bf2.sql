-- Migración para asegurar consistencia de id_institucion
-- Solución sostenible a largo plazo para el sistema de instituciones

-- PASO 1: Actualizar user_roles para profesores sin institución
-- Asignar la institución del primer grupo al que están asignados
UPDATE user_roles ur
SET id_institucion = (
  SELECT DISTINCT g.id_institucion
  FROM asignaciones_profesor a
  JOIN grupos g ON g.id = a.id_grupo
  JOIN profesores pr ON pr.id = a.id_profesor
  WHERE pr.user_id = ur.user_id
    AND g.id_institucion IS NOT NULL
  LIMIT 1
)
WHERE ur.role = 'profesor' 
  AND ur.id_institucion IS NULL
  AND EXISTS (
    SELECT 1 
    FROM profesores pr 
    WHERE pr.user_id = ur.user_id
  );

-- PASO 2: Actualizar profiles para mantener consistencia
-- Copiar id_institucion desde user_roles a profiles
UPDATE profiles p
SET id_institucion = (
  SELECT id_institucion 
  FROM user_roles 
  WHERE user_id = p.user_id 
  LIMIT 1
)
WHERE p.id_institucion IS NULL
  AND EXISTS (
    SELECT 1 
    FROM user_roles ur 
    WHERE ur.user_id = p.user_id 
      AND ur.id_institucion IS NOT NULL
  );

-- PASO 3: Mejorar el trigger handle_new_user para asignar institución automáticamente
-- Extraer id_institucion desde raw_user_meta_data al crear el perfil
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  INSERT INTO public.profiles (user_id, email, nombre, apellido, id_institucion)
  VALUES (
    NEW.id,
    NEW.email,
    NEW.raw_user_meta_data->>'nombre',
    NEW.raw_user_meta_data->>'apellido',
    COALESCE(
      (NEW.raw_user_meta_data->>'id_institucion')::uuid,
      NULL
    )
  );
  RETURN NEW;
END;
$$;

-- NOTA: No agregamos constraint NOT NULL a id_institucion aún
-- porque algunos roles (como apoderados) podrían no necesitar institución
-- El constraint se validará a nivel de aplicación según el rol