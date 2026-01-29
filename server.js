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
const BASE_URL = process.env.BASE_URL || '';

if (!SUPABASE_URL || !SUPABASE_ANON_KEY) {
  console.warn('[server] SUPABASE_URL or SUPABASE_ANON_KEY missing');
}

const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
const supabaseAdmin = SUPABASE_SERVICE_ROLE_KEY
  ? createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY)
  : null;

/** Get Supabase client - uses custom headers if provided, otherwise uses env defaults */
function getSupabaseClient(req) {
  const customUrl = req.headers['x-supabase-url'];
  const customKey = req.headers['x-supabase-anon-key'];
  
  if (customUrl && customKey) {
    return createClient(customUrl, customKey);
  }
  return supabase;
}

/** Get Supabase URL - uses custom header if provided, otherwise uses env default */
function getSupabaseUrl(req) {
  const url = req.headers['x-supabase-url'] || SUPABASE_URL;
  return url.replace(/\/+$/, ''); // Remove trailing slashes
}

/** Get Supabase Anon Key - uses custom header if provided, otherwise uses env default */
function getSupabaseAnonKey(req) {
  return req.headers['x-supabase-anon-key'] || SUPABASE_ANON_KEY;
}

/** Get Supabase Service Role Key - uses custom header if provided, otherwise uses env default */
function getSupabaseServiceKey(req) {
  return req.headers['x-supabase-service-key'] || SUPABASE_SERVICE_ROLE_KEY;
}

/** Get Supabase Admin client - uses custom headers if provided */
function getSupabaseAdminClient(req) {
  const customUrl = req.headers['x-supabase-url'];
  const customServiceKey = req.headers['x-supabase-service-key'];
  
  if (customUrl && customServiceKey) {
    return createClient(customUrl, customServiceKey);
  }
  return supabaseAdmin;
}

/** Check if user exists (signup-trick: empty user_metadata/identities = exists). Returns boolean. */
async function checkUserExists(email, client) {
  const randomPassword = Math.random().toString(36).slice(-12) + 'A1!';
  const { data, error } = await client.auth.signUp({ email, password: randomPassword });
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

/* ---------------- CONFIG ---------------- */

app.get('/config', (req, res) => {
  // Returns BASE_URL from env if set (for production deployments)
  const normalizedBaseUrl = BASE_URL ? BASE_URL.replace(/\/+$/, '') : null;
  res.json({ 
    baseUrl: normalizedBaseUrl,
    hasBaseUrl: !!BASE_URL 
  });
});

/* ---------------- SUPABASE STATUS ---------------- */

app.get('/supabase-status', async (req, res) => {
  const client = getSupabaseClient(req);
  const supabaseUrl = getSupabaseUrl(req);
  const hasAnonKey = !!(req.headers['x-supabase-anon-key'] || SUPABASE_ANON_KEY);
  const hasServiceKey = !!(req.headers['x-supabase-service-key'] || SUPABASE_SERVICE_ROLE_KEY);
  
  // Check if credentials are configured
  if (!supabaseUrl || !hasAnonKey) {
    return res.status(400).json({
      status: 'error',
      connected: false,
      message: 'Supabase credentials not configured',
      details: {
        hasUrl: !!supabaseUrl,
        hasAnonKey,
        hasServiceKey
      }
    });
  }
  
  try {
    // Try to get auth settings - this is a lightweight call that tests connectivity
    const { data, error } = await client.auth.getSession();
    
    if (error && !error.message.includes('no current session')) {
      return res.status(500).json({
        status: 'error',
        connected: false,
        message: 'Supabase connection failed',
        error: error.message,
        details: {
          url: supabaseUrl,
          hasAnonKey,
          hasServiceKey
        }
      });
    }
    
    return res.json({
      status: 'ok',
      connected: true,
      message: 'Supabase connection successful',
      details: {
        url: supabaseUrl,
        hasAnonKey,
        hasServiceKey
      }
    });
  } catch (err) {
    return res.status(500).json({
      status: 'error',
      connected: false,
      message: 'Supabase connection failed',
      error: err.message,
      details: {
        url: supabaseUrl,
        hasAnonKey,
        hasServiceKey
      }
    });
  }
});

/* ---------------- AUTH ---------------- */

app.post('/signUp', async (req, res) => {
  const { email, password, data } = req.body || {};
  if (!email || !password)
    return res.status(400).json({ error: 'email and password required' });

  try {
    const client = getSupabaseClient(req);
    const { data: userData, error } = await client.auth.signUp({
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
    const client = getSupabaseClient(req);
    const { data, error } = await client.auth.verifyOtp({
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
    const client = getSupabaseClient(req);
    // This re-sends OTP email
    const { data, error } = await client.auth.signInWithOtp({
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
    const client = getSupabaseClient(req);
    const { data, error } = await client.auth.signInWithPassword({
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
    const client = getSupabaseClient(req);
    const { data, error } = await client.auth.signInWithOAuth({
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
    const client = getSupabaseClient(req);
    const exists = await checkUserExists(email, client);
    if (!exists)
      return res.status(400).json({ error: 'User does not exist' });

    const { data, error } = await client.auth.resetPasswordForEmail(email, {
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
    const client = getSupabaseClient(req);
    const { data, error } = await client.auth.verifyOtp({
      email,
      token,
      type: 'recovery',
    });

    if (error) return res.status(400).json({ error: error.message });
    if (!data?.session) return res.status(400).json({ error: 'No session from OTP verification' });

    const sessionClient = createClient(getSupabaseUrl(req), getSupabaseAnonKey(req));
    await sessionClient.auth.setSession({
      access_token: data.session.access_token,
      refresh_token: data.session.refresh_token,
    });

    const { error: updateError } = await sessionClient.auth.updateUser({ password: newPassword });

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
      const client = getSupabaseClient(req);
      const { data, error } = await client.auth.getUser(token);
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

  const serviceKey = getSupabaseServiceKey(req);
  if (!serviceKey)
    return res.status(403).json({ error: 'Service role key missing (provide via header or server env)' });

  try {
    const baseUrl = getSupabaseUrl(req);
    const url = `${baseUrl}/auth/v1/admin/users?email=${encodeURIComponent(email)}`;

    const r = await fetch(url, {
      headers: {
        Authorization: `Bearer ${serviceKey}`,
        apikey: serviceKey,
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
    const client = getSupabaseClient(req);
    const exists = await checkUserExists(email, client);
    return res.json({ exists, data: null });
  } catch (err) {
    return res.status(500).json({ error: err.message });
  }
});

/* ---------------- STATIC (frontend) ---------------- */

// Serve index.html on root route
app.get('/', (req, res) => {
  res.sendFile(__dirname + '/public/index.html');
});

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
