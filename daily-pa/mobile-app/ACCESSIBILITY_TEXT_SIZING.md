# Dynamic Text Sizing - Accessibility Guide

## Overview

The app supports dynamic text sizing to accommodate users with different visual needs. Text automatically scales based on the system's text size settings (iOS: Settings > Display & Brightness > Text Size, Android: Settings > Display > Font size).

## Implementation

### Default Behavior

All `Text` components in React Native have `allowFontScaling={true}` by default, which means they automatically respect the user's system text size settings. **Do not disable this** unless absolutely necessary (e.g., for icons or fixed-size UI elements).

### Typography Utilities

We provide typography utilities in `src/utils/typography.ts` for consistent text sizing:

```typescript
import { typography, getFontSize, getLineHeight } from '@/utils/typography';

// Use predefined sizes from the typography scale
const styles = StyleSheet.create({
  heading: {
    fontSize: typography.headlineMedium, // 28
    lineHeight: getLineHeight(typography.headlineMedium, 1.2),
  },
  body: {
    fontSize: typography.bodyLarge, // 16
    lineHeight: getLineHeight(typography.bodyLarge, 1.5),
  },
  caption: {
    fontSize: typography.bodySmall, // 12
    lineHeight: getLineHeight(typography.bodySmall, 1.5),
  },
});
```

### Typography Scale

The app uses a Material Design-inspired type scale:

- **Display**: 36-57px (Large titles, hero text)
- **Headline**: 24-32px (Section headers)
- **Title**: 14-22px (Card titles, list headers)
- **Body**: 12-16px (Main content)
- **Label**: 11-14px (Buttons, captions)

### Best Practices

#### ✅ DO:
- Use the typography scale for consistent sizing
- Allow text to wrap naturally with `numberOfLines` when needed
- Test with different text sizes (Settings > Accessibility > Larger Text)
- Use relative sizing (flex, percentage) for containers
- Provide adequate line height (1.5x for body text, 1.2x for headings)

#### ❌ DON'T:
- Set `allowFontScaling={false}` on user-facing text
- Use fixed heights for text containers
- Rely on text truncation for critical information
- Use very small font sizes (< 12px for body text)

### Testing Dynamic Text Sizing

#### iOS:
1. Go to Settings > Display & Brightness > Text Size
2. Adjust the slider to different sizes
3. Open the app and verify text scales appropriately
4. Test with "Larger Accessibility Sizes" enabled

#### Android:
1. Go to Settings > Display > Font size
2. Select different font sizes (Small, Default, Large, Largest)
3. Open the app and verify text scales appropriately

### Accessibility Requirements

Per WCAG 2.1 Level AA:
- Text must be resizable up to 200% without loss of content or functionality
- Minimum font size for body text: 16px (at default system size)
- Line height: At least 1.5x the font size for body text
- Paragraph spacing: At least 2x the font size

### Current Implementation Status

✅ **Implemented:**
- All Text components support font scaling (default behavior)
- Typography utilities for consistent sizing
- Proper line heights for readability

⏳ **Recommended Improvements:**
- Add maximum font size limits for very large text settings
- Implement responsive layouts that adapt to text size changes
- Add visual regression tests for different text sizes

### Example: Responsive Text Component

```typescript
import React from 'react';
import { Text, StyleSheet } from 'react-native';
import { typography, getLineHeight } from '@/utils/typography';

export const ResponsiveText: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  return (
    <Text style={styles.text} allowFontScaling={true}>
      {children}
    </Text>
  );
};

const styles = StyleSheet.create({
  text: {
    fontSize: typography.bodyLarge,
    lineHeight: getLineHeight(typography.bodyLarge),
    color: '#333',
  },
});
```

## Resources

- [React Native Text Accessibility](https://reactnative.dev/docs/accessibility#text)
- [WCAG 2.1 - Resize Text](https://www.w3.org/WAI/WCAG21/Understanding/resize-text.html)
- [iOS Human Interface Guidelines - Typography](https://developer.apple.com/design/human-interface-guidelines/typography)
- [Material Design - Type Scale](https://m3.material.io/styles/typography/type-scale-tokens)
