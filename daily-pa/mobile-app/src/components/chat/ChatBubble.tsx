/**
import { FONTS } from '@/theme/fonts';
 * Modern Chat Message Bubble Component
 * Sleek, polished message styling
 */

import React from 'react';
import { View, Text, StyleSheet, Animated } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

interface ChatBubbleProps {
  text: string;
  isUser: boolean;
  timestamp?: Date;
  isFirst?: boolean;
  isLast?: boolean;
}

export const ChatBubble: React.FC<ChatBubbleProps> = ({ 
  text, 
  isUser, 
  isFirst = true,
  isLast = true 
}) => {
  return (
    <View style={[
      styles.container,
      isUser ? styles.userContainer : styles.aiContainer
    ]}>
      {/* AI Avatar */}
      {!isUser && isFirst && (
        <View style={styles.avatar}>
          <Ionicons name="sparkles" size={16} color="#FFF" />
        </View>
      )}
      
      {/* Message Bubble */}
      <View style={[
        styles.bubble,
        isUser ? styles.userBubble : styles.aiBubble,
        isFirst && isUser && styles.userFirst,
        isFirst && !isUser && styles.aiFirst,
        isLast && isUser && styles.userLast,
        isLast && !isUser && styles.aiLast,
      ]}>
        <Text style={[
          styles.text,
          isUser ? styles.userText : styles.aiText
        ]}>
          {text}
        </Text>
      </View>
      
      {/* User Indicator */}
      {isUser && isFirst && (
        <View style={[styles.avatar, styles.userAvatar]}>
          <Ionicons name="person" size={14} color="#FFF" />
        </View>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    marginVertical: 4,
    paddingHorizontal: 12,
  },
  userContainer: {
    justifyContent: 'flex-end',
  },
  aiContainer: {
    justifyContent: 'flex-start',
  },
  avatar: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: '#3B82F6',
    justifyContent: 'center',
    alignItems: 'center',
    marginHorizontal: 8,
    shadowColor: '#3B82F6',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
    elevation: 3,
  },
  userAvatar: {
    backgroundColor: '#64748B',
    shadowColor: '#64748B',
  },
  bubble: {
    maxWidth: '75%',
    paddingHorizontal: 16,
    paddingVertical: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  userBubble: {
    backgroundColor: '#3B82F6',
    borderRadius: 20,
    borderBottomRightRadius: 6,
  },
  aiBubble: {
    backgroundColor: '#FFFFFF',
    borderRadius: 20,
    borderBottomLeftRadius: 6,
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  userFirst: {
    borderTopRightRadius: 20,
  },
  aiFirst: {
    borderTopLeftRadius: 20,
  },
  userLast: {
    borderBottomRightRadius: 6,
  },
  aiLast: {
    borderBottomLeftRadius: 6,
  },
  text: {
    fontSize: 15,
    lineHeight: 22,
  },
  userText: {
    color: '#FFFFFF',
    fontFamily: FONTS.medium,
  },
  aiText: {
    color: '#1E293B',
    fontFamily: FONTS.regular,
  },
});
