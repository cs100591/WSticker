/**
 * Login Screen
 * Allows users to sign in with email and password
 * Design matches web app
 */

import React, { useState, useContext } from 'react';
import {
  View,
  Text,
  StyleSheet,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  Alert,
  TouchableOpacity,
  Image,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { Input } from '@/components/Input';
import { Button } from '@/components/Button';
import { AppleSignInButton } from '@/components/AppleSignInButton';
import { GoogleSignInButton } from '@/components/GoogleSignInButton';
import { loginSchema, LoginFormData } from '@/utils/validation';
import { authService } from '@/services/authService';

import { colors, spacing, borderRadius, shadows } from '@/theme/colors';

import { useEffectiveLanguage, translations } from '@/store/languageStore';

interface LoginScreenProps {
  navigation?: any;
}

export const LoginScreen: React.FC<LoginScreenProps> = ({ navigation }) => {
  const [isLoading, setIsLoading] = useState(false);
  const currentLang = useEffectiveLanguage();
  const t = translations[currentLang];

  const {
    control,
    handleSubmit,
    formState: { errors },
  } = useForm<LoginFormData>({
    resolver: zodResolver(loginSchema),
    defaultValues: {
      email: '',
      password: '',
    },
  });

  const onSubmit = async (data: LoginFormData) => {
    setIsLoading(true);

    const result = await authService.signIn({
      email: data.email,
      password: data.password,
    });

    setIsLoading(false);

    if (!result.success) {
      Alert.alert('Login Failed', result.error || 'Please try again');
    } else {
      handleLoginSuccess();
    }
  };

  const handleLoginSuccess = async () => {
    // Sync Logic: Check if we need to merge or wipe
    try {
      const { data: { session } } = await import('@/services/supabase').then(m => m.supabase.auth.getSession());
      if (session?.user) {
        // Perform the smart first sync
        const { syncManager } = await import('@/services/sync/SyncManager');
        await syncManager.handleFirstSync(session.user.id);
      }
    } catch (e) {
      console.error('First sync failed:', e);
    }

    // Login successful
    // If we are in the AuthenticatedStack (e.g. guest upgrading), we need to manually navigate
    // Only do this if we were explicitly sent here from an authenticated context (isUpgrade)
    // Otherwise, let App.tsx handle the auth state change to switch stacks
    const isUpgrade = (navigation?.getState()?.routes?.find((r: any) => r.name === 'Login')?.params as any)?.isUpgrade;

    if (navigation && isUpgrade) {
      // Reset navigation stack to ensure we don't go "back" to login
      navigation.reset({
        index: 0,
        routes: [{ name: 'MainTabs' }],
      });
    }
  };


  return (
    <LinearGradient
      colors={['#EFF6FF', '#DBEAFE', '#BFDBFE']}
      style={styles.gradient}
    >
      <KeyboardAvoidingView
        style={styles.container}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      >
        <ScrollView
          contentContainerStyle={styles.scrollContent}
          keyboardShouldPersistTaps="handled"
        >
          {/* Logo/Brand Section */}
          <View style={styles.brandSection}>
            <Image
              source={require('../../assets/icon.png')}
              style={styles.logoImage}
            />
            <Text style={styles.brandTagline}>{t.aiAssistant || 'Your Virtual Personal Assistant'}</Text>
          </View>

          {/* Login Card */}
          <View style={styles.card}>
            <View style={styles.header}>
              <Text style={styles.title}>Welcome Back</Text>
              <Text style={styles.subtitle}>Sign in to continue</Text>
            </View>

            <View style={styles.form}>
              <Controller
                control={control}
                name="email"
                render={({ field: { onChange, onBlur, value } }) => (
                  <Input
                    label="Email"
                    placeholder="Enter your email"
                    value={value}
                    onChangeText={onChange}
                    onBlur={onBlur}
                    error={errors.email?.message}
                    keyboardType="email-address"
                    autoCapitalize="none"
                    autoComplete="email"
                  />
                )}
              />

              <Controller
                control={control}
                name="password"
                render={({ field: { onChange, onBlur, value } }) => (
                  <Input
                    label="Password"
                    placeholder="Enter your password"
                    value={value}
                    onChangeText={onChange}
                    onBlur={onBlur}
                    error={errors.password?.message}
                    secureTextEntry={true}
                    autoCapitalize="none"
                    autoComplete="password"
                  />
                )}
              />

              <TouchableOpacity
                onPress={() => navigation?.navigate('ForgotPassword')}
                style={styles.forgotPassword}
              >
                <Text style={styles.forgotPasswordText}>Forgot Password?</Text>
              </TouchableOpacity>

              <Button
                title="Sign In"
                onPress={handleSubmit(onSubmit)}
                loading={isLoading}
              />

              {/* Sign in with Apple (iOS only) */}
              <View style={styles.divider}>
                <View style={styles.dividerLine} />
                <Text style={styles.dividerText}>OR</Text>
                <View style={styles.dividerLine} />
              </View>

              <AppleSignInButton
                onSuccess={handleLoginSuccess}
                onError={(error) => {
                  if (!error.includes('cancelled')) {
                    Alert.alert('Sign In Failed', error);
                  }
                }}
              />

              <GoogleSignInButton
                onSuccess={handleLoginSuccess}
                onError={(error) => {
                  // Error handled in component
                }}
              />



              <View style={styles.footer}>
                <Text style={styles.footerText}>Don't have an account? </Text>
                <TouchableOpacity onPress={() => navigation?.navigate('Register')}>
                  <Text style={styles.footerLink}>Sign Up</Text>
                </TouchableOpacity>
              </View>
            </View>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </LinearGradient>
  );
};

const styles = StyleSheet.create({
  gradient: {
    flex: 1,
  },
  container: {
    flex: 1,
  },
  scrollContent: {
    flexGrow: 1,
    justifyContent: 'center',
    padding: spacing.lg,
  },
  brandSection: {
    alignItems: 'center',
    marginBottom: spacing.xl,
  },
  logoImage: {
    width: 100,
    height: 100,
    borderRadius: 20,
    marginBottom: spacing.md,
    ...shadows.lg,
  },
  brandTagline: {
    fontSize: 16,
    color: colors.text.secondary.light,
    fontWeight: '500',
  },
  card: {
    backgroundColor: colors.card.light,
    borderRadius: borderRadius.lg,
    padding: spacing.lg,
    ...shadows.lg,
  },
  header: {
    marginBottom: spacing.lg,
  },
  title: {
    fontSize: 28,
    fontWeight: '700',
    color: colors.text.primary.light,
    marginBottom: spacing.xs,
  },
  subtitle: {
    fontSize: 16,
    color: colors.text.secondary.light,
  },
  form: {
    width: '100%',
  },
  forgotPassword: {
    alignSelf: 'flex-end',
    marginBottom: spacing.md,
    marginTop: -spacing.xs,
  },
  forgotPasswordText: {
    color: colors.primary[500],
    fontSize: 14,
    fontWeight: '600',
  },
  divider: {
    flexDirection: 'row',
    alignItems: 'center',
    marginVertical: spacing.lg,
  },
  dividerLine: {
    flex: 1,
    height: 1,
    backgroundColor: colors.border.light,
  },
  dividerText: {
    marginHorizontal: spacing.md,
    fontSize: 14,
    color: colors.text.muted.light,
    fontWeight: '600',
  },

  footer: {
    flexDirection: 'row',
    justifyContent: 'center',
    marginTop: spacing.lg,
  },
  footerText: {
    fontSize: 14,
    color: colors.text.secondary.light,
  },
  footerLink: {
    fontSize: 14,
    color: colors.primary[500],
    fontWeight: '600',
  },
});
