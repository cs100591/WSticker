/**
 * Receipt Service
 * Handles receipt image upload and OCR processing
 */

import { supabase } from './supabase';
import * as FileSystem from 'expo-file-system';

export interface OCRResult {
  amount?: number;
  date?: Date;
  merchant?: string;
  category?: string;
  success: boolean;
  error?: string;
}

class ReceiptService {
  /**
   * Upload receipt image to Supabase Storage
   */
  async uploadReceipt(
    uri: string,
    userId: string,
    compress: boolean = false
  ): Promise<string | null> {
    try {
      // Get file info
      const fileInfo = await FileSystem.getInfoAsync(uri);
      if (!fileInfo.exists) {
        throw new Error('File does not exist');
      }

      // Check file size and compress if needed
      const maxSize = 5 * 1024 * 1024; // 5MB
      let finalUri = uri;
      
      if (compress && fileInfo.size > maxSize) {
        // In a real implementation, you would compress the image here
        // For now, we'll just use the original
        console.log('Image compression would happen here');
      }

      // Read file as base64
      const base64 = await FileSystem.readAsStringAsync(finalUri, {
        encoding: 'base64',
      });

      // Generate unique filename
      const timestamp = Date.now();
      const filename = `${userId}/${timestamp}.jpg`;

      // Upload to Supabase Storage
      const { data, error } = await supabase.storage
        .from('receipts')
        .upload(filename, decode(base64), {
          contentType: 'image/jpeg',
          upsert: false,
        });

      if (error) {
        console.error('Error uploading receipt:', error);
        throw error;
      }

      // Get public URL
      const { data: urlData } = supabase.storage
        .from('receipts')
        .getPublicUrl(filename);

      return urlData.publicUrl;
    } catch (error) {
      console.error('Error in uploadReceipt:', error);
      return null;
    }
  }

  /**
   * Process receipt with OCR
   */
  async processReceiptOCR(imageUrl: string): Promise<OCRResult> {
    try {
      // Call OCR API endpoint
      const response = await fetch(`${process.env.EXPO_PUBLIC_API_URL}/api/ocr/receipt`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ imageUrl }),
      });

      if (!response.ok) {
        throw new Error('OCR processing failed');
      }

      const data = await response.json();

      // Parse OCR results
      return {
        amount: data.amount ? parseFloat(data.amount) : undefined,
        date: data.date ? new Date(data.date) : undefined,
        merchant: data.merchant,
        category: data.category,
        success: true,
      };
    } catch (error) {
      console.error('Error processing OCR:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'OCR processing failed',
      };
    }
  }

  /**
   * Upload and process receipt in one call
   */
  async uploadAndProcessReceipt(
    uri: string,
    userId: string,
    compress: boolean = false
  ): Promise<{ url: string | null; ocr: OCRResult }> {
    // Upload image
    const url = await this.uploadReceipt(uri, userId, compress);

    if (!url) {
      return {
        url: null,
        ocr: {
          success: false,
          error: 'Failed to upload image',
        },
      };
    }

    // Process with OCR
    const ocr = await this.processReceiptOCR(url);

    return { url, ocr };
  }

  /**
   * Check available storage space
   */
  async checkStorageSpace(): Promise<{ available: number; limited: boolean }> {
    try {
      const freeDiskStorage = await FileSystem.getFreeDiskStorageAsync();
      const limitThreshold = 100 * 1024 * 1024; // 100MB

      return {
        available: freeDiskStorage,
        limited: freeDiskStorage < limitThreshold,
      };
    } catch (error) {
      console.error('Error checking storage:', error);
      return {
        available: 0,
        limited: true,
      };
    }
  }
}

// Helper function to decode base64 to Uint8Array
function decode(base64: string): Uint8Array {
  const binaryString = atob(base64);
  const bytes = new Uint8Array(binaryString.length);
  for (let i = 0; i < binaryString.length; i++) {
    bytes[i] = binaryString.charCodeAt(i);
  }
  return bytes;
}

export const receiptService = new ReceiptService();
