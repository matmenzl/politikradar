import { createClient } from 'npm:@supabase/supabase-js@2'
import { corsHeaders } from 'npm:@supabase/supabase-js@2/cors'
import { sendTemplateEmail } from '../_shared/transactional-email-templates/send-email.ts'

/** Deletes the calling user's account and all related data, then confirms by e-mail. */
Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders })

  const json = (body: unknown, status = 200) =>
    new Response(JSON.stringify(body), {
      status,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    })

  try {
    const authHeader = req.headers.get('Authorization') ?? ''
    const token = authHeader.replace('Bearer ', '').trim()
    if (!token) return json({ error: 'Nicht angemeldet.' }, 401)

    const url = Deno.env.get('SUPABASE_URL')!
    const admin = createClient(url, Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!, {
      auth: { persistSession: false },
    })

    const { data: userData, error: userError } = await admin.auth.getUser(token)
    const user = userData?.user
    if (userError || !user) return json({ error: 'Sitzung ungültig.' }, 401)

    const email = user.email ?? ''

    // 1) Persistent data
    await admin.from('alert_deliveries').delete().eq('user_id', user.id)
    await admin.from('subscriber_profiles').delete().eq('user_id', user.id)

    // 2) Auth account
    const { error: deleteError } = await admin.auth.admin.deleteUser(user.id)
    if (deleteError) {
      console.error('deleteUser failed', deleteError)
      return json({ error: 'Konto konnte nicht gelöscht werden.' }, 500)
    }

    // 3) Confirmation e-mail (never blocks the deletion)
    let emailSent = false
    if (email) {
      try {
        const result = await sendTemplateEmail('account-deleted', email, {
          templateData: {
            email,
            deletedAt: new Date().toLocaleDateString('de-CH', {
              day: '2-digit',
              month: '2-digit',
              year: 'numeric',
            }),
          },
          idempotencyKey: `account-deleted-${user.id}`,
        })
        emailSent = result.sent
      } catch (e) {
        console.error('confirmation email failed', e)
      }
    }

    return json({ deleted: true, emailSent })
  } catch (e) {
    console.error('delete-account error', e)
    return json({ error: 'Unerwarteter Fehler.' }, 500)
  }
})
