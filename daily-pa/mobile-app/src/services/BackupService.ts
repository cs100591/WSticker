import * as FileSystem from 'expo-file-system/legacy';
import * as Sharing from 'expo-sharing';
import * as DocumentPicker from 'expo-document-picker';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Alert } from 'react-native';
import { useLocalStore } from '@/store/localStore';
import { useUserStore } from '@/store/userStore';

interface BackupData {
    version: number;
    timestamp: string;
    localStore: {
        todos: any[];
        expenses: any[];
        calendarEvents: any[];
    };
    userProfile: any;
    voiceNotes: any[];
}

const BACKUP_VERSION = 1;

export const backupService = {
    /**
     * Create a backup file and prompt user to save/share it
     */
    createBackup: async () => {
        try {
            // 1. Gather Data
            const localStore = useLocalStore.getState();
            const userStore = useUserStore.getState();

            // Get Voice Notes from raw AsyncStorage
            const voiceNotesJson = await AsyncStorage.getItem('voice_notes');
            const voiceNotes = voiceNotesJson ? JSON.parse(voiceNotesJson) : [];

            const backupData: BackupData = {
                version: BACKUP_VERSION,
                timestamp: new Date().toISOString(),
                localStore: {
                    todos: localStore.todos,
                    expenses: localStore.expenses,
                    calendarEvents: localStore.calendarEvents,
                },
                userProfile: userStore.profile,
                voiceNotes: voiceNotes,
            };

            // 2. Write to Temp File
            const fileName = `DailyPA_Backup_${new Date().toISOString().split('T')[0]}.json`;
            const filePath = `${FileSystem.documentDirectory}${fileName}`;

            await FileSystem.writeAsStringAsync(filePath, JSON.stringify(backupData, null, 2), {
                encoding: 'utf8',
            });

            // 3. Share File
            if (await Sharing.isAvailableAsync()) {
                await Sharing.shareAsync(filePath, {
                    mimeType: 'application/json',
                    dialogTitle: 'Save Backup File',
                    UTI: 'public.json', // for iOS
                });
            } else {
                Alert.alert('Error', 'Sharing is not available on this device');
            }

        } catch (error: any) {
            console.error('Backup failed:', error);
            Alert.alert('Backup Failed', error.message || 'Unknown error occurred');
        }
    },

    /**
     * Pick a backup file and restore data
     */
    restoreBackup: async () => {
        try {
            // 1. Pick File
            const result = await DocumentPicker.getDocumentAsync({
                type: ['application/json', 'public.json'],
                copyToCacheDirectory: true,
            });

            if (result.canceled) return;

            const fileUri = result.assets[0].uri;

            // 2. Read File
            const fileContent = await FileSystem.readAsStringAsync(fileUri, {
                encoding: 'utf8',
            });

            const backupData: BackupData = JSON.parse(fileContent);

            // 3. Validate
            if (!backupData.version || !backupData.localStore || !backupData.userProfile) {
                throw new Error('Invalid backup file format');
            }

            Alert.alert(
                'Confirm Restore',
                `This will replace your current data with backup from ${new Date(backupData.timestamp).toLocaleDateString()}. Current data will be lost.`,
                [
                    { text: 'Cancel', style: 'cancel' },
                    {
                        text: 'Restore',
                        style: 'destructive',
                        onPress: async () => {
                            // 4. Restore Data
                            const localStore = useLocalStore.getState();
                            const userStore = useUserStore.getState();

                            // Restore Local Store
                            localStore.setTodos(backupData.localStore.todos || []);
                            localStore.setExpenses(backupData.localStore.expenses || []);
                            localStore.setCalendarEvents(backupData.localStore.calendarEvents || []);

                            // Restore User Profile
                            userStore.updateProfile(backupData.userProfile);

                            // Restore Voice Notes
                            if (backupData.voiceNotes) {
                                await AsyncStorage.setItem('voice_notes', JSON.stringify(backupData.voiceNotes));
                            }

                            Alert.alert('Success', 'Data restored successfully. Please restart the app for best results.');
                        }
                    }
                ]
            );

        } catch (error: any) {
            console.error('Restore failed:', error);
            Alert.alert('Restore Failed', 'Could not read backup file. ' + error.message);
        }
    }
};
