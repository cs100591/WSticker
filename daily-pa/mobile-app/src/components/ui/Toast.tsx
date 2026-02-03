/**
 * Toast - In-app notification feedback
 * Success, error, warning, and info messages
 */

import React, { useEffect, useRef, useState } from 'react';
import {
  View,
  Text,
  Animated,
  StyleSheet,
  Dimensions,
  TouchableOpacity,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';

const { width } = Dimensions.get('window');

type ToastType = 'success' | 'error' | 'warning' | 'info';

interface ToastOptions {
  message: string;
  type?: ToastType;
  duration?: number;
}

interface ToastState extends ToastOptions {
  id: number;
  visible: boolean;
}

// Global toast controller
let toastController: {
  show: (options: ToastOptions) => void;
  hide: () => void;
} | null = null;

export function showToast(options: ToastOptions) {
  toastController?.show(options);
}

export function hideToast() {
  toastController?.hide();
}

// Toast component to be placed at root level
export function ToastContainer() {
  const [toast, setToast] = useState<ToastState | null>(null);
  const translateY = useRef(new Animated.Value(-100)).current;
  const opacity = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    toastController = {
      show: (options) => {
        const id = Date.now();
        setToast({ ...options, id, visible: true, type: options.type || 'info' });
      },
      hide: () => {
        hideAnimation();
      },
    };
    return () => { toastController = null; };
  }, []);

  useEffect(() => {
    if (toast?.visible) {
      showAnimation();
      const timer = setTimeout(() => {
        hideAnimation();
      }, toast.duration || 3000);
      return () => clearTimeout(timer);
    }
  }, [toast]);

  const showAnimation = () => {
    Animated.parallel([
      Animated.spring(translateY, {
        toValue: 60,
        useNativeDriver: true,
        friction: 8,
      }),
      Animated.timing(opacity, {
        toValue: 1,
        duration: 200,
        useNativeDriver: true,
      }),
    ]).start();
  };

  const hideAnimation = () => {
    Animated.parallel([
      Animated.timing(translateY, {
        toValue: -100,
        duration: 200,
        useNativeDriver: true,
      }),
      Animated.timing(opacity, {
        toValue: 0,
        duration: 200,
        useNativeDriver: true,
      }),
    ]).start(() => setToast(null));
  };

  if (!toast) return null;

  const { type = 'info', message } = toast;
  const config = toastConfig[type];

  return (
    <Animated.View
      style={[
        styles.container,
        { transform: [{ translateY }], opacity, backgroundColor: config.bg },
      ]}
    >
      <Ionicons name={config.icon} size={20} color={config.color} />
      <Text style={[styles.message, { color: config.color }]} numberOfLines={2}>
        {message}
      </Text>
      <TouchableOpacity onPress={hideAnimation}>
        <Ionicons name="close" size={18} color={config.color} />
      </TouchableOpacity>
    </Animated.View>
  );
}

const toastConfig: Record<ToastType, { icon: any; bg: string; color: string }> = {
  success: {
    icon: 'checkmark-circle',
    bg: '#D1FAE5',
    color: '#059669',
  },
  error: {
    icon: 'alert-circle',
    bg: '#FEE2E2',
    color: '#DC2626',
  },
  warning: {
    icon: 'warning',
    bg: '#FEF3C7',
    color: '#D97706',
  },
  info: {
    icon: 'information-circle',
    bg: '#DBEAFE',
    color: '#2563EB',
  },
};

const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    top: 0,
    left: 16,
    right: 16,
    flexDirection: 'row',
    alignItems: 'center',
    padding: 12,
    borderRadius: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 5,
    zIndex: 9999,
  },
  message: {
    flex: 1,
    marginHorizontal: 10,
    fontSize: 14,
    fontFamily: 'Poppins_500Medium',
  },
});

// Helper functions
export const Toast = {
  success: (message: string) => showToast({ message, type: 'success' }),
  error: (message: string) => showToast({ message, type: 'error' }),
  warning: (message: string) => showToast({ message, type: 'warning' }),
  info: (message: string) => showToast({ message, type: 'info' }),
};
