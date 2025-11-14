import { createClient, SupabaseClient } from 'https://esm.sh/@supabase/supabase-js@2.76.1';

export const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

export interface AuthResult {
  supabase: SupabaseClient;
  user: { id: string; email?: string };
  profesor: { id: string };
}

/**
 * Creates a Supabase client with authentication
 * @param useServiceRole - Whether to use SERVICE_ROLE_KEY (default: false, uses ANON_KEY)
 * @returns Supabase client configured with auth header
 */
export function createSupabaseClient(
  authHeader: string | null,
  useServiceRole: boolean = false
): SupabaseClient {
  const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
  const supabaseKey = useServiceRole
    ? Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
    : Deno.env.get('SUPABASE_ANON_KEY')!;

  return createClient(supabaseUrl, supabaseKey, {
    auth: useServiceRole
      ? {
          persistSession: false,
          autoRefreshToken: false,
        }
      : undefined,
    global: {
      headers: authHeader ? { Authorization: authHeader } : {},
    },
  });
}

/**
 * Handles OPTIONS request for CORS
 */
export function handleCors(): Response | null {
  return new Response(null, { headers: corsHeaders });
}

/**
 * Gets authenticated user from request
 * @param supabase - Supabase client instance
 * @returns User object or throws error
 */
export async function getAuthenticatedUser(supabase: SupabaseClient) {
  const { data: { user }, error: userError } = await supabase.auth.getUser();
  
  if (userError || !user) {
    throw new Error('Usuario no autenticado');
  }
  
  return user;
}

/**
 * Gets profesor record from user_id
 * @param supabase - Supabase client instance
 * @param userId - User ID
 * @param selectFields - Optional fields to select (default: 'id')
 * @returns Profesor object or throws error
 */
export async function getProfesorFromUserId(
  supabase: SupabaseClient,
  userId: string,
  selectFields: string = 'id'
) {
  const { data: profesor, error: profesorError } = await supabase
    .from('profesores')
    .select(selectFields)
    .eq('user_id', userId)
    .single();

  if (profesorError || !profesor) {
    throw new Error('Profesor no encontrado');
  }

  return profesor;
}

/**
 * Complete authentication flow: gets user and profesor
 * @param req - Request object
 * @param useServiceRole - Whether to use SERVICE_ROLE_KEY
 * @returns AuthResult with supabase client, user, and profesor
 */
export async function authenticateProfesor(
  req: Request,
  useServiceRole: boolean = false
): Promise<AuthResult> {
  const authHeader = req.headers.get('Authorization');
  
  if (!authHeader) {
    throw new Error('No authorization header');
  }

  const supabase = createSupabaseClient(authHeader, useServiceRole);
  const user = await getAuthenticatedUser(supabase);
  const profesor = await getProfesorFromUserId(supabase, user.id);

  return {
    supabase,
    user,
    profesor,
  };
}

/**
 * Creates an error response with CORS headers
 */
export function createErrorResponse(
  message: string,
  status: number = 500
): Response {
  return new Response(
    JSON.stringify({ error: message }),
    {
      status,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    }
  );
}

/**
 * Creates a success response with CORS headers
 */
export function createSuccessResponse(
  data: any,
  status: number = 200
): Response {
  return new Response(
    JSON.stringify(data),
    {
      status,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    }
  );
}

