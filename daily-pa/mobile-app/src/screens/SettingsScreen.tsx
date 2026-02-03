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
import { LinearGradient } from 'expo-linear-gradient';
import { useNavigation } from '@react-navigation/native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Ionicons } from '@expo/vector-icons';
import { useAuth } from '@/hooks/useAuth';

import { notificationService } from '@/services/notificationService';

import { biometricService } from '@/services/biometricService';
import { securityService } from '@/services/securityService';
import { ScreenHeader } from '@/components/ScreenHeader';
import { useLanguageStore, AppLanguage, translations, useEffectiveLanguage, LANGUAGES } from '@/store/languageStore';
import { useCurrencyStore } from '@/store/currencyStore';
import { useThemeStore, ThemeMode, themeInfo } from '@/store/themeStore';
import { FONTS } from '@/theme/fonts';
import { backupService } from '@/services/BackupService';

import { useUserStore } from '@/store/userStore';
import { useLocalStore } from '@/models';
import { useSubscriptionStore } from '@/store/subscriptionStore';

export const SettingsScreen: React.FC = React.memo(() => {
  const navigation = useNavigation<any>();
  const { profile, updateProfile, resetProfile } = useUserStore();
  const { isPro, proSource, remainingGraceDays, restorePurchases, checkSubscription } = useSubscriptionStore();

  // Check subscription on mount/focus
  useEffect(() => {
    checkSubscription();
    // Also check when screen comes into focus
    const unsubscribe = navigation.addListener('focus', () => {
      checkSubscription();
    });
    return unsubscribe;
  }, [navigation]);

  const { session, signOut } = useAuth();
  const language = useLanguageStore((state) => state.language);
  const setLanguage = useLanguageStore((state) => state.setLanguage);
  const effectiveLang = useEffectiveLanguage();
  const t = translations[effectiveLang];

  // Theme Store
  const { mode: themeMode, setMode: setThemeMode, colors: themeColors } = useThemeStore();
  const [showThemeModal, setShowThemeModal] = useState(false);

  const isGlassy = themeMode !== 'minimal';
  const gradient = React.useMemo(() => {
    return [themeColors.gradient.start, themeColors.gradient.middle, themeColors.gradient.end];
  }, [themeColors]);

  // Settings state
  const [biometricEnabled, setBiometricEnabled] = useState(false);
  const [notificationsEnabled, setNotificationsEnabled] = useState(true);

  const currency = useCurrencyStore((state) => state.currency);
  const setCurrency = useCurrencyStore((state) => state.setCurrency);

  const [autoLockEnabled, setAutoLockEnabled] = useState(false);
  const [autoLockTimeout, setAutoLockTimeout] = useState(5); // in minutes
  const [loading, setLoading] = useState(true);

  // Profile edit modal state
  const [showEditModal, setShowEditModal] = useState(false);
  const [editFullName, setEditFullName] = useState('');
  const [saving, setSaving] = useState(false);

  // Language modal state
  const [showLanguageModal, setShowLanguageModal] = useState(false);

  // Load preferences on mount
  useEffect(() => {
    const loadPreferences = async () => {
      try {
        // Load notification preference
        const notifEnabled = await notificationService.areNotificationsEnabled();
        setNotificationsEnabled(notifEnabled);

        // Load biometric preference
        const biometricEnabled = await biometricService.isEnabled();
        setBiometricEnabled(biometricEnabled);

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

  const handleResetLocalData = () => {
    Alert.alert(
      "Reset App Data",
      "This will delete all LOCAL data on this device including cached profile data. This will NOT delete data on the cloud.",
      [
        { text: t.cancel, style: 'cancel' },
        {
          text: "Reset Local Data",
          style: 'destructive',
          onPress: async () => {
            try {
              await AsyncStorage.clear();
              useLocalStore.getState().clearAll();
              resetProfile();
              await signOut();
            } catch (e) {
              await AsyncStorage.clear();
            }
          },
        },
      ]
    );
  };

  const handleResetAccountData = () => {
    Alert.alert(
      "Reset Account Cloud Data",
      "This will PERMANENTLY DELETE all your data (Tasks, Expenses, Events) from the cloud/server. This cannot be undone.",
      [
        { text: t.cancel, style: 'cancel' },
        {
          text: "Delete Cloud Data",
          style: 'destructive',
          onPress: async () => {
            try {
              const { authService } = await import('@/services/authService');
              const { syncManager } = await import('@/services/sync/SyncManager');
              const { syncQueue } = await import('@/services/sync/SyncQueue');

              const result = await authService.clearAccountData();
              if (result.success) {
                // Clear Local completely
                useLocalStore.getState().clearAll();

                // Clear Sync Queue so no phantom pushes occur
                await syncQueue.clear();

                // Reset Sync Manager State (last sync time null)
                await syncManager.reset();

                Alert.alert("Success", "All cloud and local data has been reset.");
              } else {
                Alert.alert("Error", result.error || "Failed to delete cloud data.");
              }
            } catch (e) {
              Alert.alert("Error", "An unexpected error occurred.");
            }
          },
        },
      ]
    );
  };

  const handleBiometricToggle = async (value: boolean) => {
    try {
      if (value) {
        const result = await biometricService.enable();
        if (result.success) {
          setBiometricEnabled(true);
          Alert.alert(t.biometricAuth, 'Enabled successfully.');
        } else {
          Alert.alert('Error', result.error || 'Failed to enable biometric authentication');
        }
      } else {
        await biometricService.disable();
        setBiometricEnabled(false);
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
    } catch (error) {
      console.error('Failed to update notification preference:', error);
    }
  };

  const [showCurrencyModal, setShowCurrencyModal] = useState(false);

  // Moved currencies definition here for access in Modal
  const currencies = [
    { code: 'USD', name: 'US Dollar' },
    { code: 'EUR', name: 'Euro' },
    { code: 'GBP', name: 'British Pound' },
    { code: 'JPY', name: 'Japanese Yen' },
    { code: 'CNY', name: 'Chinese Yuan' },
    { code: 'CAD', name: 'Canadian Dollar' },
    { code: 'AUD', name: 'Australian Dollar' },
    { code: 'MYR', name: 'Malaysian Ringgit' },
    { code: 'SGD', name: 'Singapore Dollar' },
    { code: 'IDR', name: 'Indonesian Rupiah' },
    { code: 'THB', name: 'Thai Baht' },
    { code: 'VND', name: 'Vietnamese Dong' },
    { code: 'PHP', name: 'Philippine Peso' },
    { code: 'INR', name: 'Indian Rupee' },
    { code: 'KRW', name: 'South Korean Won' },
    { code: 'TWD', name: 'New Taiwan Dollar' },
  ];

  const handleCurrencyChange = () => {
    setShowCurrencyModal(true);
  };

  const getLanguageLabel = () => {
    if (language === 'system') return t.followSystem;
    const lang = LANGUAGES.find(l => l.code === language);
    return lang ? lang.label : t.followSystem;
  };

  const getThemeLabel = () => {
    const info = themeInfo[themeMode];
    return info ? `${info.emoji} ${info.name}` : 'Ocean';
  };

  const handleLanguageChange = () => {
    setShowLanguageModal(true);
  };

  const handleAutoLockToggle = async (value: boolean) => {
    try {
      await securityService.setAutoLockEnabled(value);
      setAutoLockEnabled(value);
    } catch (error) {
      console.error('Failed to update auto-lock preference:', error);
    }
  };

  const handleAutoLockTimeoutChange = () => {
    const timeouts = [
      { minutes: 1, label: '1 min' },
      { minutes: 5, label: '5 min' },
      { minutes: 10, label: '10 min' },
      { minutes: 15, label: '15 min' },
    ];

    const options = timeouts.map((timeout) => ({
      text: timeout.label,
      onPress: async () => {
        await securityService.setAutoLockTimeout(timeout.minutes);
        setAutoLockTimeout(timeout.minutes);
      },
    }));

    options.push({ text: t.cancel, onPress: async () => { } });
    Alert.alert(t.autoLockTimeout, 'Select timeout', options);
  };

  const handleBackup = async () => {
    await backupService.createBackup();
  };

  const handleRestore = async () => {
    await backupService.restoreBackup();
  };

  const handleEditProfile = () => {
    setEditFullName(profile.fullName || '');
    setShowEditModal(true);
  };

  const handleSaveProfile = async () => {
    if (!editFullName.trim()) return;
    setSaving(true);
    try {
      updateProfile({ fullName: editFullName.trim() });
      setShowEditModal(false);
    } finally {
      setSaving(false);
    }
  };

  return (
    <View style={[styles.container, isGlassy && { backgroundColor: 'transparent' }]}>
      {isGlassy && (
        <View style={[StyleSheet.absoluteFill, { zIndex: -1 }]}>
          <LinearGradient
            colors={gradient as any}
            style={{ flex: 1 }}
          />
        </View>
      )}
      <ScreenHeader title={t.profile} style={isGlassy ? { backgroundColor: 'transparent' } : undefined} />
      <ScrollView style={[styles.container, isGlassy && { backgroundColor: 'transparent' }]}>
        {/* Profile Section */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>{t.profile}</Text>
          <View style={styles.card}>
            <View style={styles.profileInfo}>
              <View style={styles.avatar}>
                <Text style={styles.avatarText}>{profile.fullName.charAt(0).toUpperCase()}</Text>
              </View>
              <View style={styles.profileDetails}>
                <Text style={styles.profileName}>{profile.fullName}</Text>
                <Text style={styles.profileEmail}>{profile.email}</Text>
                <TouchableOpacity
                  style={{ flexDirection: 'row', alignItems: 'center', marginTop: 4 }}
                  onPress={async () => {
                    if (profile.id === 'guest_user') {
                      Alert.alert(
                        'Guest Mode',
                        'You are currently in Guest Mode. Please log in to sync your data.',
                        [
                          { text: 'Cancel', style: 'cancel' },
                          { text: 'Log In', onPress: () => navigation.push('Login', { isUpgrade: true }) }
                        ]
                      );
                      return;
                    }

                    const { syncManager } = await import('@/services/sync/SyncManager');
                    Alert.alert('Syncing', 'Starting manual full sync...');
                    // Force full sync to ignore timestamps
                    const result = await syncManager.forceSync(true);

                    if (result.success) {
                      Alert.alert(
                        'Sync Complete',
                        `Success!\nPushed: ${result.pushed} items\nPulled: ${result.pulled} items`
                      );
                    } else {
                      const errorMsg = result.errors[0]?.message || 'Unknown error';
                      Alert.alert('Sync Failed', `Error: ${errorMsg}`);
                    }
                  }}
                >
                  <Ionicons name="cloud-done" size={12} color="#10B981" />
                  <Text style={[styles.profileEmail, { fontSize: 12, color: '#10B981', marginLeft: 4 }]}>
                    Tap to Sync Now (Force Full)
                  </Text>
                </TouchableOpacity>
              </View>
            </View>
            <TouchableOpacity style={styles.settingButton} onPress={handleEditProfile}>
              <Text style={styles.settingButtonText}>{t.editProfile}</Text>
              <Text style={styles.settingButtonIcon}>›</Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* Membership Section */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Membership</Text>
          <View style={styles.card}>
            {isPro && proSource === 'subscription' ? (
              <TouchableOpacity style={styles.settingButton} onPress={() => navigation.navigate('CustomerCenter')}>
                <View style={styles.settingInfo}>
                  <Text style={styles.settingLabel}>Manage Subscription</Text>
                  <Text style={styles.settingDescription}>Active Pro Member</Text>
                </View>
                <View style={{ backgroundColor: '#DEF7EC', paddingHorizontal: 8, paddingVertical: 4, borderRadius: 12, marginRight: 8 }}>
                  <Text style={{ color: '#03543F', fontSize: 12, fontFamily: FONTS.bold }}>ACTIVE</Text>
                </View>
                <Text style={styles.settingButtonIcon}>›</Text>
              </TouchableOpacity>
            ) : isPro && proSource === 'grace_period' ? (
              <TouchableOpacity style={styles.settingButton} onPress={() => navigation.navigate('Paywall')}>
                <View style={styles.settingInfo}>
                  <Text style={styles.settingLabel}>Free Trial Active</Text>
                  <Text style={styles.settingDescription}>{remainingGraceDays} days remaining</Text>
                </View>
                <View style={{ backgroundColor: '#FEF3C7', paddingHorizontal: 8, paddingVertical: 4, borderRadius: 12, marginRight: 8 }}>
                  <Text style={{ color: '#92400E', fontSize: 12, fontFamily: FONTS.bold }}>TRIAL</Text>
                </View>
                <Text style={styles.settingButtonIcon}>›</Text>
              </TouchableOpacity>
            ) : (
              <TouchableOpacity style={styles.settingButton} onPress={() => navigation.navigate('Paywall')}>
                <View style={styles.settingInfo}>
                  <Text style={styles.settingLabel}>Upgrade to Pro</Text>
                  <Text style={styles.settingDescription}>Unlock all features</Text>
                </View>
                <View style={{ backgroundColor: '#EFF6FF', paddingHorizontal: 8, paddingVertical: 4, borderRadius: 12, marginRight: 8 }}>
                  <Text style={{ color: '#3B82F6', fontSize: 12, fontFamily: FONTS.bold }}>PRO</Text>
                </View>
                <Text style={styles.settingButtonIcon}>›</Text>
              </TouchableOpacity>
            )}

            {/* Restore Purchases Option */}
            <View style={styles.divider} />
            <TouchableOpacity
              style={styles.settingButton}
              onPress={async () => {
                const success = await restorePurchases();
                Alert.alert(
                  success ? 'Success' : 'Notice',
                  success ? 'Purchases restored successfully!' : 'No purchases found to restore.'
                );
              }}
            >
              <View style={styles.settingInfo}>
                <Text style={styles.settingLabel}>Restore Purchases</Text>
                <Text style={styles.settingDescription}>Restore existing subscription</Text>
              </View>
              <Text style={styles.settingButtonIcon}>›</Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* Security Section */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>{t.security}</Text>
          <View style={styles.card}>
            <View style={styles.settingRow}>
              <View style={styles.settingInfo}>
                <Text style={styles.settingLabel}>{t.biometricAuth}</Text>
                <Text style={styles.settingDescription}>{t.biometricDesc}</Text>
              </View>
              <Switch value={biometricEnabled} onValueChange={handleBiometricToggle} trackColor={{ false: '#e0e0e0', true: '#007AFF' }} thumbColor="#fff" />
            </View>
            <View style={styles.divider} />
            <View style={styles.settingRow}>
              <View style={styles.settingInfo}>
                <Text style={styles.settingLabel}>{t.autoLock}</Text>
                <Text style={styles.settingDescription}>{t.autoLockDesc}</Text>
              </View>
              <Switch value={autoLockEnabled} onValueChange={handleAutoLockToggle} trackColor={{ false: '#e0e0e0', true: '#007AFF' }} thumbColor="#fff" />
            </View>
            {autoLockEnabled && (
              <>
                <View style={styles.divider} />
                <TouchableOpacity style={styles.settingButton} onPress={handleAutoLockTimeoutChange}>
                  <View style={styles.settingInfo}>
                    <Text style={styles.settingLabel}>{t.autoLockTimeout}</Text>
                    <Text style={styles.settingDescription}>{autoLockTimeout} min</Text>
                  </View>
                  <Text style={styles.settingButtonIcon}>›</Text>
                </TouchableOpacity>
              </>
            )}
          </View>
        </View>

        {/* Notifications Section */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>{t.notifications}</Text>
          <View style={styles.card}>
            <View style={styles.settingRow}>
              <View style={styles.settingInfo}>
                <Text style={styles.settingLabel}>{t.pushNotifications}</Text>
                <Text style={styles.settingDescription}>{t.pushNotificationsDesc}</Text>
              </View>
              <Switch value={notificationsEnabled} onValueChange={handleNotificationsToggle} trackColor={{ false: '#e0e0e0', true: '#007AFF' }} thumbColor="#fff" />
            </View>
          </View>
        </View>

        {/* Preferences Section */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>{t.preferences}</Text>
          <View style={styles.card}>
            <TouchableOpacity style={styles.settingButton} onPress={() => setShowThemeModal(true)}>
              <View style={styles.settingInfo}>
                <Text style={styles.settingLabel}>Theme Selection</Text>
                <Text style={styles.settingDescription}>{getThemeLabel()}</Text>
              </View>
              <Text style={styles.settingButtonIcon}>›</Text>
            </TouchableOpacity>
            <View style={styles.divider} />
            <TouchableOpacity style={styles.settingButton} onPress={handleLanguageChange}>
              <View style={styles.settingInfo}>
                <Text style={styles.settingLabel}>{t.language}</Text>
                <Text style={styles.settingDescription}>{getLanguageLabel()}</Text>
              </View>
              <Text style={styles.settingButtonIcon}>›</Text>
            </TouchableOpacity>
            <View style={styles.divider} />
            <TouchableOpacity style={styles.settingButton} onPress={handleCurrencyChange}>
              <View style={styles.settingInfo}>
                <Text style={styles.settingLabel}>{t.defaultCurrency}</Text>
                <Text style={styles.settingDescription}>{currency}</Text>
              </View>
              <Text style={styles.settingButtonIcon}>›</Text>
            </TouchableOpacity>
          </View>
        </View>



        {/* Data Management Removed - Auto Sync Enabled */}

        {/* Account Actions */}
        <View style={styles.section}>
          {!session ? (
            <TouchableOpacity
              style={[styles.signOutButton, { backgroundColor: '#007AFF', marginBottom: 12 }]}
              onPress={() => navigation.push('Login', { isUpgrade: true })}
            >
              <Text style={styles.signOutButtonText}>Log In to Sync</Text>
            </TouchableOpacity>
          ) : (
            <TouchableOpacity
              style={[styles.signOutButton, { backgroundColor: '#F59E0B', marginBottom: 12 }]}
              onPress={() => {
                Alert.alert(t.signOut, 'Are you sure?', [
                  { text: t.cancel, style: 'cancel' },
                  { text: t.signOut, onPress: signOut }
                ]);
              }}
            >
              <Text style={styles.signOutButtonText}>{t.signOut}</Text>
            </TouchableOpacity>
          )}

          <TouchableOpacity style={[styles.signOutButton, { backgroundColor: '#EF4444', marginBottom: 12 }]} onPress={handleResetLocalData}>
            <Text style={styles.signOutButtonText}>Reset Local Data (Device Only)</Text>
          </TouchableOpacity>

          {session && (
            <TouchableOpacity style={[styles.signOutButton, { backgroundColor: '#7F1D1D' }]} onPress={handleResetAccountData}>
              <Text style={styles.signOutButtonText}>Reset Account Cloud Data (Delete All)</Text>
            </TouchableOpacity>
          )}
        </View>

        {/* App Version */}
        <View style={styles.footer}>
          <Text style={styles.footerText}>{t.version} 1.0.0</Text>
        </View>
      </ScrollView>

      {/* Edit Profile Modal */}
      <Modal visible={showEditModal} animationType="slide" transparent={true} onRequestClose={() => setShowEditModal(false)}>
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>{t.editProfile}</Text>
            <View style={styles.modalField}>
              <Text style={styles.modalLabel}>{t.profile}</Text>
              <TextInput style={styles.modalInput} value={editFullName} onChangeText={setEditFullName} placeholder="Full Name" />
            </View>
            <View style={styles.modalButtons}>
              <TouchableOpacity style={[styles.modalButton, styles.modalButtonCancel]} onPress={() => setShowEditModal(false)}>
                <Text style={styles.modalButtonTextCancel}>{t.cancel}</Text>
              </TouchableOpacity>
              <TouchableOpacity style={[styles.modalButton, styles.modalButtonSave]} onPress={handleSaveProfile} disabled={saving}>
                <Text style={styles.modalButtonTextSave}>{t.save}</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      {/* Currency Modal */}
      <Modal visible={showCurrencyModal} animationType="slide" transparent={true} onRequestClose={() => setShowCurrencyModal(false)}>
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>{t.defaultCurrency}</Text>
            <ScrollView style={{ maxHeight: 400 }}>
              {currencies.map(c => (
                <TouchableOpacity
                  key={c.code}
                  style={styles.modalField}
                  onPress={() => {
                    setCurrency(c.code);
                    setShowCurrencyModal(false);
                  }}
                >
                  <Text style={{ fontSize: 16, padding: 10, color: currency === c.code ? '#3B82F6' : '#000' }}>
                    {c.code} - {c.name}
                  </Text>
                </TouchableOpacity>
              ))}
            </ScrollView>
            <View style={styles.modalButtons}>
              <TouchableOpacity style={[styles.modalButton, styles.modalButtonCancel]} onPress={() => setShowCurrencyModal(false)}>
                <Text style={styles.modalButtonTextCancel}>{t.cancel}</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>



      {/* Language Modal */}
      <Modal visible={showLanguageModal} animationType="slide" transparent={true} onRequestClose={() => setShowLanguageModal(false)}>
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>{t.language}</Text>
            <ScrollView style={{ maxHeight: 400 }}>
              <TouchableOpacity style={styles.modalField} onPress={() => { setLanguage('system'); setShowLanguageModal(false); }}>
                <Text style={{ fontSize: 16, padding: 10, color: language === 'system' ? '#3B82F6' : '#000' }}>{t.followSystem}</Text>
              </TouchableOpacity>
              {LANGUAGES.map(lang => (
                <TouchableOpacity key={lang.code} style={styles.modalField} onPress={() => { setLanguage(lang.code as any); setShowLanguageModal(false); }}>
                  <Text style={{ fontSize: 16, padding: 10, color: language === lang.code ? '#3B82F6' : '#000' }}>{lang.label}</Text>
                </TouchableOpacity>
              ))}
            </ScrollView>
            <View style={styles.modalButtons}>
              <TouchableOpacity style={[styles.modalButton, styles.modalButtonCancel]} onPress={() => setShowLanguageModal(false)}>
                <Text style={styles.modalButtonTextCancel}>{t.cancel}</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      {/* Theme Modal */}
      <Modal visible={showThemeModal} animationType="slide" transparent={true} onRequestClose={() => setShowThemeModal(false)}>
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>Select Theme</Text>
            {(['ocean', 'sage', 'sunset', 'minimal'] as ThemeMode[]).map((theme) => {
              const info = themeInfo[theme];
              return (
                <TouchableOpacity
                  key={theme}
                  style={styles.modalField}
                  onPress={() => { setThemeMode(theme); setShowThemeModal(false); }}
                >
                  <Text style={{
                    fontSize: 16,
                    padding: 10,
                    color: themeMode === theme ? '#3B82F6' : '#000'
                  }}>
                    {info.emoji} {info.name} - {info.description}
                  </Text>
                </TouchableOpacity>
              );
            })}
            <View style={styles.modalButtons}>
              <TouchableOpacity style={[styles.modalButton, styles.modalButtonCancel]} onPress={() => setShowThemeModal(false)}>
                <Text style={styles.modalButtonTextCancel}>{t.cancel}</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </View>
  );
});

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f5f5f5' },
  section: { marginTop: 24, paddingHorizontal: 16 },
  sectionTitle: { fontSize: 14, fontFamily: FONTS.semiBold, color: '#666', marginBottom: 8, textTransform: 'uppercase', letterSpacing: 0.5 },
  card: { backgroundColor: '#fff', borderRadius: 12, padding: 16, shadowColor: '#000', shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.1, shadowRadius: 2, elevation: 2 },
  profileInfo: { flexDirection: 'row', alignItems: 'center', marginBottom: 16 },
  avatar: { width: 64, height: 64, borderRadius: 32, backgroundColor: '#007AFF', justifyContent: 'center', alignItems: 'center', marginRight: 16 },
  avatarText: { fontSize: 28, fontFamily: FONTS.bold, color: '#fff' },
  profileDetails: { flex: 1 },
  profileName: { fontSize: 20, fontFamily: FONTS.bold, color: '#333', marginBottom: 4 },
  profileEmail: { fontSize: 14, color: '#666' },
  settingRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  settingInfo: { flex: 1, marginRight: 16 },
  settingLabel: { fontSize: 16, fontFamily: FONTS.semiBold, color: '#333', marginBottom: 4 },
  settingDescription: { fontSize: 14, color: '#666' },
  settingButton: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingVertical: 12 },
  settingButtonText: { fontSize: 16, color: '#333' },

  settingButtonIcon: { fontSize: 24, color: '#999', fontWeight: '300' },
  divider: { height: 1, backgroundColor: '#e0e0e0', marginVertical: 12 },
  signOutButton: { backgroundColor: '#fff', borderRadius: 12, padding: 16, alignItems: 'center', shadowColor: '#000', shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.1, shadowRadius: 2, elevation: 2 },
  signOutButtonText: { fontSize: 16, fontFamily: FONTS.semiBold, color: '#fff' },
  footer: { alignItems: 'center', paddingVertical: 32 },
  footerText: { fontSize: 12, color: '#999' },
  modalOverlay: { flex: 1, backgroundColor: 'rgba(0, 0, 0, 0.5)', justifyContent: 'center', alignItems: 'center', padding: 16 },
  modalContent: { backgroundColor: '#fff', borderRadius: 16, padding: 24, width: '100%', maxWidth: 400 },
  modalTitle: { fontSize: 20, fontFamily: FONTS.bold, color: '#333', marginBottom: 24 },
  modalField: { marginBottom: 24 },
  modalLabel: { fontSize: 14, fontFamily: FONTS.semiBold, color: '#666', marginBottom: 8 },
  modalInput: { borderWidth: 1, borderColor: '#e0e0e0', borderRadius: 8, padding: 12, fontSize: 16, color: '#333' },
  modalButtons: { flexDirection: 'row', gap: 12 },
  modalButton: { flex: 1, padding: 14, borderRadius: 8, alignItems: 'center' },
  modalButtonCancel: { backgroundColor: '#f5f5f5' },
  modalButtonSave: { backgroundColor: '#007AFF' },
  modalButtonTextCancel: { fontSize: 16, fontFamily: FONTS.semiBold, color: '#666' },
  modalButtonTextSave: { fontSize: 16, fontFamily: FONTS.semiBold, color: '#fff' },
});
