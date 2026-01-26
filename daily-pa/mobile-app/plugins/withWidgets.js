/**
 * Config Plugin for Daily PA Widgets (Android)
 * iOS widgets require manual Xcode setup, these are placeholders for Android.
 */
const { withProjectBuildGradle, withAndroidManifest } = require('@expo/config-plugins');

const withAndroidWidgets = (config) => {
    // 1. Add Android Widget configuration to AndroidManifest.xml
    config = withAndroidManifest(config, async (config) => {
        const mainApplication = config.modResults.manifest.application[0];

        // Add Receiver for Widget
        const receiver = {
            $: {
                'android:name': '.DailySummaryWidget',
                'android:label': 'Daily PA Widget',
                'android:exported': 'true', // Changed to true for broadcast
            },
            'intent-filter': [
                {
                    action: [
                        { $: { 'android:name': 'android.appwidget.action.APPWIDGET_UPDATE' } },
                    ],
                },
            ],
            'meta-data': [
                {
                    $: {
                        'android:name': 'android.appwidget.provider',
                        'android:resource': '@xml/daily_pa_widget_info',
                    },
                },
            ],
        };

        if (!mainApplication.receiver) {
            mainApplication.receiver = [];
        }
        // Check if duplicate exists before adding? Simplified for now.
        mainApplication.receiver.push(receiver);

        return config;
    });

    return config;
};

module.exports = withAndroidWidgets;
