// Prevent Google OAuth warnings from uninitialized client id during auth route tests.
process.env.GOOGLE_CLIENT_ID ||= "jest-google-client-id.apps.googleusercontent.com";
