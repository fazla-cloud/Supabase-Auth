/**
 * server.js
 * Simple Express server to interact with Supabase (anon + optional service role key).
 *
 * Auth: signUp, signUpVerify, resendOtp, signIn, gglSignIn, forgtPss, resetPssVerify, getUsr, usrExst
 */

try { require('dotenv').config(); } catch (e) {}

const express = require('express');
const cors = require('cors');
const { createClient } = require('@supabase/supabase-js');

const SUPABASE_URL = process.env.SUPABASE_URL || '';
const SUPABASE_ANON_KEY = process.env.SUPABASE_ANON_KEY || '';
const SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY || '';
const PORT = process.env.PORT || 3024;

if (!SUPABASE_URL || !SUPABASE_ANON_KEY) {
  console.warn('[server] SUPABASE_URL or SUPABASE_ANON_KEY missing');
}

const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
const supabaseAdmin = SUPABASE_SERVICE_ROLE_KEY
  ? createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY)
  : null;

/** Check if user exists (signup-trick: empty user_metadata/identities = exists). Returns boolean. */
async function checkUserExists(email) {
  const randomPassword = Math.random().toString(36).slice(-12) + 'A1!';
  const { data, error } = await supabase.auth.signUp({ email, password: randomPassword });
  if (error) {
    if (error.message.includes('already registered') || error.message.includes('already exists'))
      return true;
    return false;
  }
  const user = data?.user;
  const hasMetadata = user?.user_metadata && Object.keys(user.user_metadata).length > 0;
  const hasIdentities = user?.identities && Array.isArray(user.identities) && user.identities.length > 0;
  return !hasMetadata && !hasIdentities;
}

const app = express();
app.use(cors());
app.use(express.json());

/* ---------------- HEALTH ---------------- */

app.get('/health', (req, res) => {
  res.json({ status: 'ok', time: new Date().toISOString() });
});

/* ---------------- AUTH ---------------- */

app.post('/signUp', async (req, res) => {
  const { email, password, data } = req.body || {};
  if (!email || !password)
    return res.status(400).json({ error: 'email and password required' });

  try {
    const { data: userData, error } = await supabase.auth.signUp({
      email,
      password,
      options: { data },
    });

    if (error) return res.status(400).json({ error: error.message });

    return res.json({
      status: 'ok',
      message: 'Signup successful. Please verify OTP sent to email.',
      data: userData,
    });
  } catch (err) {
    return res.status(500).json({ error: err.message });
  }
});

/* ---------- SIGN UP OTP VERIFICATION ---------- */

app.post('/signUpVerify', async (req, res) => {
  const { email, token, type } = req.body || {};

  if (!email || !token)
    return res.status(400).json({ error: 'email and token (OTP) required' });

  try {
    const { data, error } = await supabase.auth.verifyOtp({
      email,
      token,
      type: type || 'signup', // default signup
    });

    if (error) return res.status(400).json({ error: error.message });

    return res.json({
      status: 'ok',
      message: 'Email verified successfully',
      session: data.session,
      user: data.user,
    });
  } catch (err) {
    return res.status(500).json({ error: err.message });
  }
});

/* ---------- RESEND EMAIL OTP ---------- */

app.post('/resendOtp', async (req, res) => {
  const { email, type } = req.body || {};

  if (!email)
    return res.status(400).json({ error: 'email required' });

  try {
    // This re-sends OTP email
    const { data, error } = await supabase.auth.signInWithOtp({
      email,
      options: {
        shouldCreateUser: false, // IMPORTANT: prevents new user creation
      },
    });

    if (error) return res.status(400).json({ error: error.message });

    return res.json({
      status: 'ok',
      message: 'OTP resent successfully',
      data,
    });
  } catch (err) {
    return res.status(500).json({ error: err.message });
  }
});

/* ---------------- SIGN IN ---------------- */

app.post('/signIn', async (req, res) => {
  const { email, password } = req.body || {};
  if (!email || !password)
    return res.status(400).json({ error: 'email and password required' });

  try {
    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    if (error) return res.status(400).json({ error: error.message });

    return res.json(data);
  } catch (err) {
    return res.status(500).json({ error: err.message });
  }
});

