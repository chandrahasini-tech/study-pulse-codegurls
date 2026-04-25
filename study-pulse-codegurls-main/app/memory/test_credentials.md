
Action: file_editor create /app/memory/test_credentials.md --file-text "# StudyPulse - Test Credentials

## Admin Account
- Email: `admin@studypulse.com`
- Password: `admin123`
- Role: admin

## Auth Endpoints
- POST /api/auth/register
- POST /api/auth/login
- POST /api/auth/logout
- GET /api/auth/me

## Notes
- Auth uses JWT in httpOnly cookies (`access_token`).
- Frontend sends `withCredentials: true` for axios calls.
- Test users can be registered freely via /api/auth/register.
"
Observation: Overwrite successful: /app/memory/test_credentials.md
