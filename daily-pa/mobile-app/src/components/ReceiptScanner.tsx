/**
 * Receipt Scanner Component
 * Camera integration for scanning receipts
 */

import React, { useState, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Modal,
  Image,
  Alert,
  ActivityIndicator,
} from 'react-native';
import { CameraView, CameraType, useCameraPermissions } from 'expo-camera';
import * as ImagePicker from 'expo-image-picker';

interface ReceiptScannerProps {
  visible: boolean;
  onClose: () => void;
  onImageCaptured: (uri: string) => void;
}

export const ReceiptScanner: React.FC<ReceiptScannerProps> = ({
  visible,
  onClose,
  onImageCaptured,
}) => {
  const [permission, requestPermission] = useCameraPermissions();
  const [capturedImage, setCapturedImage] = useState<string | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const cameraRef = useRef<CameraView>(null);

  const handleRequestPermission = async () => {
    const result = await requestPermission();
    if (!result.granted) {
      Alert.alert(
        'Permission Required',
        'Camera permission is required to scan receipts.'
      );
    }
  };

  const handleCapture = async () => {
    if (!cameraRef.current) return;

    try {
      setIsProcessing(true);
      const photo = await cameraRef.current.takePictureAsync({
        quality: 0.8,
      });
      
      if (photo?.uri) {
        setCapturedImage(photo.uri);
      }
    } catch (error) {
      console.error('Error capturing photo:', error);
      Alert.alert('Error', 'Failed to capture photo');
    } finally {
      setIsProcessing(false);
    }
  };

  const handlePickFromGallery = async () => {
    try {
      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ['images'],
        allowsEditing: true,
        quality: 0.8,
      });

      if (!result.canceled && result.assets[0]) {
        setCapturedImage(result.assets[0].uri);
      }
    } catch (error) {
      console.error('Error picking image:', error);
      Alert.alert('Error', 'Failed to pick image');
    }
  };

  const handleAccept = () => {
    if (capturedImage) {
      onImageCaptured(capturedImage);
      handleClose();
    }
  };

  const handleRetake = () => {
    setCapturedImage(null);
  };

  const handleClose = () => {
    setCapturedImage(null);
    onClose();
  };

  if (!visible) return null;

  // Permission not granted yet
  if (!permission) {
    return (
      <Modal visible={visible} animationType="slide">
        <View style={styles.container}>
          <ActivityIndicator size="large" color="#007AFF" />
        </View>
      </Modal>
    );
  }

  // Permission denied
  if (!permission.granted) {
    return (
      <Modal visible={visible} animationType="slide">
        <View style={styles.container}>
          <View style={styles.permissionContainer}>
            <Text style={styles.permissionTitle}>Camera Permission Required</Text>
            <Text style={styles.permissionText}>
              We need access to your camera to scan receipts.
            </Text>
            <TouchableOpacity
              style={styles.permissionButton}
              onPress={handleRequestPermission}
              accessible={true}
              accessibilityLabel="Grant camera permission"
              accessibilityHint="Allow the app to access your camera for scanning receipts"
              accessibilityRole="button"
            >
              <Text style={styles.permissionButtonText} accessible={false}>Grant Permission</Text>
            </TouchableOpacity>
            <TouchableOpacity 
              style={styles.cancelButton} 
              onPress={handleClose}
              accessible={true}
              accessibilityLabel="Cancel"
              accessibilityHint="Close the receipt scanner"
              accessibilityRole="button"
            >
              <Text style={styles.cancelButtonText} accessible={false}>Cancel</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    );
  }

  // Preview captured image
  if (capturedImage) {
    return (
      <Modal visible={visible} animationType="slide">
        <View style={styles.container}>
          <View style={styles.header}>
            <Text style={styles.headerTitle}>Receipt Preview</Text>
          </View>
          <View style={styles.previewContainer}>
            <Image 
              source={{ uri: capturedImage }} 
              style={styles.previewImage}
              accessible={true}
              accessibilityLabel="Receipt photo preview"
              accessibilityHint="Preview of the captured receipt image"
              accessibilityRole="image"
            />
          </View>
          <View style={styles.previewActions}>
            <TouchableOpacity 
              style={styles.retakeButton} 
              onPress={handleRetake}
              accessible={true}
              accessibilityLabel="Retake photo"
              accessibilityHint="Discard this photo and take a new one"
              accessibilityRole="button"
            >
              <Text style={styles.retakeButtonText} accessible={false}>Retake</Text>
            </TouchableOpacity>
            <TouchableOpacity 
              style={styles.acceptButton} 
              onPress={handleAccept}
              accessible={true}
              accessibilityLabel="Use this photo"
              accessibilityHint="Accept this photo and extract receipt data"
              accessibilityRole="button"
            >
              <Text style={styles.acceptButtonText} accessible={false}>Use This Photo</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    );
  }

  // Camera view
  return (
    <Modal visible={visible} animationType="slide">
      <View style={styles.container}>
        <CameraView
          ref={cameraRef}
          style={styles.camera}
          facing="back"
        >
          <View style={styles.cameraOverlay}>
            <View style={styles.header}>
              <TouchableOpacity 
                style={styles.closeButton} 
                onPress={handleClose}
                accessible={true}
                accessibilityLabel="Close scanner"
                accessibilityHint="Close the receipt scanner and return"
                accessibilityRole="button"
              >
                <Text style={styles.closeButtonText} accessible={false}>✕</Text>
              </TouchableOpacity>
              <Text style={styles.headerTitle}>Scan Receipt</Text>
              <View style={styles.placeholder} />
            </View>

            <View style={styles.scanArea}>
              <View 
                style={styles.scanFrame}
                accessible={true}
                accessibilityLabel="Receipt scanning frame"
                accessibilityHint="Position your receipt within this frame"
              />
              <Text style={styles.scanHint}>
                Position receipt within the frame
              </Text>
            </View>

            <View style={styles.cameraActions}>
              <TouchableOpacity
                style={styles.galleryButton}
                onPress={handlePickFromGallery}
                accessible={true}
                accessibilityLabel="Choose from gallery"
                accessibilityHint="Select a receipt photo from your photo library"
                accessibilityRole="button"
              >
                <Text style={styles.galleryButtonText} accessible={false}>📷</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.captureButton, isProcessing && styles.captureButtonDisabled]}
                onPress={handleCapture}
                disabled={isProcessing}
                accessible={true}
                accessibilityLabel="Capture receipt"
                accessibilityHint={isProcessing ? 'Processing photo' : 'Take a photo of the receipt'}
                accessibilityRole="button"
                accessibilityState={{ disabled: isProcessing }}
              >
                {isProcessing ? (
                  <ActivityIndicator color="#fff" />
                ) : (
                  <View style={styles.captureButtonInner} accessible={false} />
                )}
              </TouchableOpacity>
              <View style={styles.placeholder} />
            </View>
          </View>
        </CameraView>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#000',
  },
  camera: {
    flex: 1,
  },
  cameraOverlay: {
    flex: 1,
    backgroundColor: 'transparent',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 16,
    paddingTop: 48,
  },
  headerTitle: {
    fontSize: 18,
    fontFamily: FONTS.semiBold,
    color: '#fff',
  },
  closeButton: {
    width: 44, // Increased from 40 for accessibility (minimum touch target)
    height: 44, // Increased from 40 for accessibility (minimum touch target)
    justifyContent: 'center',
    alignItems: 'center',
  },
  closeButtonText: {
    fontSize: 28,
    color: '#fff',
    fontWeight: '300',
  },
  placeholder: {
    width: 44, // Updated to match closeButton size
  },
  scanArea: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 32,
  },
  scanFrame: {
    width: '100%',
    aspectRatio: 3 / 4,
    borderWidth: 2,
    borderColor: '#fff',
    borderRadius: 8,
    backgroundColor: 'transparent',
  },
  scanHint: {
    marginTop: 16,
    fontSize: 14,
    color: '#fff',
    textAlign: 'center',
  },
  cameraActions: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-around',
    padding: 32,
    paddingBottom: 48,
  },
  captureButton: {
    width: 72,
    height: 72,
    borderRadius: 36,
    backgroundColor: '#fff',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 4,
    borderColor: '#fff',
  },
  captureButtonInner: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: '#fff',
  },
  captureButtonDisabled: {
    opacity: 0.5,
  },
  galleryButton: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: 'rgba(255, 255, 255, 0.3)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  galleryButtonText: {
    fontSize: 28,
  },
  previewContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#000',
  },
  previewImage: {
    width: '100%',
    height: '100%',
    resizeMode: 'contain',
  },
  previewActions: {
    flexDirection: 'row',
    padding: 16,
    gap: 12,
  },
  retakeButton: {
    flex: 1,
    padding: 16,
    borderRadius: 8,
    backgroundColor: '#666',
    alignItems: 'center',
  },
  retakeButtonText: {
    fontSize: 16,
    fontFamily: FONTS.semiBold,
    color: '#fff',
  },
  acceptButton: {
    flex: 1,
    padding: 16,
    borderRadius: 8,
    backgroundColor: '#007AFF',
    alignItems: 'center',
  },
  acceptButtonText: {
    fontSize: 16,
    fontFamily: FONTS.semiBold,
    color: '#fff',
  },
  permissionContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 32,
    backgroundColor: '#fff',
  },
  permissionTitle: {
    fontSize: 20,
    fontFamily: FONTS.bold,
    color: '#333',
    marginBottom: 12,
    textAlign: 'center',
  },
  permissionText: {
    fontSize: 16,
    color: '#666',
    marginBottom: 32,
    textAlign: 'center',
  },
  permissionButton: {
    width: '100%',
    padding: 16,
    borderRadius: 8,
    backgroundColor: '#007AFF',
    alignItems: 'center',
    marginBottom: 12,
  },
  permissionButtonText: {
    fontSize: 16,
    fontFamily: FONTS.semiBold,
    color: '#fff',
  },
  cancelButton: {
    width: '100%',
    padding: 16,
    borderRadius: 8,
    backgroundColor: '#f0f0f0',
    alignItems: 'center',
  },
  cancelButtonText: {
    fontSize: 16,
    fontFamily: FONTS.semiBold,
    color: '#666',
  },
});
