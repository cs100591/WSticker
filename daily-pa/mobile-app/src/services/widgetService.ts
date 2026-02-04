import SharedGroupPreferences from 'react-native-shared-group-preferences';
import { Platform, NativeModules } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';

const APP_GROUP_IDENTIFIER = 'group.com.dailypa.app.cssee';

interface WidgetData {
    todos: any[];
    calendarEvents: any[];
    expenses: any[];
}

export const widgetService = {
    async updateWidgetData(data: Partial<WidgetData>) {
        try {
            // 1. Get current data to merge
            const currentDataStr = await AsyncStorage.getItem('widgetData');
            const currentData = currentDataStr ? JSON.parse(currentDataStr) : { todos: [], calendarEvents: [], expenses: [] };

            const newData = { ...currentData, ...data };

            // 2. Save locally for reference
            await AsyncStorage.setItem('widgetData', JSON.stringify(newData));

            // 3. Save to Shared Group (for iOS/Android widgets)
            if (Platform.OS === 'ios') {
                try {
                    await SharedGroupPreferences.setItem('widgetData', newData, APP_GROUP_IDENTIFIER);
                    // Note: In a real native implementation, you would call reloadTimelines() here via a native module
                } catch (error) {
                    console.log('Shared Group Preferences error (iOS):', error);
                }
            } else if (Platform.OS === 'android') {
                try {
                    await SharedGroupPreferences.setItem('widgetData', newData, APP_GROUP_IDENTIFIER);
                    // Trigger Android widget update
                    this.refreshAndroidWidgets();
                } catch (error) {
                    console.log('Shared Group Preferences error (Android):', error);
                }
            }

            console.log('Widget data updated:', Object.keys(data));

        } catch (error) {
            console.error('Failed to update widget data:', error);
        }
    },

    /**
     * Refresh all Android widgets
     */
    refreshAndroidWidgets() {
        if (Platform.OS === 'android') {
            const { AndroidWidgetBridge } = NativeModules;
            if (AndroidWidgetBridge) {
                AndroidWidgetBridge.updateAllWidgets();
                console.log('Android widgets refresh triggered');
            }
        }
    },

    /**
     * Refresh specific Android widget
     */
    refreshAndroidWidget(widgetType: 'schedule' | 'tasks' | 'combined') {
        if (Platform.OS === 'android') {
            const { AndroidWidgetBridge } = NativeModules;
            if (AndroidWidgetBridge) {
                AndroidWidgetBridge.updateWidget(widgetType);
                console.log(`Android ${widgetType} widget refresh triggered`);
            }
        }
    },
};
