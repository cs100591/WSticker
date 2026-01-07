# Implementation Plan: AI Assistant Redesign

## Overview

Transform the AI Assistant from a dashboard card to a floating action button with a minimalist Mac-style chat modal. Implementation follows a component-by-component approach, ensuring each piece works before integration.

## Tasks

- [x] 1. Create AIAssistantFAB component
  - Create new component file `daily-pa/src/components/chat/AIAssistantFAB.tsx`
  - Implement floating button with glassmorphism styling
  - Add icon toggle (Sparkles ↔ X) based on isOpen prop
  - Position fixed bottom-6 right-6
  - _Requirements: 1.1, 1.3, 1.4_

- [x] 2. Redesign AIChatbot component with Mac-style aesthetics
  - [x] 2.1 Refactor modal container and animations
    - Update modal backdrop with subtle blur
    - Add scale+fade entrance animation (200ms)
    - Use rounded-2xl corners (16px)
    - Reduce modal size to max-w-sm for cleaner look
    - _Requirements: 2.1, 2.2, 6.1_

  - [x] 2.2 Simplify message bubbles
    - User messages: bg-blue-50, rounded-2xl rounded-br-sm
    - Assistant messages: bg-gray-50, rounded-2xl rounded-bl-sm
    - Remove avatar icons for cleaner look
    - Use 14-15px font size
    - Add subtle slide-up animation for new messages
    - _Requirements: 3.1, 3.2, 3.3, 3.4, 6.2_

  - [x] 2.3 Redesign compact action cards
    - Create horizontal single-line layout
    - Structure: [TypeIcon] [Title/Amount] [Category/Date] [✓] [✗]
    - Use muted colors (gray-50 base, green-50 confirmed)
    - Add smooth color transition on status change
    - _Requirements: 4.1, 4.2, 4.3, 4.4, 4.5, 6.3_

  - [x] 2.4 Streamline input area
    - Single-line input with placeholder
    - Small icon-only buttons for camera and voice
    - Conditional send button (only when input has content)
    - Subtle red pulse for voice recording state
    - _Requirements: 5.1, 5.2, 5.3, 5.4_

  - [x] 2.5 Update header to minimal design
    - Remove title text, use small icon only
    - Single close button
    - Thin bottom border
    - _Requirements: 2.5_

  - [x] 2.6 Improve loading indicator
    - Replace spinner with typing dots animation
    - Three dots with staggered opacity animation
    - _Requirements: 6.4_

- [x] 3. Update dashboard to use FAB
  - [x] 3.1 Remove AI Assistant card from dashboard
    - Delete the GlassCard with AI chatbot content
    - Remove ReceiptScanner card/button (now in chat)
    - Clean up unused imports
    - _Requirements: 7.1_

  - [x] 3.2 Add FAB to dashboard layout
    - Import and render AIAssistantFAB
    - Wire up state management for modal open/close
    - _Requirements: 7.2_

- [x] 4. Checkpoint - Visual review
  - Ensure all tests pass, ask the user if questions arise.
  - Verify Mac-style aesthetics are consistent
  - Test on mobile viewport

- [ ]* 5. Write property test for send button visibility
  - **Property 1: Send Button Visibility**
  - Test that send button is visible iff input has non-whitespace content
  - Use fast-check to generate random input strings
  - **Validates: Requirements 5.3**

- [x] 6. Final cleanup and polish
  - Remove any unused code from old implementation
  - Ensure voice language selector works via context menu
  - Test camera/receipt scanning flow
  - _Requirements: 5.5, 7.3_

- [x] 7. Final checkpoint
  - Ensure all tests pass, ask the user if questions arise.
  - Full functionality verification

## Notes

- Tasks marked with `*` are optional and can be skipped for faster MVP
- The redesign maintains all existing functionality while improving aesthetics
- Focus on subtle animations that feel native to macOS
- Use Tailwind CSS classes for all styling (no custom CSS files needed)
