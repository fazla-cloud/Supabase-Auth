# 🔐 Supabase Auth API Server

A lightweight, production-ready Node.js REST API server that wraps Supabase Authentication, providing a clean interface for user authentication flows including signup, sign-in, OTP verification, password reset, and user management.

[![Node.js](https://img.shields.io/badge/Node.js-18%2B-green)](https://nodejs.org/)
[![Express](https://img.shields.io/badge/Express-5.2-blue)](https://expressjs.com/)
[![Supabase](https://img.shields.io/badge/Supabase-2.90-green)](https://supabase.com/)

---

## 👤 Portfolio (Author)

<div align="start">

<img src="assets/images/fazla.png" alt="Author" width="140" />

</div>

| | |
|---|---|
| **Name** | *Fazla Rabbi* |
| **Role** | Software Developer |
| **Portfolio / Website** | *https://fazla.pro* |
| **Contact** | [frchowdhury480@gmail.com](mailto:frchowdhury480@gmail.com) |

<!-- | **Projects** | ** | -->

<div align="start">

<!-- 🌐 Socials -->
<b>Socials:</b><br>

<!-- Socials (icons only) — replace links with yours -->
<a href="https://fazla.pro" title="Website"><img src="https://cdn.simpleicons.org/googlechrome/FFFFFF" height="20" alt="Website" /></a>&nbsp;&nbsp;
<a href="https://github.com/fazla-cloud" title="GitHub"><img src="https://cdn.simpleicons.org/github/FFFFFF" height="20" alt="GitHub" /></a>&nbsp;&nbsp;
<a href="https://www.linkedin.com/in/fazla1/" title="LinkedIn"><img src="https://cdn.simpleicons.org/logmein/FFFFFF" height="20" alt="LinkedIn" /></a>&nbsp;&nbsp;
<a href="https://www.facebook.com/InnocentP480" title="Facebook"><img src="https://cdn.simpleicons.org/facebook/FFFFFF" height="20" alt="Facebook" /></a>&nbsp;&nbsp;
<a href="https://x.com/fazla_fr" title="X (Twitter)"><img src="https://cdn.simpleicons.org/x/FFFFFF" height="18" alt="X" /></a>&nbsp;&nbsp;

</div>

### Key Skills in This Project

- **Backend**: `Node.js`, `Express.js`
- **Auth and Backend**: `Supabase` (Email/Password, OTP, Google OAuth)
- **Environment**: `dotenv` (configuration management)
- **HTTP & Networking**: `node-fetch`, `cors`
- **Frontend (API Tester)**: `HTML`, `CSS`, `JavaScript` (vanilla)
- **API Testing**: `Postman`, `curl`

---

## ✨ Features

- 🔑 **Complete Authentication Flow**
  - Email/password signup with OTP verification
  - Email/password sign-in
  - OTP resend functionality
  - Password reset with OTP verification
  - Google OAuth integration

- 👤 **User Management**
  - Check if user exists (no admin key required)
  - Get user by access token or email (admin)
  - User existence validation before password reset

- 🎨 **Built-in API Tester**
  - Interactive web UI for testing all endpoints
  - Real-time response display
  - No external tools needed

- 📚 **Developer-Friendly**
  - Comprehensive documentation
  - Postman collection included
  - curl examples provided
  - TypeScript-ready structure

- 🔒 **Security**
  - Environment-based configuration
  - CORS enabled
  - Input validation
  - Error handling

---

## 🚀 Quick Start

### Prerequisites

- **Node.js** 18+ and npm
- **Supabase Account** ([sign up](https://supabase.com))

### Installation

1. **Clone or download this repository**

```bash
git clone https://github.com/fazla-cloud/Supabase-Auth.git
cd Supabase/Auth
```

2. **Install dependencies**

```bash
npm install
```

3. **Configure environment variables**

Copy `env.example` to `.env`:

```bash
cp env.example .env
```

Edit `.env` with your Supabase credentials:

```env
SUPABASE_URL=https://your-project.supabase.co
SUPABASE_ANON_KEY=your-anon-key
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key  # Optional, for admin endpoints
PORT=3024  # Optional, defaults to 3024
```

**Where to find your keys:**
- Go to [Supabase Dashboard](https://app.supabase.com)
- Select your project → **Settings** → **API**
- Copy `Project URL` → `SUPABASE_URL`
- Copy `anon public` key → `SUPABASE_ANON_KEY`
- Copy `service_role` key → `SUPABASE_SERVICE_ROLE_KEY` (keep secret!)

4. **Start the server**

```bash
# Development mode (auto-reload on file changes)
npm run dev

# Production mode
npm start
```

5. **Access the API Tester**

Open your browser to: **http://localhost:3024**

You'll see an interactive UI to test all endpoints!

---

## 📖 API Documentation

Base URL: `http://localhost:3024` (or your configured `PORT`)

### Health Check

**GET** `/health`

Check if the server is running.

**Response:**
```json
{
  "status": "ok",
  "time": "2026-01-29T12:00:00.000Z"
}
```

---

### Authentication Endpoints

#### Sign Up

**POST** `/signUp`

Register a new user with email and password. Sends OTP to email if email confirmation is enabled.

**Request Body:**
```json
{
  "email": "user@example.com",
  "password": "securePassword123",
  "data": {  // Optional: user metadata
    "display_name": "John Doe"
  }
}
```

**Response:**
```json
{
  "status": "ok",
  "message": "Signup successful. Please verify OTP sent to email.",
  "data": {
    "user": { ... },
    "session": null  // Session created after OTP verification
  }
}
```

---

#### Verify Sign-Up OTP

**POST** `/signUpVerify`

Verify the OTP code sent to the user's email after signup.

**Request Body:**
```json
{
  "email": "user@example.com",
  "token": "123456",
  "type": "signup"  // Optional: "signup" (default), "magiclink", "recovery"
}
```

**Response:**
```json
{
  "status": "ok",
  "message": "Email verified successfully",
  "session": {
    "access_token": "...",
    "refresh_token": "...",
    "user": { ... }
  },
  "user": { ... }
}
```

---

#### Resend OTP

**POST** `/resendOtp`

Resend a new OTP code to the user's email. Invalidates the previous OTP.

**Request Body:**
```json
{
  "email": "user@example.com"
}
```

**Response:**
```json
{
  "status": "ok",
  "message": "OTP resent successfully",
  "data": { ... }
}
```

---

#### Sign In

**POST** `/signIn`

Authenticate a user with email and password.

**Request Body:**
```json
{
  "email": "user@example.com",
  "password": "securePassword123"
}
```

**Response:**
```json
{
  "user": { ... },
  "session": {
    "access_token": "...",
    "refresh_token": "...",
    "user": { ... }
  }
}
```

---

#### Google OAuth Sign In

**GET** `/gglSignIn`

Initiate Google OAuth authentication flow.

**Query Parameters:**
- `redirectTo` (optional): URL to redirect after authentication

**Example:**
```
GET /gglSignIn?redirectTo=https://your-app.com/callback
```

**Response:**
```json
{
  "url": "https://accounts.google.com/oauth/authorize?..."
}
```

---

### Password Reset Flow

#### Request Password Reset

**POST** `/forgtPss`

Request a password reset email. **Validates user exists** before sending email.

**Request Body:**
```json
{
  "email": "user@example.com",
  "redirectTo": "https://your-app.com/reset-password"  // Optional
}
```

**Response:**
```json
{
  "status": "ok",
  "data": { ... }
}
```

**Error (if user doesn't exist):**
```json
{
  "error": "User does not exist"
}
```

---

#### Verify Reset Password OTP

**POST** `/resetPssVerify`

Verify the OTP token from reset email and set a new password.

**Request Body:**
```json
{
  "email": "user@example.com",
  "token": "123456",  // OTP from email ({{ .Token }})
  "newPassword": "newSecurePassword123"
}
```

**Response:**
```json
{
  "status": "ok",
  "message": "Password reset successfully",
  "session": {
    "access_token": "...",
    "refresh_token": "...",
    "user": { ... }
  },
  "user": { ... }
}
```

---

### User Management Endpoints

#### Get User (by Access Token)

**GET** `/getUsr`

Get user information using an access token from sign-in or OTP verification.

**Headers:**
```
Authorization: Bearer <access_token>
```

**Response:**
```json
{
  "user": {
    "id": "...",
    "email": "user@example.com",
    ...
  }
}
```

---

#### Get User (by Email) - Admin Only

**GET** `/getUsr?email=user@example.com`

Get user information by email. **Requires `SUPABASE_SERVICE_ROLE_KEY`**.

**Query Parameters:**
- `email`: User's email address

**Response:**
```json
[
  {
    "id": "...",
    "email": "user@example.com",
    ...
  }
]
```

---

#### Check User Exists

**POST** `/usrExst`

Check if a user exists by email. **No admin key required** - uses a clever signup-trick method.

**Request Body:**
```json
{
  "email": "user@example.com"
}
```

**Response:**
```json
{
  "exists": true,
  "data": null
}
```

**How it works:**
Attempts a signup with a random password. If `user_metadata` and `identities` are empty/null → user exists. If they have values → new user (doesn't exist).

---

## 🧪 Testing

### Using the Built-in Web UI

1. Start the server: `npm run dev`
2. Open **http://localhost:3024**
3. Fill in the form fields and click **Run** on any endpoint
4. View responses in real-time below each card

### Using curl

See [`curl_testing_guide.md`](./curl_testing_guide.md) for complete curl examples.

**Quick examples:**

```bash
# Health check
curl http://localhost:3024/health

# Sign up
curl -X POST http://localhost:3024/signUp \
  -H "Content-Type: application/json" \
  -d '{"email":"test@example.com","password":"password123"}'

# Sign in
curl -X POST http://localhost:3024/signIn \
  -H "Content-Type: application/json" \
  -d '{"email":"test@example.com","password":"password123"}'
```

**Windows PowerShell:**
```powershell
# Use curl.exe and single quotes for JSON
curl.exe -X POST http://localhost:3024/signUp `
  -H "Content-Type: application/json" `
  -d '{"email":"test@example.com","password":"password123"}'
```

### Using Postman

Import [`supabase_server.postman_collection.json`](./supabase_server.postman_collection.json) into Postman:

1. Open Postman
2. Click **Import**
3. Select `supabase_server.postman_collection.json`
4. All endpoints are ready to test!

---

## 📁 Project Structure

```
Supabase/Auth/
├── supabase_server.js          # Main server file (all endpoints)
├── package.json                 # Dependencies and scripts
├── env.example                  # Environment variables template
├── .env                         # Your actual env vars (gitignored)
├── .gitignore                   # Git ignore rules
├── README.md                    # This file
├── curl_testing_guide.md        # curl examples
├── supabase_server.postman_collection.json  # Postman collection
└── public/
    └── index.html               # Built-in API tester UI
```

---

## 🔧 Configuration

### Environment Variables

| Variable | Required | Description |
|----------|----------|-------------|
| `SUPABASE_URL` | ✅ Yes | Your Supabase project URL |
| `SUPABASE_ANON_KEY` | ✅ Yes | Supabase anonymous/public key |
| `SUPABASE_SERVICE_ROLE_KEY` | ❌ No | Service role key (for admin endpoints) |
| `PORT` | ❌ No | Server port (default: `3024`) |

### Scripts

```bash
npm run build    # Syntax check the server file
npm start        # Start server (production)
npm run dev      # Start server with auto-reload (development)
```

---

## 🔐 Security Notes

- **Never commit `.env`** - It's in `.gitignore` for a reason!
- **Service Role Key** - Keep `SUPABASE_SERVICE_ROLE_KEY` secret. Only use for admin endpoints.
- **CORS** - Currently enabled for all origins. Restrict in production if needed.
- **Password Reset** - User existence is validated before sending reset emails to prevent email enumeration.

---

## 🎯 Use Cases

- **Backend API** - Use as a middleware/auth layer for your frontend apps
- **Mobile Apps** - REST API for React Native, Flutter, etc.
- **Microservices** - Authentication service in a microservices architecture
- **Testing** - Quick way to test Supabase auth flows
- **Prototyping** - Fast setup for auth in new projects

---

## 🚧 Common Workflows

### Complete Signup Flow

1. **POST** `/signUp` → User receives OTP email
2. **POST** `/signUpVerify` → User enters OTP, gets session
3. **GET** `/getUsr` (with Bearer token) → Get user info

### Password Reset Flow

1. **POST** `/forgtPss` → User receives reset email with `{{ .Token }}`
2. **POST** `/resetPssVerify` → User enters token + new password
3. User is authenticated with new session

### Check Before Signup

1. **POST** `/usrExst` → Check if email already registered
2. If `exists: false` → Proceed with signup
3. If `exists: true` → Show "Email already in use"

---

## 🐛 Troubleshooting

### "SUPABASE_URL or SUPABASE_ANON_KEY missing"

- Check your `.env` file exists and has correct values
- Ensure no extra spaces or quotes around values

### "User does not exist" on password reset

- This is intentional! The endpoint validates user exists before sending email
- Use `/usrExst` to check if user exists first

### CORS errors

- Server has CORS enabled by default
- If issues persist, check browser console for specific error

### Port already in use

- Change `PORT` in `.env` to a different port (e.g., `3025`)
- Or stop the process using port `3024`

### Email rate limit exceeded

- Supabase rate-limits email sending (OTP, password reset, etc.) to prevent abuse
- **Error message:** `"Email rate limit exceeded"` or similar
- **Solution:** 
  - Wait a few minutes before retrying
  - **Configure email via custom SMTP** in Supabase Dashboard → Settings → Auth → SMTP Settings to use your own email provider and bypass rate limits
- **Prevention:** Avoid rapid successive requests to `/signUp`, `/resendOtp`, or `/forgtPss` with the same email
- **Note:** Rate limits vary by Supabase plan (free tier has stricter limits)

---

## 📝 License

ISC

---

## 🤝 Contributing

Feel free to submit issues, fork, and create pull requests!

---

## 📚 Additional Resources

- [Supabase Documentation](https://supabase.com/docs)
- [Supabase Auth Guide](https://supabase.com/docs/guides/auth)
- [Express.js Documentation](https://expressjs.com/)

---

## ⭐ Features Highlights

- ✅ **Zero dependencies** beyond core packages
- ✅ **Single file server** - Easy to understand and modify
- ✅ **Built-in tester** - No external tools needed
- ✅ **Production-ready** - Error handling, validation, CORS
- ✅ **Well-documented** - README, curl guide, Postman collection
- ✅ **Smart user check** - No admin key needed for existence check

---

**Made with ❤️ for the Supabase community**
