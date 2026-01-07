# Design Document: AI Assistant Redesign

## Overview

This design transforms the AI Assistant from a dashboard card into a floating action button (FAB) with a minimalist, Mac-style chat modal. The redesign focuses on clean aesthetics, subtle animations, and a distraction-free user experience inspired by Apple's design language.

## Architecture

```
┌─────────────────────────────────────────────────────────┐
│                    Dashboard Layout                      │
│  ┌─────────────────────────────────────────────────┐   │
│  │              Main Content Area                   │   │
│  │         (Stats, Quick Actions, etc.)            │   │
│  │                                                  │   │
│  │                                                  │   │
│  └─────────────────────────────────────────────────┘   │
│                                              ┌─────┐   │
│                                              │ FAB │   │
│                                              └─────┘   │
└─────────────────────────────────────────────────────────┘

When FAB clicked:
┌─────────────────────────────────────────────────────────┐
│                    Dashboard Layout                      │
│  ┌─────────────────────────────────────────────────┐   │
│  │              Main Content (dimmed)               │   │
│  │                                                  │   │
│  │         ┌─────────────────────────┐             │   │
│  │         │     Chat Modal          │             │   │
│  │         │  ┌─────────────────┐   │             │   │
│  │         │  │    Messages     │   │             │   │
│  │         │  └─────────────────┘   │             │   │
│  │         │  ┌─────────────────┐   │             │   │
│  │         │  │  Input Area     │   │             │   │
│  │         │  └─────────────────┘   │             │   │
│  │         └─────────────────────────┘             │   │
│  └─────────────────────────────────────────────────┘   │
└─────────────────────────────────────────────────────────┘
```

## Components and Interfaces

### 1. AIAssistantFAB Component

A floating action button that serves as the entry point to the AI assistant.

```typescript
interface AIAssistantFABProps {
  onClick: () => void;
  isOpen: boolean;
}

// Positioning: fixed, bottom-6, right-6
// Size: 56px (w-14 h-14)
// Style: Glassmorphism with subtle shadow
// Icon: Sparkles when closed, X when open
```

### 2. AIChatModal Component (Redesigned)

The main chat interface with Mac-style aesthetics.

```typescript
interface AIChatModalProps {
  isOpen: boolean;
  onClose: () => void;
}

// Size: max-w-md, max-h-[70vh]
// Position: Fixed, centered or bottom-right anchored
// Animation: scale + opacity transition (200ms)
```

### 3. ChatMessage Component

Simplified message bubble design.

```typescript
interface ChatMessageProps {
  role: 'user' | 'assistant';
  content: string;
  actions?: ActionItem[];
}

// User: bg-blue-50, text-gray-800, rounded-2xl rounded-br-sm
// Assistant: bg-gray-50, text-gray-800, rounded-2xl rounded-bl-sm
// Font: 14px, line-height 1.5
```

### 4. CompactActionCard Component

Streamlined action confirmation cards.

```typescript
interface CompactActionCardProps {
  action: ActionItem;
  onConfirm: () => void;
  onCancel: () => void;
}

// Layout: Horizontal, single line when possible
// Structure: [Icon] [Title/Amount] [Date/Category] [✓] [✗]
// Colors: Muted backgrounds (gray-50, green-50, etc.)
```

### 5. MinimalInput Component

Clean input area with contextual controls.

```typescript
interface MinimalInputProps {
  value: string;
  onChange: (value: string) => void;
  onSend: () => void;
  onVoice: () => void;
  onCamera: () => void;
  isListening: boolean;
  isLoading: boolean;
}

// Layout: [Camera] [Voice] [Input Field] [Send?]
// Send button: Only visible when input has content
// Voice indicator: Subtle red pulse when active
```

## Data Models

No changes to existing data models. The redesign is purely UI/UX focused.

## Correctness Properties

*A property is a characteristic or behavior that should hold true across all valid executions of a system—essentially, a formal statement about what the system should do. Properties serve as the bridge between human-readable specifications and machine-verifiable correctness guarantees.*

### Property 1: Send Button Visibility

*For any* input state, the send button SHALL be visible if and only if the input field contains non-whitespace characters.

**Validates: Requirements 5.3**

### Property 2: Functionality Preservation

*For any* user action (send message, confirm action, voice input, camera scan), the system SHALL produce the same result as the previous implementation.

**Validates: Requirements 7.3**

## Error Handling

- **Camera Permission Denied**: Show inline message in camera area, allow file upload fallback
- **Voice Recognition Unavailable**: Hide voice button gracefully
- **API Errors**: Display error in chat as assistant message with retry suggestion
- **Network Timeout**: Show subtle error indicator, auto-retry once

## Testing Strategy

### Unit Tests
- FAB renders correctly and toggles chat modal
- Chat modal opens/closes with correct state
- Action cards display correct information
- Input field handles text entry and submission

### Property-Based Tests
- **Property 1**: Generate random input strings, verify send button visibility matches non-empty trimmed input
- **Property 2**: Compare action execution results between old and new implementations

### Integration Tests
- Full chat flow: send message → receive response → confirm action
- Voice input flow: start recording → transcribe → populate input
- Camera flow: capture → scan → display result → save expense

## Visual Design Specifications

### Color Palette (Mac-inspired)
```css
--bg-primary: #ffffff;
--bg-secondary: #f5f5f7;
--bg-tertiary: #e8e8ed;
--text-primary: #1d1d1f;
--text-secondary: #86868b;
--accent-blue: #007aff;
--accent-blue-light: #e8f4fd;
--success: #34c759;
--error: #ff3b30;
```

### Typography
```css
--font-family: -apple-system, BlinkMacSystemFont, 'SF Pro Text', sans-serif;
--font-size-sm: 13px;
--font-size-base: 15px;
--font-size-lg: 17px;
--line-height: 1.47;
```

### Spacing & Sizing
```css
--radius-sm: 8px;
--radius-md: 12px;
--radius-lg: 16px;
--radius-xl: 20px;
--spacing-xs: 4px;
--spacing-sm: 8px;
--spacing-md: 12px;
--spacing-lg: 16px;
--spacing-xl: 24px;
```

### Animations
```css
/* Modal entrance */
@keyframes modalIn {
  from { opacity: 0; transform: scale(0.95) translateY(10px); }
  to { opacity: 1; transform: scale(1) translateY(0); }
}

/* Message entrance */
@keyframes messageIn {
  from { opacity: 0; transform: translateY(8px); }
  to { opacity: 1; transform: translateY(0); }
}

/* Typing indicator */
@keyframes typingDot {
  0%, 60%, 100% { opacity: 0.3; }
  30% { opacity: 1; }
}
```
