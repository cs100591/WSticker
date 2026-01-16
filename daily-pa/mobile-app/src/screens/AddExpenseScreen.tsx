/**
 * Add Expense Screen
 * Screen for adding new expenses with receipt scanning
 */

import React, { useState } from 'react';
import {
  View,
  StyleSheet,
  TouchableOpacity,
  Text,
  Alert,
  ActivityIndicator,
} from 'react-native';
import { ExpenseForm } from '@/components/ExpenseForm';
import { ReceiptScanner } from '@/components/ReceiptScanner';
import { receiptService, OCRResult } from '@/services/ReceiptService';
import { expenseService } from '@/services/ExpenseService';
import { ExpenseCategory } from '@/models';

interface AddExpenseScreenProps {
  onClose: () => void;
  onSuccess?: () => void;
}

export const AddExpenseScreen: React.FC<AddExpenseScreenProps> = ({
  onClose,
  onSuccess,
}) => {
  const [showScanner, setShowScanner] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [ocrData, setOcrData] = useState<OCRResult | null>(null);
  const [receiptUrl, setReceiptUrl] = useState<string | null>(null);

  // Mock user ID - in real app, get from auth context
  const userId = 'mock-user-id';

  const handleScanReceipt = () => {
    setShowScanner(true);
  };

  const handleImageCaptured = async (uri: string) => {
    try {
      setIsProcessing(true);
      setShowScanner(false);

      // Check storage space
      const storage = await receiptService.checkStorageSpace();
      const shouldCompress = storage.limited;

      if (shouldCompress) {
        Alert.alert(
          'Low Storage',
          'Your device is low on storage. The image will be compressed.'
        );
      }

      // Upload and process receipt
      const result = await receiptService.uploadAndProcessReceipt(
        uri,
        userId,
        shouldCompress
      );

      if (!result.url) {
        throw new Error('Failed to upload receipt');
      }

      setReceiptUrl(result.url);

      // Handle OCR results
      if (result.ocr.success) {
        setOcrData(result.ocr);
        Alert.alert(
          'Receipt Scanned',
          'Receipt data has been extracted. Please review and edit if needed.',
          [{ text: 'OK' }]
        );
      } else {
        Alert.alert(
          'OCR Failed',
          'Could not extract data from receipt. Please enter manually.',
          [{ text: 'OK' }]
        );
      }
    } catch (error) {
      console.error('Error processing receipt:', error);
      Alert.alert(
        'Error',
        'Failed to process receipt. Please try again or enter manually.'
      );
    } finally {
      setIsProcessing(false);
    }
  };

  const handleSubmit = async (data: {
    amount: number;
    currency: string;
    category: ExpenseCategory;
    description?: string;
    expenseDate: Date;
  }) => {
    try {
      await expenseService.createExpense({
        ...data,
        userId,
        receiptUrl: receiptUrl || undefined,
        tags: [],
      });

      Alert.alert('Success', 'Expense added successfully', [
        {
          text: 'OK',
          onPress: () => {
            onSuccess?.();
            onClose();
          },
        },
      ]);
    } catch (error) {
      console.error('Error creating expense:', error);
      Alert.alert('Error', 'Failed to create expense');
    }
  };

  // Prepare initial data from OCR
  const initialData = ocrData
    ? {
        amount: ocrData.amount,
        currency: 'CNY',
        category: (ocrData.category as ExpenseCategory) || 'other',
        description: ocrData.merchant,
        expenseDate: ocrData.date || new Date(),
      }
    : undefined;

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={onClose}>
          <Text style={styles.cancelText}>Cancel</Text>
        </TouchableOpacity>
        <Text style={styles.title}>Add Expense</Text>
        <TouchableOpacity onPress={handleScanReceipt} disabled={isProcessing}>
          <Text style={[styles.scanText, isProcessing && styles.scanTextDisabled]}>
            📷 Scan
          </Text>
        </TouchableOpacity>
      </View>

      {isProcessing ? (
        <View style={styles.processingContainer}>
          <ActivityIndicator size="large" color="#007AFF" />
          <Text style={styles.processingText}>Processing receipt...</Text>
        </View>
      ) : (
        <ExpenseForm
          initialData={initialData}
          onSubmit={handleSubmit}
          onCancel={onClose}
          submitLabel="Add Expense"
        />
      )}

      <ReceiptScanner
        visible={showScanner}
        onClose={() => setShowScanner(false)}
        onImageCaptured={handleImageCaptured}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 16,
    paddingTop: 48,
    borderBottomWidth: 1,
    borderBottomColor: '#e0e0e0',
  },
  title: {
    fontSize: 18,
    fontWeight: '600',
    color: '#333',
  },
  cancelText: {
    fontSize: 16,
    color: '#007AFF',
  },
  scanText: {
    fontSize: 16,
    color: '#007AFF',
    fontWeight: '600',
  },
  scanTextDisabled: {
    opacity: 0.5,
  },
  processingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 32,
  },
  processingText: {
    marginTop: 16,
    fontSize: 16,
    color: '#666',
  },
});
