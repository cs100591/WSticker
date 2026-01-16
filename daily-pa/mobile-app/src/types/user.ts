/**
 * User-related type definitions
 * Shared with web application
 */

export interface UserProfile {
  id: string;
  email: string;
  fullName?: string;
  avatarUrl?: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface UpdateProfileInput {
  fullName?: string;
  avatarUrl?: string;
}
