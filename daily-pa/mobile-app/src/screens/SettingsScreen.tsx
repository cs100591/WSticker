/**
 * Settings Screen
 * User profile and app settings
 */

import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Switch,
  Alert,
  Platform,
  TextInput,
  Modal,
} from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useAuth } from '@/hooks/useAuth';
import { calendarService, CalendarProvider } from '@/services/CalendarService';
import { notificationService } from '@/services/notificationService';
import { authService } from '@/services/authService';
import { biometricService } from '@/services/biometricService';
import { securityService } from '@/services/securityService';
import { ScreenHeader } from '@/components/ScreenHeader';
import { useLanguageStore, AppLanguage, translations } from '@/store/languageStore';
import { useCurrencyStore } from '@/store/currencyStore';

export const SettingsScreen: React.FC = React.memo(() => {
  const { user, signOut } = useAuth();
  const language = useLanguageStore((state) => state.language);
  const setLanguage = useLanguageStore((state) => state.setLanguage);
  const effectiveLang = useLanguageStore((state) => state.getEffectiveLanguage());
  const t = translations[effectiveLang];

  // Settings state
  const [biometricEnabled, setBiometricEnabled] = useState(false);
  const [notificationsEnabled, setNotificationsEnabled] = useState(true);
  const [theme, setTheme] = useState<'light' | 'dark' | 'system'>('system');
  const currency = useCurrencyStore((state) => state.currency);
  const setCurrency = useCurrencyStore((state) => state.setCurrency);
  const [calendarProvider, setCalendarProvider] = useState<CalendarProvider>('none');
  const [autoLockEnabled, setAutoLockEnabled] = useState(false);
  const [autoLockTimeout, setAutoLockTimeout] = useState(5); // in minutes
  const [loading, setLoading] = useState(true);

  // Profile edit modal state
  const [showEditModal, setShowEditModal] = useState(false);
  const [editFullName, setEditFullName] = useState('');
  const [saving, setSaving] = useState(false);

  // Password change modal state
  const [showPasswordModal, setShowPasswordModal] = useState(false);
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [changingPassword, setChangingPassword] = useState(false);

  // Load preferences on mount
  useEffect(() => {
    const loadPreferences = async () => {
      try {
        const provider = await calendarService.getSyncProvider();
        setCalendarProvider(provider);

        // Load notification preference
        const notifEnabled = await notificationService.areNotificationsEnabled();
        setNotificationsEnabled(notifEnabled);

        // Load biometric preference
        const biometricEnabled = await biometricService.isEnabled();
        setBiometricEnabled(biometricEnabled);

        // Load theme preference
        const savedTheme = await AsyncStorage.getItem('@theme_preference');
        if (savedTheme && (savedTheme === 'light' || savedTheme === 'dark' || savedTheme === 'system')) {
          setTheme(savedTheme);
        }

        // Currency is handled by persisted store

        // Load auto-lock settings
        const autoLockConfig = securityService.getAutoLockConfig();
        setAutoLockEnabled(autoLockConfig.autoLockEnabled);
        setAutoLockTimeout(autoLockConfig.autoLockTimeout / (60 * 1000)); // Convert ms to minutes
      } catch (error) {
        console.error('Failed to load preferences:', error);
      } finally {
        setLoading(false);
      }
    };

    loadPreferences();
  }, []);

  const handleSignOut = () => {
    Alert.alert(
      'Sign Out',
      'Are you sure you want to sign out?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Sign Out',
          style: 'destructive',
          onPress: signOut,
        },
      ]
    );
  };

  const handleBiometricToggle = async (value: boolean) => {
    try {
      if (value) {
        // Enable biometric - this will prompt for authentication
        const result = await biometricService.enable();
        if (result.success) {
          setBiometricEnabled(true);
          Alert.alert(
            'Biometric Authentication',
            'Biometric authentication enabled. You will be prompted to authenticate when opening the app.'
          );
        } else {
          Alert.alert(
            'Error',
            result.error || 'Failed to enable biometric authentication'
          );
        }
      } else {
        // Disable biometric
        await biometricService.disable();
        setBiometricEnabled(false);
        Alert.alert(
          'Biometric Authentication',
          'Biometric authentication disabled'
        );
      }
    } catch (error) {
      console.error('Failed to update biometric preference:', error);
      Alert.alert('Error', 'Failed to update biometric authentication');
    }
  };

  const handleNotificationsToggle = async (value: boolean) => {
    try {
      await notificationService.setNotificationsEnabled(value);
      setNotificationsEnabled(value);
      Alert.alert(
        'Notifications',
        value
          ? 'Notifications enabled. You will receive alerts for todos and events.'
          : 'Notifications disabled. You will not receive any alerts.'
      );
    } catch (error) {
      console.error('Failed to update notification preference:', error);
      Alert.alert('Error', 'Failed to update notification preference');
    }
  };

  const handleThemeChange = async (newTheme: 'light' | 'dark' | 'system') => {
    try {
      setTheme(newTheme);
      await AsyncStorage.setItem('@theme_preference', newTheme);
      Alert.alert('Theme', `Theme changed to ${newTheme}. Theme will be applied on next app restart.`);
    } catch (error) {
      console.error('Failed to save theme preference:', error);
      Alert.alert('Error', 'Failed to save theme preference');
    }
  };

  const handleCurrencyChange = () => {
    const currencies = [
      { code: 'USD', name: 'US Dollar' },
      { code: 'EUR', name: 'Euro' },
      { code: 'GBP', name: 'British Pound' },
      { code: 'JPY', name: 'Japanese Yen' },
      { code: 'CNY', name: 'Chinese Yuan' },
      { code: 'CAD', name: 'Canadian Dollar' },
      { code: 'AUD', name: 'Australian Dollar' },
      { code: 'MYR', name: 'Malaysian Ringgit' },
    ];

    const options = currencies.map((currency) => ({
      text: `${currency.code} - ${currency.name}`,
      onPress: async () => {
        try {
          setCurrency(currency.code);
          Alert.alert('Default Currency', `Default currency set to ${currency.code}`);
        } catch (error) {
          console.error('Failed to save currency preference:', error);
          Alert.alert('Error', 'Failed to save currency preference');
        }
      },
    }));

    options.push({ text: 'Cancel', onPress: async () => { } });

    Alert.alert('Select Default Currency', 'Choose your preferred currency for expenses', options);
  };

  const getLanguageLabel = () => {
    switch (language) {
      case 'en': return t.english;
      case 'zh': return t.chinese;
      case 'system': return t.followSystem;
      default: return t.followSystem;
    }
  };

  const handleLanguageChange = () => {
    const options: Array<{
      text: string;
      onPress?: () => void;
      style?: 'default' | 'cancel' | 'destructive';
    }> = [
        {
          text: t.followSystem,
          onPress: () => {
            setLanguage('system');
            Alert.alert(t.language, t.followSystem);
          },
        },
        {
          text: 'English',
          onPress: () => {
            setLanguage('en');
            Alert.alert(t.language, 'English');
          },
        },
        {
          text: '中文',
          onPress: () => {
            setLanguage('zh');
            Alert.alert(t.language, '中文');
          },
        },
        { text: t.cancel, style: 'cancel' },
      ];

    Alert.alert(t.language, t.languageDesc, options);
  };

  const handleCalendarProviderChange = () => {
    const options: Array<{
      text: string;
      onPress?: () => void;
      style?: 'default' | 'cancel' | 'destructive';
    }> = [
        {
          text: 'None',
          onPress: async () => {
            try {
              await calendarService.setSyncProvider('none');
              setCalendarProvider('none');
              Alert.alert('Calendar Sync', 'Calendar sync disabled');
            } catch (error) {
              Alert.alert('Error', 'Failed to update calendar sync preference');
            }
          },
        },
        {
          text: 'Google Calendar',
          onPress: async () => {
            try {
              await calendarService.setSyncProvider('google');
              setCalendarProvider('google');
              Alert.alert('Calendar Sync', 'Google Calendar sync enabled');
              // TODO: Trigger initial sync if user is logged in
            } catch (error) {
              Alert.alert('Error', 'Failed to update calendar sync preference');
            }
          },
        },
      ];

    // Only show Apple Calendar option on iOS
    if (Platform.OS === 'ios') {
      options.push({
        text: 'Apple Calendar',
        onPress: async () => {
          try {
            await calendarService.setSyncProvider('apple');
            setCalendarProvider('apple');
            Alert.alert('Calendar Sync', 'Apple Calendar sync enabled');
            // TODO: Trigger initial sync if user is logged in
          } catch (error) {
            Alert.alert('Error', 'Failed to update calendar sync preference');
          }
        },
      });
    }

    options.push({ text: 'Cancel', style: 'cancel' });

    Alert.alert('Calendar Sync Provider', 'Choose which calendar to sync with', options);
  };

  const handleChangePassword = () => {
    // Reset password fields
    setCurrentPassword('');
    setNewPassword('');
    setConfirmPassword('');
    setShowPasswordModal(true);
  };

  const handleAutoLockToggle = async (value: boolean) => {
    try {
      await securityService.setAutoLockEnabled(value);
      setAutoLockEnabled(value);
      Alert.alert(
        'Auto-Lock',
        value
          ? `App will automatically lock after ${autoLockTimeout} minutes of inactivity`
          : 'Auto-lock disabled'
      );
    } catch (error) {
      console.error('Failed to update auto-lock preference:', error);
      Alert.alert('Error', 'Failed to update auto-lock preference');
    }
  };

  const handleAutoLockTimeoutChange = () => {
    const timeouts = [
      { minutes: 1, label: '1 minute' },
      { minutes: 5, label: '5 minutes' },
      { minutes: 10, label: '10 minutes' },
      { minutes: 15, label: '15 minutes' },
      { minutes: 30, label: '30 minutes' },
    ];

    const options = timeouts.map((timeout) => ({
      text: timeout.label,
      onPress: async () => {
        try {
          await securityService.setAutoLockTimeout(timeout.minutes);
          setAutoLockTimeout(timeout.minutes);
          Alert.alert('Auto-Lock Timeout', `App will lock after ${timeout.label} of inactivity`);
        } catch (error) {
          console.error('Failed to save auto-lock timeout:', error);
          Alert.alert('Error', 'Failed to save auto-lock timeout');
        }
      },
    }));

    options.push({ text: 'Cancel', onPress: async () => { } });

    Alert.alert('Auto-Lock Timeout', 'Choose inactivity period before app locks', options);
  };

  const handleSavePassword = async () => {
    // Validation
    if (!currentPassword || !newPassword || !confirmPassword) {
      Alert.alert('Error', 'Please fill in all fields');
      return;
    }

    if (newPassword.length < 6) {
      Alert.alert('Error', 'New password must be at least 6 characters');
      return;
    }

    if (newPassword !== confirmPassword) {
      Alert.alert('Error', 'New passwords do not match');
      return;
    }

    setChangingPassword(true);
    try {
      const result = await authService.changePassword({
        currentPassword,
        newPassword,
      });

      if (result.success) {
        setShowPasswordModal(false);
        Alert.alert('Success', 'Password changed successfully');
      } else {
        Alert.alert('Error', result.error || 'Failed to change password');
      }
    } catch (error) {
      console.error('Failed to change password:', error);
      Alert.alert('Error', 'Failed to change password');
    } finally {
      setChangingPassword(false);
    }
  };

  const handleDeleteAccount = () => {
    Alert.alert(
      'Delete Account',
      'Are you sure you want to delete your account? This action cannot be undone. All your data will be permanently deleted.',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            try {
              const result = await authService.deleteAccount();

              if (result.success) {
                Alert.alert(
                  'Account Deleted',
                  'Your account and all associated data have been deleted.',
                  [{ text: 'OK' }]
                );
              } else {
                Alert.alert('Error', result.error || 'Failed to delete account');
              }
            } catch (error) {
              console.error('Failed to delete account:', error);
              Alert.alert('Error', 'Failed to delete account');
            }
          },
        },
      ]
    );
  };

  const handleEditProfile = () => {
    // Set current name in edit field
    setEditFullName(user?.user_metadata?.full_name || '');
    setShowEditModal(true);
  };

  const handleSaveProfile = async () => {
    if (!editFullName.trim()) {
      Alert.alert('Error', 'Please enter your name');
      return;
    }

    setSaving(true);
    try {
      const result = await authService.updateProfile({
        fullName: editFullName.trim(),
      });

      if (result.success) {
        setShowEditModal(false);
        Alert.alert('Success', 'Profile updated successfully');
      } else {
        Alert.alert('Error', result.error || 'Failed to update profile');
      }
    } catch (error) {
      console.error('Failed to update profile:', error);
      Alert.alert('Error', 'Failed to update profile');
    } finally {
      setSaving(false);
    }
  };

  return (
    <>
      <ScreenHeader title="Profile" />
      <ScrollView style={styles.container}>
        {/* Profile Section */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Profile</Text>
          <View style={styles.card}>
            {user && (
              <>
                <View style={styles.profileInfo}>
                  <View
                    style={styles.avatar}
                    accessible={true}
                    accessibilityLabel={`Profile avatar showing ${user.email?.charAt(0).toUpperCase() || 'U'}`}
                    accessibilityRole="image"
                  >
                    <Text style={styles.avatarText} accessible={false}>
                      {user.email?.charAt(0).toUpperCase() || 'U'}
                    </Text>
                  </View>
                  <View style={styles.profileDetails} accessible={false}>
                    <Text style={styles.profileName} accessible={false}>
                      {user.user_metadata?.full_name || 'User'}
                    </Text>
                    <Text style={styles.profileEmail} accessible={false}>{user.email}</Text>
                  </View>
                </View>
                <TouchableOpacity
                  style={styles.settingButton}
                  onPress={handleEditProfile}
                  accessible={true}
                  accessibilityRole="button"
                  accessibilityLabel="Edit Profile"
                  accessibilityHint="Double tap to edit your profile information"
                >
                  <Text style={styles.settingButtonText} accessible={false}>Edit Profile</Text>
                  <Text style={styles.settingButtonIcon} accessible={false}>›</Text>
                </TouchableOpacity>
              </>
            )}
          </View>
        </View>

        {/* Security Section */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Security</Text>
          <View style={styles.card}>
            <View
              style={styles.settingRow}
              accessible={true}
              accessibilityRole="switch"
              accessibilityLabel="Biometric Authentication"
              accessibilityHint="Use Face ID or Touch ID to unlock the app"
              accessibilityState={{ checked: biometricEnabled }}
            >
              <View style={styles.settingInfo} accessible={false}>
                <Text style={styles.settingLabel} accessible={false}>Biometric Authentication</Text>
                <Text style={styles.settingDescription} accessible={false}>
                  Use Face ID or Touch ID to unlock
                </Text>
              </View>
              <Switch
                value={biometricEnabled}
                onValueChange={handleBiometricToggle}
                trackColor={{ false: '#e0e0e0', true: '#007AFF' }}
                thumbColor="#fff"
                accessible={false}
              />
            </View>
            <View style={styles.divider} />
            <View
              style={styles.settingRow}
              accessible={true}
              accessibilityRole="switch"
              accessibilityLabel="Auto-Lock"
              accessibilityHint="Lock app after inactivity"
              accessibilityState={{ checked: autoLockEnabled }}
            >
              <View style={styles.settingInfo} accessible={false}>
                <Text style={styles.settingLabel} accessible={false}>Auto-Lock</Text>
                <Text style={styles.settingDescription} accessible={false}>
                  Lock app after inactivity
                </Text>
              </View>
              <Switch
                value={autoLockEnabled}
                onValueChange={handleAutoLockToggle}
                trackColor={{ false: '#e0e0e0', true: '#007AFF' }}
                thumbColor="#fff"
                accessible={false}
              />
            </View>
            {autoLockEnabled && (
              <>
                <View style={styles.divider} />
                <TouchableOpacity
                  style={styles.settingButton}
                  onPress={handleAutoLockTimeoutChange}
                >
                  <View style={styles.settingInfo}>
                    <Text style={styles.settingLabel}>Auto-Lock Timeout</Text>
                    <Text style={styles.settingDescription}>
                      {autoLockTimeout} {autoLockTimeout === 1 ? 'minute' : 'minutes'}
                    </Text>
                  </View>
                  <Text style={styles.settingButtonIcon}>›</Text>
                </TouchableOpacity>
              </>
            )}
            <View style={styles.divider} />
            <TouchableOpacity
              style={styles.settingButton}
              onPress={handleChangePassword}
              accessible={true}
              accessibilityRole="button"
              accessibilityLabel="Change Password"
              accessibilityHint="Double tap to change your password"
            >
              <Text style={styles.settingButtonText} accessible={false}>Change Password</Text>
              <Text style={styles.settingButtonIcon} accessible={false}>›</Text>
            </TouchableOpacity>
            <View style={styles.divider} />
            <TouchableOpacity
              style={styles.settingButton}
              onPress={handleDeleteAccount}
              accessible={true}
              accessibilityRole="button"
              accessibilityLabel="Delete Account"
              accessibilityHint="Double tap to permanently delete your account and all data"
            >
              <Text style={[styles.settingButtonText, styles.dangerText]} accessible={false}>Delete Account</Text>
              <Text style={styles.settingButtonIcon} accessible={false}>›</Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* Notifications Section */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Notifications</Text>
          <View style={styles.card}>
            <View
              style={styles.settingRow}
              accessible={true}
              accessibilityRole="switch"
              accessibilityLabel="Push Notifications"
              accessibilityHint="Receive notifications for todos and events"
              accessibilityState={{ checked: notificationsEnabled }}
            >
              <View style={styles.settingInfo} accessible={false}>
                <Text style={styles.settingLabel} accessible={false}>Push Notifications</Text>
                <Text style={styles.settingDescription} accessible={false}>
                  Receive notifications for todos and events
                </Text>
              </View>
              <Switch
                value={notificationsEnabled}
                onValueChange={handleNotificationsToggle}
                trackColor={{ false: '#e0e0e0', true: '#007AFF' }}
                thumbColor="#fff"
                accessible={false}
              />
            </View>
          </View>
        </View>

        {/* Preferences Section */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>{t.preferences}</Text>
          <View style={styles.card}>
            <TouchableOpacity
              style={styles.settingButton}
              onPress={handleLanguageChange}
              accessible={true}
              accessibilityRole="button"
              accessibilityLabel={`${t.language}: ${getLanguageLabel()}`}
              accessibilityHint="Double tap to change app language"
            >
              <View style={styles.settingInfo} accessible={false}>
                <Text style={styles.settingLabel} accessible={false}>{t.language}</Text>
                <Text style={styles.settingDescription} accessible={false}>{getLanguageLabel()}</Text>
              </View>
              <Text style={styles.settingButtonIcon} accessible={false}>›</Text>
            </TouchableOpacity>
            <View style={styles.divider} />
            <TouchableOpacity
              style={styles.settingButton}
              onPress={handleCurrencyChange}
              accessible={true}
              accessibilityRole="button"
              accessibilityLabel={`Default Currency: ${currency}`}
              accessibilityHint="Double tap to change default currency"
            >
              <View style={styles.settingInfo} accessible={false}>
                <Text style={styles.settingLabel} accessible={false}>{t.defaultCurrency}</Text>
                <Text style={styles.settingDescription} accessible={false}>{currency}</Text>
              </View>
              <Text style={styles.settingButtonIcon} accessible={false}>›</Text>
            </TouchableOpacity>
            <View style={styles.divider} />
            <TouchableOpacity
              style={styles.settingButton}
              onPress={handleCalendarProviderChange}
              accessible={true}
              accessibilityRole="button"
              accessibilityLabel={`Calendar Sync: ${calendarProvider === 'none' ? 'Disabled' : calendarProvider === 'google' ? 'Google Calendar' : 'Apple Calendar'}`}
              accessibilityHint="Double tap to change calendar sync provider"
            >
              <View style={styles.settingInfo} accessible={false}>
                <Text style={styles.settingLabel} accessible={false}>{t.calendarSync}</Text>
                <Text style={styles.settingDescription} accessible={false}>
                  {calendarProvider === 'none' && 'Disabled'}
                  {calendarProvider === 'google' && 'Google Calendar'}
                  {calendarProvider === 'apple' && 'Apple Calendar'}
                </Text>
              </View>
              <Text style={styles.settingButtonIcon} accessible={false}>›</Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* Sign Out */}
        <View style={styles.section}>
          <TouchableOpacity
            style={styles.signOutButton}
            onPress={handleSignOut}
            accessible={true}
            accessibilityRole="button"
            accessibilityLabel={t.signOut}
            accessibilityHint="Double tap to sign out of your account"
          >
            <Text style={styles.signOutButtonText} accessible={false}>{t.signOut}</Text>
          </TouchableOpacity>
        </View>

        {/* App Version */}
        <View style={styles.footer}>
          <Text style={styles.footerText}>{t.version} 1.0.0</Text>
        </View>
      </ScrollView>

      {/* Edit Profile Modal */}
      <Modal
        visible={showEditModal}
        animationType="slide"
        transparent={true}
        onRequestClose={() => setShowEditModal(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>Edit Profile</Text>

            <View style={styles.modalField}>
              <Text style={styles.modalLabel}>Full Name</Text>
              <TextInput
                style={styles.modalInput}
                value={editFullName}
                onChangeText={setEditFullName}
                placeholder="Enter your name"
                autoCapitalize="words"
                autoFocus
              />
            </View>

            <View style={styles.modalButtons}>
              <TouchableOpacity
                style={[styles.modalButton, styles.modalButtonCancel]}
                onPress={() => setShowEditModal(false)}
                disabled={saving}
              >
                <Text style={styles.modalButtonTextCancel}>Cancel</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={[styles.modalButton, styles.modalButtonSave]}
                onPress={handleSaveProfile}
                disabled={saving}
              >
                <Text style={styles.modalButtonTextSave}>
                  {saving ? 'Saving...' : 'Save'}
                </Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      {/* Change Password Modal */}
      <Modal
        visible={showPasswordModal}
        animationType="slide"
        transparent={true}
        onRequestClose={() => setShowPasswordModal(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>Change Password</Text>

            <View style={styles.modalField}>
              <Text style={styles.modalLabel}>Current Password</Text>
              <TextInput
                style={styles.modalInput}
                value={currentPassword}
                onChangeText={setCurrentPassword}
                placeholder="Enter current password"
                secureTextEntry
                autoCapitalize="none"
                autoFocus
              />
            </View>

            <View style={styles.modalField}>
              <Text style={styles.modalLabel}>New Password</Text>
              <TextInput
                style={styles.modalInput}
                value={newPassword}
                onChangeText={setNewPassword}
                placeholder="Enter new password (min 6 characters)"
                secureTextEntry
                autoCapitalize="none"
              />
            </View>

            <View style={styles.modalField}>
              <Text style={styles.modalLabel}>Confirm New Password</Text>
              <TextInput
                style={styles.modalInput}
                value={confirmPassword}
                onChangeText={setConfirmPassword}
                placeholder="Confirm new password"
                secureTextEntry
                autoCapitalize="none"
              />
            </View>

            <View style={styles.modalButtons}>
              <TouchableOpacity
                style={[styles.modalButton, styles.modalButtonCancel]}
                onPress={() => setShowPasswordModal(false)}
                disabled={changingPassword}
              >
                <Text style={styles.modalButtonTextCancel}>Cancel</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={[styles.modalButton, styles.modalButtonSave]}
                onPress={handleSavePassword}
                disabled={changingPassword}
              >
                <Text style={styles.modalButtonTextSave}>
                  {changingPassword ? 'Changing...' : 'Change Password'}
                </Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </>
  );
});

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  section: {
    marginTop: 24,
    paddingHorizontal: 16,
  },
  sectionTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: '#666',
    marginBottom: 8,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  card: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  profileInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
  },
  avatar: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: '#007AFF',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 16,
  },
  avatarText: {
    fontSize: 28,
    fontWeight: '700',
    color: '#fff',
  },
  profileDetails: {
    flex: 1,
  },
  profileName: {
    fontSize: 20,
    fontWeight: '700',
    color: '#333',
    marginBottom: 4,
  },
  profileEmail: {
    fontSize: 14,
    color: '#666',
  },
  settingRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  settingInfo: {
    flex: 1,
    marginRight: 16,
  },
  settingLabel: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
    marginBottom: 4,
  },
  settingDescription: {
    fontSize: 14,
    color: '#666',
  },
  settingButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 12,
  },
  settingButtonText: {
    fontSize: 16,
    color: '#333',
  },
  dangerText: {
    color: '#FF3B30',
  },
  settingButtonIcon: {
    fontSize: 24,
    color: '#999',
    fontWeight: '300',
  },
  divider: {
    height: 1,
    backgroundColor: '#e0e0e0',
    marginVertical: 12,
  },
  themeOptions: {
    flexDirection: 'row',
    gap: 8,
    marginTop: 12,
  },
  themeOption: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: 8,
    backgroundColor: '#f0f0f0',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: 'transparent',
  },
  themeOptionActive: {
    backgroundColor: '#007AFF',
    borderColor: '#007AFF',
  },
  themeOptionText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#666',
  },
  themeOptionTextActive: {
    color: '#fff',
  },
  signOutButton: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 16,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  signOutButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#FF3B30',
  },
  footer: {
    alignItems: 'center',
    paddingVertical: 32,
  },
  footerText: {
    fontSize: 12,
    color: '#999',
  },
  // Modal styles
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 16,
  },
  modalContent: {
    backgroundColor: '#fff',
    borderRadius: 16,
    padding: 24,
    width: '100%',
    maxWidth: 400,
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: '#333',
    marginBottom: 24,
  },
  modalField: {
    marginBottom: 24,
  },
  modalLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: '#666',
    marginBottom: 8,
  },
  modalInput: {
    borderWidth: 1,
    borderColor: '#e0e0e0',
    borderRadius: 8,
    padding: 12,
    fontSize: 16,
    color: '#333',
  },
  modalButtons: {
    flexDirection: 'row',
    gap: 12,
  },
  modalButton: {
    flex: 1,
    padding: 14,
    borderRadius: 8,
    alignItems: 'center',
  },
  modalButtonCancel: {
    backgroundColor: '#f5f5f5',
  },
  modalButtonSave: {
    backgroundColor: '#007AFF',
  },
  modalButtonTextCancel: {
    fontSize: 16,
    fontWeight: '600',
    color: '#666',
  },
  modalButtonTextSave: {
    fontSize: 16,
    fontWeight: '600',
    color: '#fff',
  },
});
