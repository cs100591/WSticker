/**
 * Secure Storage Property Tests
 * 
 * Property 3: Token storage after successful login
 * Property 70: Secure token storage
 * Property 5: Logout clears authentication state
 * Property 53: Logout data clearing
 * Property 4: Auto-authentication with valid tokens
 * Property 74: Biometric verification on launch
 * 
 * These tests validate the secure storage service behavior using property-based testing
 * with fast-check to ensure correctness across a wide range of inputs.
 */

import * as fc from 'fast-check';

// Mock SecureStore
const mockSetItemAsync = jest.fn();
const mockGetItemAsync = jest.fn();
const mockDeleteItemAsync = jest.fn();

jest.mock('expo-secure-store', () => ({
  setItemAsync: (...args: unknown[]) => mockSetItemAsync(...args),
  getItemAsync: (...args: unknown[]) => mockGetItemAsync(...args),
  deleteItemAsync: (...args: unknown[]) => mockDeleteItemAsync(...args),
}));

// Import after mocking
import { secureStorage } from '../secureStorage';

// Arbitraries for generating test data

// JWT-like token arbitrary
const tokenArb = fc.tuple(
  fc.stringMatching(/^[A-Za-z0-9]{20,40}$/),
  fc.stringMatching(/^[A-Za-z0-9]{50,100}$/),
  fc.stringMatching(/^[A-Za-z0-9]{20,40}$/)
).map(([header, payload, signature]) => `${header}.${payload}.${signature}`);

// Refresh token arbitrary
const refreshTokenArb = fc.stringMatching(/^[A-Za-z0-9_-]{40,80}$/);

// Boolean arbitrary for biometric settings
const booleanArb = fc.boolean();

