// Edge Function: manage-student
// Creates, resets and deletes student accounts. This needs the service-role key,
// so it must run here on the server and never in the browser.
//
// Deploy:   supabase functions deploy manage-student
//           (or paste this file in Supabase > Edge Functions > Deploy a new function)
// Optional: supabase secrets set INVITE_REDIRECT_URL=<where the invite link should open>
//
// Optional: email the login details to a student (the "Email to student" button). Add these secrets in
//           Supabase > Edge Functions > Secrets (Supabase blocks port 587 here, so use 465):
//             SMTP_HOST=smtp.gmail.com   SMTP_PORT=465   SMTP_USER=you@gmail.com   SMTP_PASS=<gmail app password>
//             SMTP_FROM=you@gmail.com (optional, defaults to SMTP_USER)
//
// Body: { action: 'create' | 'reset_password' | 'delete' | 'invite' | 'resend' | 'email_credentials', ... }
//   create          makes the student with a generated password and returns it once (no email needed)
//   reset_password  sets a new generated password and returns it once
//   invite / resend email based flow, needs SMTP (used later)

import { createClient } from 'npm:@supabase/supabase-js@2'

const cors = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

// 10 characters, no look-alike letters (0/O, 1/l/I), always with upper, lower and a digit.
function generatePassword(): string {
  const upper = 'ABCDEFGHJKLMNPQRSTUVWXYZ'
  const lower = 'abcdefghijkmnopqrstuvwxyz'
  const digits = '23456789'
  const all = upper + lower + digits
  const pick = (set: string) => set[crypto.getRandomValues(new Uint32Array(1))[0] % set.length]
  const chars = [pick(upper), pick(lower), pick(digits), ...Array.from({ length: 7 }, () => pick(all))]
  for (let i = chars.length - 1; i > 0; i--) {
    const j = crypto.getRandomValues(new Uint32Array(1))[0] % (i + 1)
    ;[chars[i], chars[j]] = [chars[j], chars[i]]
  }
  return chars.join('')
}

