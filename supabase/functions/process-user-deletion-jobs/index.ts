import 'jsr:@supabase/functions-js/edge-runtime.d.ts'
import { createClient } from 'npm:@supabase/supabase-js@2'
import { corsHeaders, jsonResponse } from '../_shared/cors.ts'

type DeletionJob = {
  id: string
  user_id: string
  requested_by: string | null
  target_username: string | null
  target_role_id: number | null
  attempts: number
}

const supabaseUrl = Deno.env.get('SUPABASE_URL') ?? ''
const serviceRoleKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
const MAX_ATTEMPTS = 3

const getBearer = (req: Request) => {
  const header = req.headers.get('Authorization') ?? ''
  return header.replace(/^Bearer\s+/i, '').trim()
}

const getErrorMessage = (error: unknown) =>
  error instanceof Error ? error.message : 'Error desconocido al borrar usuario.'

const throwIfError = (error: unknown) => {
  if (error) throw error
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders })
  if (req.method !== 'POST') return jsonResponse({ error: 'Method not allowed' }, 405)
  if (getBearer(req) !== serviceRoleKey) return jsonResponse({ error: 'Unauthorized' }, 401)

  const supabase = createClient(supabaseUrl, serviceRoleKey, {
    auth: { persistSession: false },
  })

  const body = await req.json().catch(() => ({}))
  const jobId = typeof body.jobId === 'string' ? body.jobId : null
  const limit = Math.min(Math.max(Number(body.limit ?? 5), 1), 10)

  let query = supabase
    .from('user_deletion_jobs')
    .select('*')
    .in('status', ['queued', 'failed'])
    .lt('attempts', MAX_ATTEMPTS)
    .order('requested_at', { ascending: true })
    .limit(limit)

  if (jobId) query = query.eq('id', jobId)

  const { data: jobs, error } = await query
  if (error) return jsonResponse({ error: error.message }, 500)

  const results = []
  for (const job of (jobs ?? []) as DeletionJob[]) {
    results.push(await processJob(supabase, job))
  }

  return jsonResponse({ processed: results.length, results })
})

async function processJob(supabase: ReturnType<typeof createClient>, job: DeletionJob) {
  const userId = job.user_id
  const startedAt = new Date().toISOString()

  const { error: startError } = await supabase
    .from('user_deletion_jobs')
    .update({
      status: 'processing',
      attempts: job.attempts + 1,
      started_at: startedAt,
      last_error: null,
    })
    .eq('id', job.id)
    .in('status', ['queued', 'failed'])

  if (startError) {
    return { jobId: job.id, userId, status: 'failed_to_start', error: startError.message }
  }

  try {
    await supabase.from('profiles').update({ deletion_status: 'deleting' }).eq('id', userId)

    throwIfError((await supabase.from('topics').update({ author_id: null }).eq('author_id', userId)).error)
    throwIfError((await supabase.from('replies').update({ author_id: null }).eq('author_id', userId)).error)
    throwIfError((await supabase.from('topic_map_places').update({ created_by: null }).eq('created_by', userId)).error)
    throwIfError((await supabase.from('tags').update({ created_by: null }).eq('created_by', userId)).error)
    throwIfError((await supabase.from('channels').update({ created_by: null }).eq('created_by', userId)).error)

    throwIfError((await supabase.from('reports').update({ reporter_id: null }).eq('reporter_id', userId)).error)
    throwIfError((await supabase.from('reports').update({ reported_user_id: null }).eq('reported_user_id', userId)).error)
    throwIfError((await supabase.from('reports').update({ target_user_id: null }).eq('target_user_id', userId)).error)
    throwIfError((await supabase.from('reports').update({ assigned_moderator_id: null }).eq('assigned_moderator_id', userId)).error)
    throwIfError((await supabase.from('reports').update({ handled_by_id: null }).eq('handled_by_id', userId)).error)

    throwIfError((await supabase.from('topic_stars').delete().eq('user_id', userId)).error)
    throwIfError((await supabase.from('reply_reactions').delete().eq('user_id', userId)).error)
    throwIfError((await supabase.from('notifications').delete().eq('user_id', userId)).error)
    throwIfError((await supabase.from('notifications').delete().eq('actor_id', userId)).error)
    throwIfError((await supabase.from('user_reputation_events').delete().eq('target_user_id', userId)).error)
    throwIfError((await supabase.from('user_reputation_events').delete().eq('actor_id', userId)).error)

    await supabase.from('admin_audit_logs').insert([{
      actor_id: job.requested_by,
      actor_role: null,
      action: 'user.deleted',
      target_type: 'user',
      target_id: userId,
      target_label: job.target_username ?? 'Deleted User',
      metadata: { jobId: job.id, targetRoleId: job.target_role_id },
    }])

    throwIfError((await supabase.from('profiles').delete().eq('id', userId)).error)

    const { error: authDeleteError } = await supabase.auth.admin.deleteUser(userId)
    if (authDeleteError && authDeleteError.status !== 404) throw authDeleteError

    const finishedAt = new Date().toISOString()
    throwIfError((await supabase
      .from('user_deletion_jobs')
      .update({
        status: 'deleted',
        finished_at: finishedAt,
        last_error: null,
      })
      .eq('id', job.id)).error)

    return { jobId: job.id, userId, status: 'deleted' }
  } catch (error) {
    const message = getErrorMessage(error)
    await supabase
      .from('user_deletion_jobs')
      .update({
        status: 'failed',
        last_error: message,
      })
      .eq('id', job.id)

    await supabase
      .from('profiles')
      .update({ deletion_status: 'failed' })
      .eq('id', userId)

    return { jobId: job.id, userId, status: 'failed', error: message }
  }
}
