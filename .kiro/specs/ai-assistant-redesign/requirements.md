# Requirements Document

## Introduction

Redesign the AI Assistant component in CLASP to achieve a cleaner, more elegant Mac-style UI/UX. The current implementation has the AI assistant entry point in a card on the dashboard, but it needs to be relocated and redesigned for better user experience with a minimalist, Apple-inspired aesthetic.

## Glossary

- **AI_Assistant**: The conversational AI interface that helps users create todos, record expenses, and schedule calendar events
- **Chat_Modal**: The floating dialog that contains the chat conversation
- **Action_Card**: UI element displaying a pending action (todo/expense/calendar) for user confirmation
- **Voice_Input**: Speech recognition feature for hands-free input
- **Receipt_Scanner**: Camera-based OCR feature for scanning receipts

## Requirements

### Requirement 1: Floating Action Button Entry Point

**User Story:** As a user, I want a subtle floating button to access the AI assistant, so that I can quickly start a conversation without cluttering the main interface.

#### Acceptance Criteria

1. THE System SHALL display a floating action button (FAB) in the bottom-right corner of the dashboard
2. WHEN the user clicks the FAB, THE System SHALL open the chat modal with a smooth animation
3. THE FAB SHALL use a minimal design with subtle glassmorphism effect
4. WHILE the chat is open, THE FAB SHALL transform into a close indicator

### Requirement 2: Minimalist Chat Modal Design

**User Story:** As a user, I want a clean chat interface that feels native to macOS, so that the experience is pleasant and distraction-free.

#### Acceptance Criteria

1. THE Chat_Modal SHALL use a clean white/light gray background with subtle blur effect
2. THE Chat_Modal SHALL have rounded corners (16-20px radius) matching macOS window style
3. THE Chat_Modal SHALL display messages with minimal visual noise
4. THE System SHALL use SF Pro-inspired typography with proper hierarchy
5. THE Chat_Modal SHALL have a compact header with only essential controls

### Requirement 3: Simplified Message Bubbles

**User Story:** As a user, I want message bubbles that are easy to read without excessive styling, so that I can focus on the conversation content.

#### Acceptance Criteria

1. THE System SHALL display user messages with a subtle blue tint (not saturated)
2. THE System SHALL display assistant messages with a light gray background
3. THE message bubbles SHALL have minimal padding and subtle shadows
4. THE System SHALL use consistent, readable font sizes (14-15px)

### Requirement 4: Elegant Action Cards

**User Story:** As a user, I want action confirmations that are compact and non-intrusive, so that I can quickly review and confirm without visual overload.

#### Acceptance Criteria

1. THE Action_Card SHALL use a compact single-line or two-line layout
2. THE Action_Card SHALL display type icon, key info, and action buttons inline
3. THE confirm/cancel buttons SHALL be minimal (icon-only or small text)
4. WHEN confirmed, THE Action_Card SHALL show a subtle checkmark animation
5. THE Action_Card SHALL use muted colors that don't compete with message content

### Requirement 5: Streamlined Input Area

**User Story:** As a user, I want a clean input area with intuitive controls, so that I can easily type, speak, or scan receipts.

#### Acceptance Criteria

1. THE input area SHALL have a single-line text field with placeholder text
2. THE camera and voice buttons SHALL be small, icon-only buttons
3. THE send button SHALL only appear when there is text to send
4. WHILE voice recording, THE System SHALL show a subtle pulsing indicator
5. THE voice language selector SHALL be accessible via long-press or context menu

### Requirement 6: Smooth Animations and Transitions

**User Story:** As a user, I want smooth animations that feel natural, so that the interface feels responsive and polished.

#### Acceptance Criteria

1. THE Chat_Modal SHALL animate in with a scale+fade effect (200-300ms)
2. THE messages SHALL animate in with a subtle slide-up effect
3. THE Action_Card status changes SHALL use smooth color transitions
4. THE loading indicator SHALL use a minimal typing dots animation

### Requirement 7: Remove Dashboard Card

**User Story:** As a user, I want the AI assistant accessible only via the FAB, so that the dashboard remains clean and focused on data.

#### Acceptance Criteria

1. THE System SHALL remove the AI Assistant card from the dashboard
2. THE FAB SHALL be the primary entry point for the AI assistant
3. THE System SHALL maintain all existing functionality (chat, voice, camera)
