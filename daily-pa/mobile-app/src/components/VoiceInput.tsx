/**
 * Voice Input Component
 * Handles voice recording and transcription for AI assistant
 */

import React, { useState } from 'react';
import {
  View,
  TouchableOpacity,
  Text,
  StyleSheet,
  Alert,
  ActivityIndicator,
} from 'react-native';
import { Audio } from 'expo-av';
import * as Speech from 'expo-speech';
import { Ionicons } from '@expo/vector-icons';

interface VoiceInputProps {
  onTranscriptionComplete: (text: string) => void;
  disabled?: boolean;
}

export const VoiceInput: React.FC<VoiceInputProps> = ({
  onTranscriptionComplete,
  disabled = false,
}) => {
  const [isRecording, setIsRecording] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [recording, setRecording] = useState<Audio.Recording | null>(null);

  /**
   * Request microphone permissions
   */
  const requestPermissions = async (): Promise<boolean> => {
    try {
      const { status } = await Audio.requestPermissionsAsync();
      if (status !== 'granted') {
        Alert.alert(
          'Permission Required',
          'Please grant microphone permission to use voice input.'
        );
        return false;
      }
      return true;
    } catch (error) {
      console.error('Failed to request permissions:', error);
      return false;
    }
  };

  /**
   * Start recording audio
   */
  const startRecording = async () => {
    try {
      // Request permissions
      const hasPermission = await requestPermissions();
      if (!hasPermission) {
        return;
      }

      // Configure audio mode for recording
      await Audio.setAudioModeAsync({
        allowsRecordingIOS: true,
        playsInSilentModeIOS: true,
      });

      // Create and start recording
      const { recording: newRecording } = await Audio.Recording.createAsync(
        Audio.RecordingOptionsPresets.HIGH_QUALITY
      );

      setRecording(newRecording);
      setIsRecording(true);
    } catch (error) {
      console.error('Failed to start recording:', error);
      Alert.alert('Error', 'Failed to start recording. Please try again.');
    }
  };

  /**
   * Stop recording and process audio
   */
  const stopRecording = async () => {
    if (!recording) {
      return;
    }

    try {
      setIsRecording(false);
      setIsProcessing(true);

      // Stop and unload recording
      await recording.stopAndUnloadAsync();
      await Audio.setAudioModeAsync({
        allowsRecordingIOS: false,
      });

      // Get recording URI
      const uri = recording.getURI();
      
      if (!uri) {
        throw new Error('No recording URI available');
      }

      // For now, we'll use a placeholder transcription
      // In a real implementation, you would:
      // 1. Upload the audio file to a speech-to-text service (Google Cloud Speech, AWS Transcribe, etc.)
      // 2. Get the transcription result
      // 3. Pass it to the callback
      
      // Placeholder: Show alert asking user to type instead
      Alert.alert(
        'Voice Input',
        'Voice transcription requires a speech-to-text service. For now, please type your message.',
        [
          {
            text: 'OK',
            onPress: () => {
              // Clean up
              setRecording(null);
              setIsProcessing(false);
            },
          },
        ]
      );

      // TODO: Implement actual speech-to-text
      // const transcription = await transcribeAudio(uri);
      // onTranscriptionComplete(transcription);
      
    } catch (error) {
      console.error('Failed to stop recording:', error);
      Alert.alert('Error', 'Failed to process recording. Please try again.');
    } finally {
      setRecording(null);
      setIsProcessing(false);
    }
  };

  /**
   * Handle voice button press
   */
  const handlePress = async () => {
    if (isRecording) {
      await stopRecording();
    } else {
      await startRecording();
    }
  };

  return (
    <View style={styles.container}>
      <TouchableOpacity
        style={[
          styles.button,
          isRecording && styles.buttonRecording,
          (disabled || isProcessing) && styles.buttonDisabled,
        ]}
        onPress={handlePress}
        disabled={disabled || isProcessing}
        accessible={true}
        accessibilityLabel={isRecording ? 'Stop recording' : 'Start voice recording'}
        accessibilityHint={
          isProcessing 
            ? 'Processing voice input' 
            : isRecording 
            ? 'Tap to stop recording your voice message' 
            : 'Tap to start recording a voice message'
        }
        accessibilityRole="button"
        accessibilityState={{ 
          disabled: disabled || isProcessing,
          busy: isProcessing || isRecording,
        }}
      >
        {isProcessing ? (
          <ActivityIndicator size="small" color="#FFF" />
        ) : (
          <Ionicons
            name={isRecording ? 'stop' : 'mic'}
            size={24}
            color="#FFF"
            accessible={false}
          />
        )}
      </TouchableOpacity>
      
      {isRecording && (
        <View 
          style={styles.recordingIndicator}
          accessible={true}
          accessibilityLabel="Recording in progress"
          accessibilityLiveRegion="polite"
        >
          <View style={styles.recordingDot} accessible={false} />
          <Text style={styles.recordingText} accessible={false}>Recording...</Text>
        </View>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
  },
  button: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: '#007AFF',
    alignItems: 'center',
    justifyContent: 'center',
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
  },
  buttonRecording: {
    backgroundColor: '#FF3B30',
  },
  buttonDisabled: {
    backgroundColor: '#CCC',
  },
  recordingIndicator: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 8,
  },
  recordingDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#FF3B30',
    marginRight: 6,
  },
  recordingText: {
    fontSize: 12,
    color: '#FF3B30',
    fontWeight: '600',
  },
});
