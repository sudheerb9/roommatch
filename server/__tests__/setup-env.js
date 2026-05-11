// Must run via jest.config setupFiles — before config/authToken loads.
process.env.AUTH_JWT_SECRET = process.env.AUTH_JWT_SECRET || "jest-test-jwt-secret-min-32chars-ok";
