import { supabase } from "@/integrations/supabase/client";

/**
 * Utilidad de desarrollo para crear clases sintéticas
 * Uso desde consola: window.crearClaseSintetica()
 */
export async function crearClaseSintetica() {
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
        contexto: 'Clase sintética de prueba - ' + new Date().toLocaleString()
      })
      .select()
      .single();
    
    if (error) {
      console.error('❌ Error:', error);
      return;
    }
    
    console.log('✅ Clase creada:', clase.id);
    console.log('💡 Debería aparecer en "En preparación" del Dashboard');
    console.log('📍 Tema:', tema.nombre);
    console.log('📍 Grupo:', grupo.nombre);
    console.log('📅 Fecha:', fecha.toISOString().split('T')[0]);
    
    return clase;
    
  } catch (error) {
    console.error('❌ Error:', error);
    return null;
  }
}

// Solo en desarrollo, exponer la función globalmente
if (import.meta.env.DEV) {
  (window as any).crearClaseSintetica = crearClaseSintetica;
  console.log('🔧 Dev Utils cargado. Usa: window.crearClaseSintetica()');
}
