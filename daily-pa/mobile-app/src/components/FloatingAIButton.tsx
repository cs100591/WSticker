import React, { useRef, useState } from 'react';
import {
    View,
    Text,
    StyleSheet,
    PanResponder,
    Animated,
    TouchableOpacity,
    Dimensions,
    Platform,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';
import { useChatbot } from '@/contexts/ChatbotContext';

const BUTTON_SIZE = 60;

export const FloatingAIButton = () => {
    const navigation = useNavigation<any>();
    const { openChatbot } = useChatbot();
    const { width, height } = Dimensions.get('window');

    // Initial position (bottom right, but slightly up to avoid tab bar)
    const pan = useRef(new Animated.ValueXY({ x: width - BUTTON_SIZE - 20, y: height - 180 })).current;
    const [isDragging, setIsDragging] = useState(false);

    const panResponder = useRef(
        PanResponder.create({
            onStartShouldSetPanResponder: () => true,
            onMoveShouldSetPanResponder: (_, gestureState) => {
                // Only claim responder if moved significantly
                return Math.abs(gestureState.dx) > 5 || Math.abs(gestureState.dy) > 5;
            },
            onPanResponderGrant: () => {
                pan.setOffset({
                    x: (pan.x as any)._value,
                    y: (pan.y as any)._value,
                });
                pan.setValue({ x: 0, y: 0 });
                setIsDragging(true);
            },
            onPanResponderMove: Animated.event(
                [null, { dx: pan.x, dy: pan.y }],
                { useNativeDriver: false }
            ),
            onPanResponderRelease: (_, gestureState) => {
                pan.flattenOffset();
                setIsDragging(false);

                // Optional: Snap to edge logic could go here

                // If it was a tap (not a drag), open chat
                if (Math.abs(gestureState.dx) < 5 && Math.abs(gestureState.dy) < 5) {
                    openChatbot();
                }
            },
        })
    ).current;

    return (
        <Animated.View
            style={[
                styles.container,
                {
                    transform: [{ translateX: pan.x }, { translateY: pan.y }],
                },
            ]}
            {...panResponder.panHandlers}
        >
            <View style={styles.button}>
                {/* Brain Icon / AI Icon */}
                <View style={styles.iconContainer}>
                    <Ionicons name="hardware-chip-outline" size={32} color="#FFF" />
                </View>
            </View>
        </Animated.View>
    );
};

const styles = StyleSheet.create({
    container: {
        position: 'absolute',
        left: 0,
        top: 0,
        zIndex: 9999, // Ensure it's on top
        shadowColor: '#000',
        shadowOffset: {
            width: 0,
            height: 4,
        },
        shadowOpacity: 0.3,
        shadowRadius: 4.65,
        elevation: 8,
    },
    button: {
        width: BUTTON_SIZE,
        height: BUTTON_SIZE,
        borderRadius: BUTTON_SIZE / 2,
        backgroundColor: '#3B82F6', // AI Blue
        justifyContent: 'center',
        alignItems: 'center',
        borderWidth: 2,
        borderColor: '#fff',
    },
    iconContainer: {
        justifyContent: 'center',
        alignItems: 'center',
    },
});
