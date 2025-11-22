/**
 * Script simple para crear una clase sintética
 * 
 * CÓMO USAR:
 * 1. Abre la consola del navegador (F12)
 * 2. Copia y pega todo este código
 * 3. Ejecuta: crearClaseSintetica()
 */

async function crearClaseSintetica() {
  // Importar supabase desde la app
  const { createClient } = await import('https://esm.sh/@supabase/supabase-js@2');
  
  // Obtener credenciales (ajusta según tu configuración)
  const supabaseUrl = window.location.origin.includes('localhost') 
    ? 'TU_SUPABASE_URL' // Reemplaza con tu URL
    : import.meta.env.VITE_SUPABASE_URL;
  
  const supabaseKey = import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY;
  
  const supabase = createClient(supabaseUrl, supabaseKey);
  
  try {
    console.log('🔍 Buscando datos...');
    
    // Obtener tema
    const { data: temas } = await supabase.from('temas').select('id, nombre').limit(1);
    if (!temas || temas.length === 0) {
      console.error('❌ No hay temas. Crea uno primero.');
      return;
    }
    const tema = temas[0];
    console.log('✅ Tema:', tema.nombre);
    
    // Obtener grupo
    const { data: grupos } = await supabase.from('grupos').select('id, nombre').limit(1);
    if (!grupos || grupos.length === 0) {
      console.error('❌ No hay grupos. Crea uno primero.');
      return;
    }
    const grupo = grupos[0];
    console.log('✅ Grupo:', grupo.nombre);
    
    // Obtener profesor actual
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      console.error('❌ No estás autenticado.');
      return;
    }
    
    const { data: profesor } = await supabase
      .from('profesores')
      .select('id')
      .eq('user_id', user.id)
      .single();
    
    if (!profesor) {
      console.error('❌ No se encontró profesor.');
      return;
    }
    console.log('✅ Profesor encontrado');
    
    // Crear clase
    const fecha = new Date();
    fecha.setDate(fecha.getDate() + 7);
    
    const { data: clase, error } = await supabase
      .from('clases')
      .insert({
        id_tema: tema.id,
        id_grupo: grupo.id,
        id_profesor: profesor.id,
        numero_sesion: 1,
        fecha_programada: fecha.toISOString().split('T')[0],
        duracion_minutos: 90,
        estado: 'borrador',
        contexto: 'Clase sintética de prueba'
      })
      .select()
      .single();
    
    if (error) {
      console.error('❌ Error:', error);
      return;
    }
    
    console.log('✅ Clase creada:', clase.id);
    console.log('💡 Debería aparecer en "En preparación" del Dashboard');
    
  } catch (error) {
    console.error('❌ Error:', error);
  }
}

// Ejecutar automáticamente
crearClaseSintetica();


