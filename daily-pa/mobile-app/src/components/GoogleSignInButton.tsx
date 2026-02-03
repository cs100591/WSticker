import React, { useState } from 'react';
import { FONTS } from '@/theme/fonts';
import { StyleSheet, View, Text, TouchableOpacity, Image, Platform, Alert, ActivityIndicator } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import * as WebBrowser from 'expo-web-browser';
import * as Linking from 'expo-linking';
import { makeRedirectUri } from 'expo-auth-session';
import { supabase } from '@/services/supabase';

import Constants from 'expo-constants';

// Handle redirect back to app
WebBrowser.maybeCompleteAuthSession();

interface GoogleSignInButtonProps {
    onSuccess?: () => void;
    onError?: (error: string) => void;
}

export const GoogleSignInButton: React.FC<GoogleSignInButtonProps> = ({
    onSuccess,
    onError,
}) => {
    const [isLoading, setIsLoading] = useState(false);

    const handleSignIn = async () => {
        try {
            setIsLoading(true);

            // AUTO-DETECTION of environment
            // Expo Go: Use default 'exp' scheme (undefined)
            // Native/Dev Build: Use 'dailypa' scheme
            const isExpoGo = Constants.appOwnership === 'expo';
            const isStandalone = Constants.executionEnvironment === 'standalone';

            // In standalone builds, always use the custom scheme
            const redirectUrl = makeRedirectUri({
                scheme: isStandalone ? 'dailypa' : (isExpoGo ? undefined : 'dailypa'),
                path: 'auth/callback',
            });

            console.log('----------------------------------------------------');
            console.log('Google Sign-In Redirect URL:', redirectUrl);
            console.log('Environment:', { isExpoGo, isStandalone, appOwnership: Constants.appOwnership, executionEnvironment: Constants.executionEnvironment });

            // Check if running in standard Expo Go (not Dev Client)
            if (isExpoGo) {
                console.log('Running in Expo Go. Using standard exp:// scheme.');
                // Optional: Alert user to add this URL to Supabase if they haven't
            }

            const { data, error } = await supabase.auth.signInWithOAuth({
                provider: 'google',
                options: {
                    redirectTo: redirectUrl,
                    skipBrowserRedirect: true,
                    queryParams: {
                        access_type: 'offline',
                        prompt: 'consent',
                    },
                },
            });

            if (error) throw error;
            if (!data?.url) throw new Error('No auth URL returned');

            console.log('Opening auth session with URL:', data.url);
            const result = await WebBrowser.openAuthSessionAsync(data.url, redirectUrl);

            if (result.type === 'success' && result.url) {
                // Process auth result asynchronously to prevent UI lag
                setTimeout(async () => {
                    try {
                        const url = result.url;
                        const params = extractParamsFromUrl(url);

                        if (params.access_token && params.refresh_token) {
                            const { error: sessionError } = await supabase.auth.setSession({
                                access_token: params.access_token,
                                refresh_token: params.refresh_token,
                            });
                            if (sessionError) throw sessionError;
                            onSuccess?.();
                        } else if (params.code) {
                            console.log('Auth Code returned, assuming handled by Supabase or needs exchange.');
                            // If using PKCE, we might need to exchange code here, but signInWithOAuth usually handles it or returns session tokens in implicit flow
                        } else {
                            if (params.error) throw new Error(params.error_description || params.error);
                        }
                    } catch (error) {
                        console.error('Session setup error:', error);
                        const errorMessage = error instanceof Error ? error.message : 'Session setup failed';
                        onError?.(errorMessage);
                        Alert.alert('Sign In Failed', errorMessage);
                    } finally {
                        setIsLoading(false);
                    }
                }, 100); // Small delay to let browser close smoothly
            } else if (result.type === 'cancel') {
                // User cancelled
                console.log('User cancelled the login');
                setIsLoading(false);
            } else {
                setIsLoading(false);
            }
        } catch (error) {
            console.error('Google Sign In Error:', error);
            console.error('Error stack:', (error as any)?.stack);

            const errorMessage = error instanceof Error ? error.message : 'Google Sign In failed';
            onError?.(errorMessage);

            // Don't show alert for user cancellation
            if (errorMessage !== 'User cancelled the login process') {
                Alert.alert('Google Sign In Failed', errorMessage);
            }
        } finally {
            setIsLoading(false);
        }
    };

    const extractParamsFromUrl = (url: string) => {
        const params: Record<string, string> = {};
        // Check both query and fragment
        const queryIdx = url.indexOf('?');
        const fragmentIdx = url.indexOf('#');

        let parts: string[] = [];

        if (queryIdx !== -1) {
            const endIdx = fragmentIdx !== -1 ? fragmentIdx : url.length;
            parts = parts.concat(url.substring(queryIdx + 1, endIdx).split('&'));
        }
        if (fragmentIdx !== -1) {
            parts = parts.concat(url.substring(fragmentIdx + 1).split('&'));
        }

        parts.forEach(part => {
            const [key, value] = part.split('=');
            if (key && value) {
                params[key] = decodeURIComponent(value);
            }
        });

        return params;
    };

    return (
        <TouchableOpacity
            style={[styles.button, isLoading && styles.disabled]}
            onPress={handleSignIn}
            disabled={isLoading}
        >
            {isLoading ? (
                <>
                    <ActivityIndicator size="small" color="#374151" style={{ marginRight: 10 }} />
                    <Text style={styles.text}>Signing in...</Text>
                </>
            ) : (
                <>
                    {/* Google Logo */}
                    <View style={styles.iconContainer}>
                        <Ionicons name="logo-google" size={20} color="#374151" />
                    </View>
                    <Text style={styles.text}>Sign in with Google</Text>
                </>
            )}
        </TouchableOpacity>
    );
};

const styles = StyleSheet.create({
    button: {
        width: '100%',
        height: 50,
        backgroundColor: '#FFFFFF',
        borderRadius: 8,
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        marginTop: 12,
        borderWidth: 1,
        borderColor: '#E5E7EB',
        shadowColor: "#000",
        shadowOffset: {
            width: 0,
            height: 1,
        },
        shadowOpacity: 0.18,
        shadowRadius: 1.00,
        elevation: 1,
    },
    disabled: {
        opacity: 0.6,
    },
    iconContainer: {
        marginRight: 10,
    },
    text: {
        color: '#374151',
        fontSize: 16,
        fontFamily: FONTS.semiBold,
    },
});
