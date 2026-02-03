import React from 'react';
import { InputAccessoryView, View, Button, StyleSheet, Keyboard, Platform } from 'react-native';

interface InputAccessoryProps {
    id: string;
}

export const InputAccessory: React.FC<InputAccessoryProps> = ({ id }) => {
    if (Platform.OS !== 'ios') return null;

    return (
        <InputAccessoryView nativeID={id}>
            <View style={styles.accessory}>
                <View style={{ flex: 1 }} />
                <Button onPress={() => Keyboard.dismiss()} title="Done" />
            </View>
        </InputAccessoryView>
    );
};

const styles = StyleSheet.create({
    accessory: {
        width: '100%',
        height: 44,
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'flex-end',
        backgroundColor: '#F8F9FA',
        paddingRight: 16,
        borderTopWidth: 1,
        borderTopColor: '#E9ECEF',
    },
});
