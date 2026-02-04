// src/services/androidWidgetBridge.ts
import { NativeModules, Platform } from 'react-native';

const { AndroidWidgetBridge } = NativeModules;

export const androidWidgetBridge = {
  /**
   * Request widget update for all widgets
   */
  updateAllWidgets(): void {
    if (Platform.OS === 'android' && AndroidWidgetBridge) {
      AndroidWidgetBridge.updateAllWidgets();
    }
  },

  /**
   * Request update for specific widget type
   * @param widgetType - 'schedule', 'tasks', or 'combined'
   */
  updateWidget(widgetType: 'schedule' | 'tasks' | 'combined'): void {
    if (Platform.OS === 'android' && AndroidWidgetBridge) {
      AndroidWidgetBridge.updateWidget(widgetType);
    }
  },

  /**
   * Update widget data and refresh
   */
  async updateWidgetData(data: {
    todos?: any[];
    calendarEvents?: any[];
    expenses?: any[];
  }): Promise<void> {
    if (Platform.OS === 'android') {
      // Data is already saved via SharedGroupPreferences in widgetService
      // Now we just need to trigger the update
      this.updateAllWidgets();
    }
  },
};
