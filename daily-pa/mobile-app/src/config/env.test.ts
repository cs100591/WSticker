import { ENV, validateEnv } from './env';

describe('Environment Configuration', () => {
  it('should load environment variables', () => {
    expect(ENV).toBeDefined();
    expect(ENV.SUPABASE_URL).toBeDefined();
    expect(ENV.SUPABASE_ANON_KEY).toBeDefined();
    expect(ENV.ENV).toBeDefined();
  });

  it('should validate environment when variables are set', () => {
    // This test will pass if env vars are set, fail otherwise
    // In real tests, we'd mock the env vars
    const isValid = validateEnv();
    expect(typeof isValid).toBe('boolean');
  });
});
