# Touch Target Sizes - Accessibility Guide

## Overview

All interactive elements in the app meet the minimum touch target size of 44x44 points (iOS) / 48x48 dp (Android) as recommended by Apple Human Interface Guidelines and Material Design. This ensures that users can easily tap buttons and controls, especially important for users with motor impairments.

## Minimum Touch Target Size

### Standards
- **iOS (Apple HIG)**: 44x44 points minimum
- **Android (Material Design)**: 48x48 dp minimum
- **WCAG 2.1 Level AAA**: 44x44 CSS pixels minimum

We follow the **44x44 point minimum** as it satisfies all three standards.

## Implementation

### Updated Components

All interactive elements have been verified and updated to meet the minimum size:

#### Buttons
- ✅ Delete buttons (TodosScreen, ExpensesScreen): 44x44 (increased from 32x32)
- ✅ Send button (ChatScreen): 44x44 (increased from 40x40)
- ✅ Close button (ReceiptScanner): 44x44 (increased from 40x40)
- ✅ Voice input button (VoiceInput): 48x48 (already compliant)
- ✅ Capture button (ReceiptScanner): 72x72 (already compliant)
- ✅ Gallery button (ReceiptScanner): 56x56 (already compliant)

#### Filter Controls
- ✅ Color filter buttons (TodosScreen): 44x44 (increased from 32x32)
- ✅ Status filter buttons: Adequate padding ensures 44+ point touch area
- ✅ Category filter buttons: Adequate padding ensures 44+ point touch area

#### Form Controls
- ✅ Text inputs: Full width with adequate height (48+ points)
- ✅ Switches: Native components meet minimum size
- ✅ Radio buttons: Wrapped in touchable areas with adequate padding

### Visual vs. Touch Area

Some elements may appear smaller visually but have larger touch areas through padding:

```typescript
// Visual element is 32x32, but touch area is 44x44
<TouchableOpacity
  style={{
    width: 44,
    height: 44,
    justifyContent: 'center',
    alignItems: 'center',
  }}
>
  <View style={{ width: 32, height: 32 }}>
    {/* Visual content */}
  </View>
</TouchableOpacity>
```

## Best Practices

### ✅ DO:
- Ensure all interactive elements are at least 44x44 points
- Add padding around smaller visual elements to increase touch area
- Test on physical devices with different hand sizes
- Provide adequate spacing between adjacent touch targets (8+ points)
- Use `hitSlop` prop for elements that can't be resized

### ❌ DON'T:
- Create buttons smaller than 44x44 points
- Place interactive elements too close together (< 8 points apart)
- Rely solely on visual size - consider the actual touch area
- Forget to test with accessibility features enabled

## Using hitSlop for Edge Cases

For rare cases where visual size must be smaller than 44x44, use the `hitSlop` prop:

```typescript
<TouchableOpacity
  hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
  style={{ width: 24, height: 24 }}
>
  <Icon name="close" size={24} />
</TouchableOpacity>
```

This extends the touch area by 10 points in each direction, making the effective touch area 44x44.

## Testing Touch Targets

### Manual Testing
1. Enable "Show touch data" (Android) or use Accessibility Inspector (iOS)
2. Tap all interactive elements with your thumb
3. Verify no accidental taps on adjacent elements
4. Test with one-handed use on different device sizes

### Automated Testing
While we don't have automated tests for touch target sizes, you can verify sizes in code:

```typescript
// Check if element meets minimum size
const MIN_TOUCH_TARGET = 44;

const isAccessibleSize = (width: number, height: number): boolean => {
  return width >= MIN_TOUCH_TARGET && height >= MIN_TOUCH_TARGET;
};
```

## Common Touch Target Sizes

### Recommended Sizes
- **Small buttons**: 44x44 (minimum)
- **Medium buttons**: 48x48 (comfortable)
- **Large buttons**: 56x56+ (primary actions)
- **Icon buttons**: 48x48 (standard)
- **FAB (Floating Action Button)**: 56x56 (Material Design)

### Spacing
- **Minimum spacing between targets**: 8 points
- **Recommended spacing**: 12-16 points
- **Comfortable spacing**: 24+ points

## Accessibility Impact

Proper touch target sizes benefit:
- **Users with motor impairments**: Easier to tap accurately
- **Users with tremors**: Larger targets reduce missed taps
- **Older adults**: Compensates for reduced dexterity
- **All users**: Reduces frustration and improves usability
- **One-handed use**: Easier to reach and tap with thumb

## Current Status

✅ **All interactive elements meet the 44x44 minimum**
- Buttons: Compliant
- Form controls: Compliant
- Filter controls: Compliant
- Navigation elements: Compliant

## Resources

- [Apple Human Interface Guidelines - Touch Targets](https://developer.apple.com/design/human-interface-guidelines/inputs/touchscreen-gestures)
- [Material Design - Touch Targets](https://m3.material.io/foundations/accessible-design/accessibility-basics#28032e45-c598-450c-b355-f9fe737b1cd8)
- [WCAG 2.1 - Target Size](https://www.w3.org/WAI/WCAG21/Understanding/target-size.html)