const json = (body: unknown, status = 200) =>
  new Response(JSON.stringify(body), { status, headers: { ...cors, 'Content-Type': 'application/json' } })

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: cors })

  try {
    const url = Deno.env.get('SUPABASE_URL')!
    const anonKey = Deno.env.get('SUPABASE_ANON_KEY')!
    const serviceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
    const redirectTo = Deno.env.get('INVITE_REDIRECT_URL') || undefined

    // 1. Who is calling? Only signed-in admins and trainers may continue.
    const caller = createClient(url, anonKey, {
      global: { headers: { Authorization: req.headers.get('Authorization') ?? '' } },
    })
    const { data: auth } = await caller.auth.getUser()
    if (!auth.user) return json({ error: 'You are not signed in.' }, 401)

    const admin = createClient(url, serviceKey)
    const { data: me } = await admin.from('profiles').select('role').eq('id', auth.user.id).single()
    if (!me || !['super_admin', 'trainer'].includes(me.role)) return json({ error: 'Only admins can do this.' }, 403)

    const body = await req.json()

    // 2a. Create a student with a generated password. No email is sent: the admin hands the password over.
    if (body.action === 'create') {
      const s = body.student ?? {}
      const email = String(s.email ?? '').trim().toLowerCase()
      const name = String(s.name ?? '').trim()
      if (!email || !name) return json({ error: 'Name and email are required.' }, 400)

      const password = generatePassword()
      const { data, error } = await admin.auth.admin.createUser({
        email,
        password,
        email_confirm: true,
        user_metadata: { full_name: name },
      })
      if (error || !data.user) {
        const taken = /already|registered|exists/i.test(error?.message ?? '')
        return json({ error: taken ? 'A student with this email already exists.' : (error?.message ?? 'Could not create the student.') }, 400)
      }

      const { data: profile, error: updateError } = await admin
        .from('profiles')
        .update({
          full_name: name,
          email,
          phone: s.phone ?? '',
          role: 'student',
          roles: s.roles ?? [],
          batch_id: s.batchId || null,
          status: s.status ?? 'active',
          app_access: s.appAccess ?? true,
          invite_status: 'pending',
        })
        .eq('id', data.user.id)
        .select()
        .single()
      if (updateError) return json({ error: updateError.message }, 400)
      return json({ profile, password })
    }

    // 2b. Give a student a new password (forgotten password, or first handover). Returned once.
    if (body.action === 'reset_password') {
      const id = String(body.id ?? '')
      if (!id) return json({ error: 'Student id is required.' }, 400)
      const { data: target } = await admin.from('profiles').select('role, email').eq('id', id).single()
      if (!target || target.role !== 'student') return json({ error: 'Only student accounts can be reset here.' }, 400)
      const password = generatePassword()
      const { error } = await admin.auth.admin.updateUserById(id, { password })
      if (error) return json({ error: error.message }, 400)
      return json({ password, email: target.email })
    }

    // 2c. Invite by email (needs SMTP): Supabase emails a link, the student sets their own password.
    if (body.action === 'invite') {
      const s = body.student ?? {}
      const email = String(s.email ?? '').trim().toLowerCase()
      const name = String(s.name ?? '').trim()
      if (!email || !name) return json({ error: 'Name and email are required.' }, 400)

      const { data, error } = await admin.auth.admin.inviteUserByEmail(email, {
        data: { full_name: name },
        redirectTo,
      })
      if (error || !data.user) return json({ error: error?.message ?? 'Could not send the invite.' }, 400)

      const { data: profile, error: updateError } = await admin
        .from('profiles')
        .update({
          full_name: name,
          email,
          phone: s.phone ?? '',
          role: 'student',
          roles: s.roles ?? [],
          batch_id: s.batchId || null,
          status: s.status ?? 'active',
          app_access: s.appAccess ?? true,
          invite_status: 'pending',
        })
        .eq('id', data.user.id)
        .select()
        .single()
      if (updateError) return json({ error: updateError.message }, 400)
      return json({ profile })
    }

    // 3. Send the invite again (the first email got lost or expired).
    if (body.action === 'resend') {
      const email = String(body.email ?? '').trim().toLowerCase()
      if (!email) return json({ error: 'Email is required.' }, 400)

      const { error } = await admin.auth.admin.inviteUserByEmail(email, { redirectTo })
      if (!error) return json({ ok: true })

      // The user already exists: fall back to a password-setup email.
      const { error: resetError } = await caller.auth.resetPasswordForEmail(email, { redirectTo })
      if (resetError) return json({ error: resetError.message }, 400)
      return json({ ok: true, fallback: 'reset' })
    }

    // 3b. Email the login details to a student. The admin has just seen the password in the popup.
    if (body.action === 'email_credentials') {
      const email = String(body.email ?? '').trim().toLowerCase()
      const password = String(body.password ?? '')
      if (!email || !password) return json({ error: 'Email and password are required.' }, 400)
      const { data: target } = await admin.from('profiles').select('role, full_name').eq('email', email).maybeSingle()
      if (!target || target.role !== 'student') return json({ error: 'Only students can be emailed from here.' }, 400)

      // The secrets may be named SMTP_* or EMAIL_*; both work.
      const secret = (...names: string[]) => names.map(n => Deno.env.get(n)).find(v => v && v.trim())?.trim()
      const host = secret('SMTP_HOST', 'EMAIL_HOST')
      const smtpUser = secret('SMTP_USER', 'EMAIL_USER')
      const smtpPass = secret('SMTP_PASS', 'EMAIL_PASSWORD', 'EMAIL_PASS')?.replace(/\s+/g, '')
      const missing = [['SMTP_HOST', host], ['SMTP_USER', smtpUser], ['SMTP_PASS', smtpPass]].filter(([, v]) => !v).map(([k]) => k)
      if (missing.length) {
        return json({ error: `Email is not set up yet. These secrets are missing: ${missing.join(', ')}. Add them in Supabase > Edge Functions > Secrets, then deploy the manage-student function once more so it picks them up. Names must match exactly (capital letters, underscore, no spaces).` }, 400)
      }
      const port = Number(secret('SMTP_PORT', 'EMAIL_PORT') ?? '465')
      const from = secret('SMTP_FROM', 'EMAIL_FROM') || smtpUser
      const name = target.full_name || 'there'

      const { default: nodemailer } = await import('npm:nodemailer@6.9.16')
      const transport = nodemailer.createTransport({ host, port, secure: port === 465, auth: { user: smtpUser, pass: smtpPass } })
      try {
        await transport.sendMail({
          from: `"Truck Stop" <${from}>`,
          to: email,
          subject: 'Your Truck Stop login',
          text: `Hi ${name},\n\nYour Truck Stop account is ready. Open the Truck Stop app and sign in with:\n\nEmail: ${email}\nPassword: ${password}\n\nYou can change the password later from Profile in the app.\n\nTruck Stop`,
          html: `<p>Hi ${name},</p><p>Your Truck Stop account is ready. Open the Truck Stop app and sign in with:</p><p><b>Email:</b> ${email}<br><b>Password:</b> <code>${password}</code></p><p>You can change the password later from Profile in the app.</p><p>Truck Stop</p>`,
        })
      } catch (e) {
        return json({ error: `The email could not be sent: ${e instanceof Error ? e.message : 'unknown error'}` }, 400)
      }
      return json({ ok: true })
    }

    // 4. Delete the account. Deleting the auth user also removes the profile, assignments and attempts.
    if (body.action === 'delete') {
      const id = String(body.id ?? '')
      if (!id) return json({ error: 'Student id is required.' }, 400)
      const { data: target } = await admin.from('profiles').select('role').eq('id', id).single()
      if (!target || target.role !== 'student') return json({ error: 'Only student accounts can be deleted here.' }, 400)
      const { error } = await admin.auth.admin.deleteUser(id)
      if (error) return json({ error: error.message }, 400)
      return json({ ok: true })
    }

    return json({ error: 'Unknown action.' }, 400)
  } catch (e) {
    return json({ error: e instanceof Error ? e.message : 'Something went wrong.' }, 500)
  }
})
