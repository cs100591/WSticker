---
description: How to setup In-App Purchases (Subscriptions)
---

# Setting up Subscriptions (End-to-End)

Implementing subscriptions requires both **App Store Configuration** and **Code Implementation**.

## Part 1: Service Configuration (No Code)

You need a "middleman" to handle the complex validation logic. We recommend **RevenueCat** (it's free for up to $2.5k/month and saves months of work).

1.  **Create RevenueCat Account**: Go to [RevenueCat](https://www.revenuecat.com/) and create two apps (iOS and Android).
2.  **Google Play Console**:
    *   Go to **Monetize > Products > Subscriptions**.
    *   Create a subscription (e.g., `dailypa_monthly`).
    *   Set the price and billing period.
3.  **App Store Connect (Apple)**:
    *   Go to **Features > Subscriptions**.
    *   Create a generic "Subscription Group" (e.g., `DailyPA Pro`).
    *   Create a Product (e.g., `dailypa_monthly_ios`).
4.  **Link to RevenueCat**:
    *   In RevenueCat dashboard, go to **Entitlements** and create one called `pro_access`.
    *   Attach your Google and Apple products to this Entitlement.
    *   Get your **Public API Keys** from the RevenueCat dashboard.

## Part 2: Coding (Already Started)

I have created `src/services/SubscriptionService.ts` for you.

1.  **Install the Library**:
    ```bash
    npx expo install react-native-purchases
    ```
2.  **Add Keys**:
    *   Open `src/services/SubscriptionService.ts`.
    *   Paste your RevenueCat API Keys in `API_KEYS`.
3.  **Initialize**:
    *   In `App.tsx`, inside `useEffect`, call `subscriptionService.initialize(userId)`.
4.  **Create Paywall Screen**:
    *   Create a screen that shows the features.
    *   Use `subscriptionService.getOfferings()` to show the price button.
    *   Call `subscriptionService.purchase(package)` when clicked.

## Part 3: Testing

*   **Android**: You MUST upload a build to **Internal Testing** track on Google Play Console to test real purchases (you can't test on emulator effectively).
*   **iOS**: You can test in the Simulator (Sandbox environment) or TestFlight.
