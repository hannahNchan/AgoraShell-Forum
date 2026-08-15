import 'jsr:@supabase/functions-js/edge-runtime.d.ts'
import { createClient } from 'npm:@supabase/supabase-js@2'
import { corsHeaders, jsonResponse } from '../_shared/cors.ts'

type Profile = {
  id: string
  username: string
  role_id: number | null
  role: string | null
  deletion_status?: string | null
}

const supabaseUrl = Deno.env.get('SUPABASE_URL') ?? ''
const anonKey = Deno.env.get('SUPABASE_ANON_KEY') ?? ''
const serviceRoleKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''

const getBearer = (req: Request) => {
  const header = req.headers.get('Authorization') ?? ''
  return header.replace(/^Bearer\s+/i, '').trim()
}

const isAdmin = (profile: Pick<Profile, 'role_id' | 'role'> | null) =>
  profile?.role_id === 1 || profile?.role === 'admin'

const isModerator = (profile: Pick<Profile, 'role_id' | 'role'> | null) =>
  profile?.role_id === 2 || profile?.role === 'moderator'

const canDeleteTarget = (actor: Profile, target: Profile, activeAdminCount: number) => {
  if (actor.id === target.id) return false
  if (target.deletion_status && !['active', 'failed'].includes(target.deletion_status)) return false
  if (target.role_id === 1) return false
  if (target.role_id === 1 && activeAdminCount <= 1) return false
  if (isAdmin(actor)) return true
  return isModerator(actor) && target.role_id === 3
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders })
  if (req.method !== 'POST') return jsonResponse({ error: 'Method not allowed' }, 405)

  try {
    const token = getBearer(req)
    if (!token) return jsonResponse({ error: 'Missing Authorization header' }, 401)

    const authClient = createClient(supabaseUrl, anonKey, {
      global: { headers: { Authorization: `Bearer ${token}` } },
      auth: { persistSession: false },
    })
    const adminClient = createClient(supabaseUrl, serviceRoleKey, {
      auth: { persistSession: false },
    })

    const { data: userData, error: userError } = await authClient.auth.getUser()
    if (userError || !userData.user) return jsonResponse({ error: 'Unauthorized' }, 401)

    const body = await req.json().catch(() => ({}))
    const userId = typeof body.userId === 'string' ? body.userId : ''
    const reason = typeof body.reason === 'string' ? body.reason.trim().slice(0, 1000) : null
    if (!userId) return jsonResponse({ error: 'Missing userId' }, 400)

    const { data: profiles, error: profilesError } = await adminClient
      .from('profiles')
      .select('id, username, role_id, role, deletion_status')
      .in('id', [userData.user.id, userId])

    if (profilesError) throw profilesError

    const actor = (profiles ?? []).find((profile) => profile.id === userData.user.id) as Profile | undefined
    const target = (profiles ?? []).find((profile) => profile.id === userId) as Profile | undefined
    if (!actor || !target) return jsonResponse({ error: 'Usuario no encontrado.' }, 404)
    if (!isAdmin(actor) && !isModerator(actor)) return jsonResponse({ error: 'No tienes permisos para borrar usuarios.' }, 403)

    const { count: activeAdminCount, error: countError } = await adminClient
      .from('profiles')
      .select('id', { count: 'exact', head: true })
      .eq('role_id', 1)
      .eq('deletion_status', 'active')
    if (countError) throw countError

    if (!canDeleteTarget(actor, target, activeAdminCount ?? 0)) {
      return jsonResponse({ error: 'No puedes borrar este rol.' }, 403)
    }

    const { data: existingJob, error: existingError } = await adminClient
      .from('user_deletion_jobs')
      .select('*')
      .eq('user_id', userId)
      .in('status', ['queued', 'processing'])
      .maybeSingle()
    if (existingError) throw existingError

    if (existingJob) {
      return jsonResponse({ job: existingJob, message: 'El usuario ya se esta borrando.' }, 202)
    }

    const { data: targetAuthUser } = await adminClient.auth.admin.getUserById(userId)
    const targetEmail = targetAuthUser?.user?.email ?? null

    const now = new Date().toISOString()
    const { data: job, error: insertError } = await adminClient
      .from('user_deletion_jobs')
      .insert([{
        user_id: userId,
        requested_by: actor.id,
        target_username: target.username,
        target_email: targetEmail,
        target_role_id: target.role_id,
        status: 'queued',
      }])
      .select('*')
      .single()
    if (insertError) throw insertError

    const { error: profileError } = await adminClient
      .from('profiles')
      .update({
        deletion_status: 'deletion_requested',
        deletion_requested_at: now,
        deletion_requested_by: actor.id,
      })
      .eq('id', userId)
    if (profileError) throw profileError

    await adminClient.from('admin_audit_logs').insert([{
      actor_id: actor.id,
      actor_role: actor.role ?? (actor.role_id === 1 ? 'admin' : 'moderator'),
      action: 'user.delete_requested',
      target_type: 'user',
      target_id: userId,
      target_label: target.username,
      metadata: { jobId: job.id, targetRoleId: target.role_id, reason },
    }])

    await adminClient.rpc('enqueue_user_deletion_job', {
      job_id: job.id,
      target_user_id: userId,
    })

    EdgeRuntime.waitUntil(fetch(`${supabaseUrl}/functions/v1/process-user-deletion-jobs`, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${serviceRoleKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ jobId: job.id }),
    }).catch((error) => console.warn('No se pudo disparar el worker de borrado', error)))

    return jsonResponse({ job, message: 'El usuario se esta borrando.' }, 202)
  } catch (error) {
    console.error(error)
    return jsonResponse({ error: error instanceof Error ? error.message : 'No se pudo solicitar el borrado.' }, 500)
  }
})