/* ---------------- GOOGLE SIGN IN ---------------- */

app.get('/gglSignIn', async (req, res) => {
  const redirectTo = req.query.redirectTo || '';
  try {
    const { data, error } = await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: { redirectTo },
    });

    if (error) return res.status(400).json({ error: error.message });
    return res.json(data);
  } catch (err) {
    return res.status(500).json({ error: err.message });
  }
});

/* ---------------- FORGOT PASSWORD ---------------- */

app.post('/forgtPss', async (req, res) => {
  const { email, redirectTo } = req.body || {};
  if (!email) return res.status(400).json({ error: 'email required' });

  try {
    const exists = await checkUserExists(email);
    if (!exists)
      return res.status(400).json({ error: 'User does not exist' });

    const { data, error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo,
    });

    if (error) return res.status(400).json({ error: error.message });
    return res.json({ status: 'ok', data });
  } catch (err) {
    return res.status(500).json({ error: err.message });
  }
});

/* ---------- RESET PASSWORD OTP VERIFY (token + new password) ---------- */

app.post('/resetPssVerify', async (req, res) => {
  const { email, token, newPassword } = req.body || {};

  if (!email || !token || !newPassword)
    return res.status(400).json({ error: 'email, token (OTP from reset email), and newPassword required' });

  try {
    const { data, error } = await supabase.auth.verifyOtp({
      email,
      token,
      type: 'recovery',
    });

    if (error) return res.status(400).json({ error: error.message });
    if (!data?.session) return res.status(400).json({ error: 'No session from OTP verification' });

    const client = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
    await client.auth.setSession({
      access_token: data.session.access_token,
      refresh_token: data.session.refresh_token,
    });

    const { error: updateError } = await client.auth.updateUser({ password: newPassword });

    if (updateError) return res.status(400).json({ error: updateError.message });

    return res.json({
      status: 'ok',
      message: 'Password reset successfully',
      session: data.session,
      user: data.user,
    });
  } catch (err) {
    return res.status(500).json({ error: err.message });
  }
});

/* ---------------- GET USER ---------------- */

app.get('/getUsr', async (req, res) => {
  const auth = req.headers.authorization || '';

  if (auth.startsWith('Bearer ')) {
    const token = auth.split(' ')[1];
    try {
      const { data, error } = await supabase.auth.getUser(token);
      if (error) return res.status(400).json({ error: error.message });
      return res.json(data);
    } catch (err) {
      return res.status(500).json({ error: err.message });
    }
  }

  const email = req.query.email;
  if (!email)
    return res
      .status(400)
      .json({ error: 'Bearer token or ?email required' });

  if (!SUPABASE_SERVICE_ROLE_KEY)
    return res.status(403).json({ error: 'Admin key missing' });

  try {
    const url = `${SUPABASE_URL.replace(
      /\/$/,
      ''
    )}/auth/v1/admin/users?email=${encodeURIComponent(email)}`;

    const r = await fetch(url, {
      headers: {
        Authorization: `Bearer ${SUPABASE_SERVICE_ROLE_KEY}`,
        apikey: SUPABASE_SERVICE_ROLE_KEY,
      },
    });

    const json = await r.json();
    return res.json(json);
  } catch (err) {
    return res.status(500).json({ error: err.message });
  }
});

/* ---------------- USER EXISTS ---------------- */

app.post('/usrExst', async (req, res) => {
  const { email } = req.body || {};
  if (!email) return res.status(400).json({ error: 'email required' });

  try {
    const exists = await checkUserExists(email);
    return res.json({ exists, data: null });
  } catch (err) {
    return res.status(500).json({ error: err.message });
  }
});

/* ---------------- STATIC (frontend) ---------------- */

app.use(express.static('public'));

/* ---------------- START ---------------- */

// Export for Vercel serverless functions
module.exports = app;

// Start server locally (not in Vercel)
if (require.main === module) {
  app.listen(PORT, () => {
    console.log(`[server] running at http://localhost:${PORT}`);
  });
}
