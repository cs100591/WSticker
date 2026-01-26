import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import AsyncStorage from '@react-native-async-storage/async-storage';

interface UserProfile {
    id: string;
    email: string;
    fullName: string;
    avatarUrl?: string;
}

interface UserState {
    profile: UserProfile;
    updateProfile: (updates: Partial<UserProfile>) => void;
    resetProfile: () => void;
}

const DEFAULT_PROFILE: UserProfile = {
    id: 'guest_user',
    email: 'guest@dailypa.app',
    fullName: 'Guest User',
};

export const useUserStore = create<UserState>()(
    persist(
        (set) => ({
            profile: DEFAULT_PROFILE,
            updateProfile: (updates) =>
                set((state) => ({
                    profile: { ...state.profile, ...updates },
                })),
            resetProfile: () => set({ profile: DEFAULT_PROFILE }),
        }),
        {
            name: 'user-storage',
            storage: createJSONStorage(() => AsyncStorage),
        }
    )
);
