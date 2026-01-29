# Supabase Server API: curl Testing Guide

This guide shows how to test each endpoint in your Node.js Supabase server using `curl`.

**Windows (PowerShell):** Use `curl.exe` and single quotes for JSON so the payload is not mangled. If `curl` fails, run: `curl.exe -X POST ...` explicitly.

Base URL:
http://localhost:3024

1. Health Check

Endpoint: GET /health

```
curl http://localhost:3024/health
```

2. Sign Up (Email + Password)

Endpoint: POST /signUp

This sends an OTP to the user's email (if email confirmation is enabled). Optional: `data` for user metadata.

```
curl -X POST http://localhost:3024/signUp -H "Content-Type: application/json" -d '{"email":"test@example.com","password":"yourpassword"}'
```

With optional user metadata:
```
curl -X POST http://localhost:3024/signUp -H "Content-Type: application/json" -d '{"email":"test@example.com","password":"yourpassword","data":{"display_name":"Test"}}'
```

3. Verify Sign-Up OTP

Endpoint: POST /signUpVerify

Use the OTP received by email.

```
curl -X POST http://localhost:3024/signUpVerify -H "Content-Type: application/json" -d '{"email":"test@example.com","token":"123456","type":"signup"}'
```

type values (optional): signup (default), magiclink, recovery

4. Resend OTP (Email)

Endpoint: POST /resendOtp

Re-sends a new OTP and invalidates the old one.

```
curl -X POST http://localhost:3024/resendOtp -H "Content-Type: application/json" -d '{"email":"test@example.com"}'
```

5. Sign In

Endpoint: POST /signIn

```
curl -X POST http://localhost:3024/signIn -H "Content-Type: application/json" -d '{"email":"test@example.com","password":"yourpassword"}'
```

6. Google OAuth Sign In

Endpoint: GET /gglSignIn

```
curl "http://localhost:3024/gglSignIn?redirectTo=https://your-app.com/callback"
```

7. Forgot Password

Endpoint: POST /forgtPss

Optional: `redirectTo` – URL to send user after reset.

```
curl -X POST http://localhost:3024/forgtPss -H "Content-Type: application/json" -d '{"email":"test@example.com"}'
```

With redirect URL:
```
curl -X POST http://localhost:3024/forgtPss -H "Content-Type: application/json" -d '{"email":"test@example.com","redirectTo":"https://your-app.com/reset-password"}'
```

8. Reset Password OTP Verify

Endpoint: POST /resetPssVerify

After requesting a reset (Forgot Password), user receives an email with `{{ .Token }}`. Send that token plus the new password to complete the reset.

```
curl -X POST http://localhost:3024/resetPssVerify -H "Content-Type: application/json" -d '{"email":"test@example.com","token":"123456","newPassword":"newSecurePassword123"}'
```

9. Get User (by access token)

Endpoint: GET /getUsr
Header: Authorization: Bearer <access_token>

```
curl http://localhost:3024/getUsr -H "Authorization: Bearer <access_token>"
```

10. Get User (by email – admin only)

Endpoint: GET /getUsr?email=...
Requires: SUPABASE_SERVICE_ROLE_KEY

```
curl "http://localhost:3024/getUsr?email=test@example.com"
```

11. User Exists

Endpoint: POST /usrExst

Checks if a user exists by attempting a signup (no admin key required).

```
curl -X POST http://localhost:3024/usrExst -H "Content-Type: application/json" -d '{"email":"test@example.com"}'
```

Notes

Replace test@example.com and yourpassword with real credentials.

OTP is automatically invalidated when a new one is sent.

Supabase rate-limits OTP resend internally.

Admin endpoint (/getUsr?email=) requires SUPABASE_SERVICE_ROLE_KEY in .env.

Google OAuth requires a valid callback URL.

Access tokens come from /signIn or /signUpVerify.