describe('Secure Storage Property Tests', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('Property 3 & 70: Token storage after successful login', () => {
    it('should store auth tokens securely for any valid token', async () => {
      const testCases = fc.sample(tokenArb, 50);
      
      for (const token of testCases) {
        jest.clearAllMocks();
        mockSetItemAsync.mockResolvedValueOnce(undefined);

        await secureStorage.saveAuthToken(token);

        // Verify SecureStore was called with correct key and token
        expect(mockSetItemAsync).toHaveBeenCalledWith('auth_token', token);
        expect(mockSetItemAsync).toHaveBeenCalledTimes(1);
      }
    });

    it('should store refresh tokens securely for any valid token', async () => {
      const testCases = fc.sample(refreshTokenArb, 50);
      
      for (const token of testCases) {
        jest.clearAllMocks();
        mockSetItemAsync.mockResolvedValueOnce(undefined);

        await secureStorage.saveRefreshToken(token);

        // Verify SecureStore was called with correct key and token
        expect(mockSetItemAsync).toHaveBeenCalledWith('refresh_token', token);
        expect(mockSetItemAsync).toHaveBeenCalledTimes(1);
      }
    });

    it('should retrieve stored auth tokens correctly', async () => {
      const testCases = fc.sample(tokenArb, 30);
      
      for (const token of testCases) {
        jest.clearAllMocks();
        mockGetItemAsync.mockResolvedValueOnce(token);

        const result = await secureStorage.getAuthToken();

        expect(result).toBe(token);
        expect(mockGetItemAsync).toHaveBeenCalledWith('auth_token');
      }
    });

    it('should retrieve stored refresh tokens correctly', async () => {
      const testCases = fc.sample(refreshTokenArb, 30);
      
      for (const token of testCases) {
        jest.clearAllMocks();
        mockGetItemAsync.mockResolvedValueOnce(token);

        const result = await secureStorage.getRefreshToken();

        expect(result).toBe(token);
        expect(mockGetItemAsync).toHaveBeenCalledWith('refresh_token');
      }
    });

    it('should return null when no auth token is stored', async () => {
      for (let i = 0; i < 10; i++) {
        jest.clearAllMocks();
        mockGetItemAsync.mockResolvedValueOnce(null);

        const result = await secureStorage.getAuthToken();

        expect(result).toBeNull();
      }
    });

    it('should handle storage errors gracefully', async () => {
      const testCases = fc.sample(tokenArb, 10);
      
      for (const token of testCases) {
        jest.clearAllMocks();
        mockSetItemAsync.mockRejectedValueOnce(new Error('Storage error'));

        await expect(secureStorage.saveAuthToken(token)).rejects.toThrow('Storage error');
      }
    });

    it('should handle retrieval errors gracefully', async () => {
      for (let i = 0; i < 10; i++) {
        jest.clearAllMocks();
        mockGetItemAsync.mockRejectedValueOnce(new Error('Retrieval error'));

        const result = await secureStorage.getAuthToken();

        // Should return null on error, not throw
        expect(result).toBeNull();
      }
    });
  });

  describe('Property 5 & 53: Logout clears authentication state', () => {
    it('should clear all auth tokens on logout', async () => {
      for (let i = 0; i < 20; i++) {
        jest.clearAllMocks();
        mockDeleteItemAsync.mockResolvedValue(undefined);

        await secureStorage.clearAuthTokens();

        // Verify both tokens are deleted (order may vary due to Promise.all)
        expect(mockDeleteItemAsync).toHaveBeenCalledWith('auth_token');
        expect(mockDeleteItemAsync).toHaveBeenCalledWith('refresh_token');
        expect(mockDeleteItemAsync).toHaveBeenCalledTimes(2);
      }
    });

    it('should clear all secure storage data', async () => {
      for (let i = 0; i < 20; i++) {
        jest.clearAllMocks();
        mockDeleteItemAsync.mockResolvedValue(undefined);

        await secureStorage.clearAll();

        // Verify all keys are deleted (order may vary due to Promise.all)
        expect(mockDeleteItemAsync).toHaveBeenCalledWith('auth_token');
        expect(mockDeleteItemAsync).toHaveBeenCalledWith('refresh_token');
        expect(mockDeleteItemAsync).toHaveBeenCalledWith('biometric_enabled');
        expect(mockDeleteItemAsync).toHaveBeenCalledTimes(3);
      }
    });

    it('should handle clear errors gracefully', async () => {
      for (let i = 0; i < 10; i++) {
        jest.clearAllMocks();
        // All calls will reject since Promise.all is used
        mockDeleteItemAsync.mockRejectedValue(new Error('Delete error'));

        await expect(secureStorage.clearAuthTokens()).rejects.toThrow('Delete error');
      }
    });
  });

  describe('Property 4: Auto-authentication with valid tokens', () => {
    it('should return stored token for auto-authentication', async () => {
      const testCases = fc.sample(tokenArb, 30);
      
      for (const token of testCases) {
        jest.clearAllMocks();
        mockGetItemAsync.mockResolvedValueOnce(token);

        const storedToken = await secureStorage.getAuthToken();

        // Token should be available for auto-auth
        expect(storedToken).toBe(token);
        expect(storedToken).not.toBeNull();
        expect(storedToken!.length).toBeGreaterThan(0);
      }
    });

    it('should return null when no token exists (requires manual login)', async () => {
      for (let i = 0; i < 10; i++) {
        jest.clearAllMocks();
        mockGetItemAsync.mockResolvedValueOnce(null);

        const storedToken = await secureStorage.getAuthToken();

        // No token means user needs to login manually
        expect(storedToken).toBeNull();
      }
    });
  });

  describe('Property 74: Biometric verification settings', () => {
    it('should store biometric preference correctly for any boolean value', async () => {
      const testCases = fc.sample(booleanArb, 30);
      
      for (const enabled of testCases) {
        jest.clearAllMocks();
        mockSetItemAsync.mockResolvedValueOnce(undefined);

        await secureStorage.setBiometricEnabled(enabled);

        expect(mockSetItemAsync).toHaveBeenCalledWith(
          'biometric_enabled',
          enabled.toString()
        );
      }
    });

    it('should retrieve biometric preference correctly when enabled', async () => {
      for (let i = 0; i < 10; i++) {
        jest.clearAllMocks();
        mockGetItemAsync.mockResolvedValueOnce('true');

        const result = await secureStorage.isBiometricEnabled();

        expect(result).toBe(true);
      }
    });

    it('should retrieve biometric preference correctly when disabled', async () => {
      for (let i = 0; i < 10; i++) {
        jest.clearAllMocks();
        mockGetItemAsync.mockResolvedValueOnce('false');

        const result = await secureStorage.isBiometricEnabled();

        expect(result).toBe(false);
      }
    });

    it('should default to false when no preference is stored', async () => {
      for (let i = 0; i < 10; i++) {
        jest.clearAllMocks();
        mockGetItemAsync.mockResolvedValueOnce(null);

        const result = await secureStorage.isBiometricEnabled();

        expect(result).toBe(false);
      }
    });

    it('should default to false on retrieval error', async () => {
      for (let i = 0; i < 10; i++) {
        jest.clearAllMocks();
        mockGetItemAsync.mockRejectedValueOnce(new Error('Error'));

        const result = await secureStorage.isBiometricEnabled();

        expect(result).toBe(false);
      }
    });
  });

  describe('Token Round-Trip Property', () => {
    it('should maintain token integrity through save and retrieve cycle', async () => {
      const testCases = fc.sample(fc.tuple(tokenArb, refreshTokenArb), 30);
      
      for (const [authToken, refreshToken] of testCases) {
        jest.clearAllMocks();
        
        // Simulate storage
        const storage: Record<string, string> = {};
        
        mockSetItemAsync.mockImplementation(async (key: string, value: string) => {
          storage[key] = value;
        });
        
        mockGetItemAsync.mockImplementation(async (key: string) => {
          return storage[key] || null;
        });

        // Save tokens
        await secureStorage.saveAuthToken(authToken);
        await secureStorage.saveRefreshToken(refreshToken);

        // Retrieve tokens
        const retrievedAuth = await secureStorage.getAuthToken();
        const retrievedRefresh = await secureStorage.getRefreshToken();

        // Verify integrity
        expect(retrievedAuth).toBe(authToken);
        expect(retrievedRefresh).toBe(refreshToken);
      }
    });
  });
});
