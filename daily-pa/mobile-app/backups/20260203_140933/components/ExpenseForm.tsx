/**
 * Expense Form Component
 * Reusable form for creating and editing expenses
 */

import React, { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  Platform,
  Modal,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import DateTimePicker from '@react-native-community/datetimepicker';
import { z } from 'zod';
import { ExpenseCategory } from '@/models';
import { useCurrencyStore } from '@/store/currencyStore';

// Category icon mapping using Ionicons outline style
const categoryIconNames: Record<ExpenseCategory, keyof typeof Ionicons.glyphMap> = {
  food: 'fast-food-outline',
  transport: 'car-outline',
  shopping: 'bag-outline',
  entertainment: 'game-controller-outline',
  bills: 'document-text-outline',
  health: 'medical-outline',
  education: 'school-outline',
  other: 'cube-outline',
};

const categoryColors: Record<ExpenseCategory, string> = {
  food: '#F97316',
  transport: '#3B82F6',
  shopping: '#EC4899',
  entertainment: '#A855F7',
  bills: '#F59E0B',
  health: '#EF4444',
  education: '#6366F1',
  other: '#6B7280',
};

// Validation schema
const expenseSchema = z.object({
  amount: z.number().positive('Amount must be positive'),
  currency: z.string().min(1, 'Currency is required'),
  category: z.enum([
    'food',
    'transport',
    'shopping',
    'entertainment',
    'bills',
    'health',
    'education',
    'other',
  ]),
  description: z.string().optional(),
  merchant: z.string().optional(),
  expenseDate: z.date(),
});

type ExpenseFormData = z.infer<typeof expenseSchema>;

interface ExpenseFormProps {
  initialData?: Partial<ExpenseFormData>;
  onSubmit: (data: ExpenseFormData) => void | Promise<void>;
  onCancel: () => void;
  submitLabel?: string;
}

export const ExpenseForm: React.FC<ExpenseFormProps> = ({
  initialData,
  onSubmit,
  onCancel,
  submitLabel = 'Save',
}) => {
  const storeCurrency = useCurrencyStore((state) => state.currency);
  const [amount, setAmount] = useState(initialData?.amount?.toString() || '');
  const [currency, setCurrency] = useState(initialData?.currency || storeCurrency);
  const [category, setCategory] = useState<ExpenseCategory>(
    initialData?.category || 'other'
  );
  const [description, setDescription] = useState(initialData?.description || '');
  const [merchant, setMerchant] = useState(initialData?.merchant || '');
  const [expenseDate, setExpenseDate] = useState(
    initialData?.expenseDate || new Date()
  );
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [tempDate, setTempDate] = useState(initialData?.expenseDate || new Date());
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [isSubmitting, setIsSubmitting] = useState(false);

  const getCategoryLabel = (cat: ExpenseCategory): string => {
    return cat.charAt(0).toUpperCase() + cat.slice(1);
  };

  const handleSubmit = async () => {
    try {
      setErrors({});
      setIsSubmitting(true);

      // Parse amount
      const parsedAmount = parseFloat(amount);
      if (isNaN(parsedAmount)) {
        setErrors({ amount: 'Invalid amount' });
        return;
      }

      // Validate data
      const formData: ExpenseFormData = {
        amount: parsedAmount,
        currency,
        category,
        description: description.trim() || undefined,
        merchant: merchant.trim() || undefined,
        expenseDate,
      };

      const result = expenseSchema.safeParse(formData);
      if (!result.success) {
        const fieldErrors: Record<string, string> = {};
        result.error.issues.forEach((err: z.ZodIssue) => {
          if (err.path[0]) {
            fieldErrors[err.path[0].toString()] = err.message;
          }
        });
        setErrors(fieldErrors);
        return;
      }

      await onSubmit(result.data);
    } catch (error) {
      console.error('Error submitting expense form:', error);
      setErrors({ submit: 'Failed to save expense' });
    } finally {
      setIsSubmitting(false);
    }
  };

  const categories: ExpenseCategory[] = [
    'food',
    'transport',
    'shopping',
    'entertainment',
    'bills',
    'health',
    'education',
    'other',
  ];

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      {/* Amount Input */}
      <View style={styles.field}>
        <Text style={styles.label}>Amount *</Text>
        <View style={styles.amountContainer}>
          <TextInput
            style={[styles.input, styles.amountInput, errors.amount && styles.inputError]}
            value={amount}
            onChangeText={setAmount}
            placeholder="0.00"
            keyboardType="decimal-pad"
            editable={!isSubmitting}
            accessible={true}
            accessibilityLabel="Expense amount"
            accessibilityHint="Enter the amount of the expense"
            accessibilityRole="text"
          />
          <TextInput
            style={[styles.input, styles.currencyInput]}
            value={currency}
            onChangeText={setCurrency}
            placeholder="USD"
            maxLength={3}
            autoCapitalize="characters"
            editable={!isSubmitting}
            accessible={true}
            accessibilityLabel="Currency"
            accessibilityHint="Enter currency code, for example USD or EUR"
            accessibilityRole="text"
          />
        </View>
        {errors.amount && (
          <Text
            style={styles.errorText}
            accessible={true}
            accessibilityRole="alert"
          >
            {errors.amount}
          </Text>
        )}
      </View>

      {/* Shop Name Input */}
      <View style={styles.field}>
        <Text style={styles.label}>Shop Name</Text>
        <TextInput
          style={[styles.input, errors.merchant && styles.inputError]}
          value={merchant}
          onChangeText={setMerchant}
          placeholder="e.g. Starbucks, Taxi, etc."
          editable={!isSubmitting}
          accessible={true}
          accessibilityLabel="Shop Name"
          accessibilityHint="Enter the name of the shop or merchant"
          accessibilityRole="text"
        />
        {errors.merchant && (
          <Text style={styles.errorText} accessible={true} accessibilityRole="alert">
            {errors.merchant}
          </Text>
        )}
      </View>

      {/* Category Picker */}
      <View style={styles.field}>
        <Text style={styles.label}>Category *</Text>
        <View
          style={styles.categoryGrid}
          accessible={true}
          accessibilityLabel="Category picker"
          accessibilityRole="radiogroup"
        >
          {categories.map((cat) => (
            <TouchableOpacity
              key={cat}
              style={[
                styles.categoryButton,
                category === cat && styles.categoryButtonActive,
              ]}
              onPress={() => setCategory(cat)}
              disabled={isSubmitting}
              accessible={true}
              accessibilityLabel={`${getCategoryLabel(cat)} category`}
              accessibilityHint={`Select ${getCategoryLabel(cat)} as expense category`}
              accessibilityRole="radio"
              accessibilityState={{ selected: category === cat }}
            >
              <Ionicons
                name={categoryIconNames[cat]}
                size={28}
                color={category === cat ? '#007AFF' : categoryColors[cat]}
              />
              <Text
                style={[
                  styles.categoryLabel,
                  category === cat && styles.categoryLabelActive,
                ]}
                accessible={false}
              >
                {getCategoryLabel(cat)}
              </Text>
            </TouchableOpacity>
          ))}
        </View>
        {errors.category && (
          <Text
            style={styles.errorText}
            accessible={true}
            accessibilityRole="alert"
          >
            {errors.category}
          </Text>
        )}
      </View>

      {/* Description Input */}
      <View style={styles.field}>
        <Text style={styles.label}>Notes (Optional)</Text>
        <TextInput
          style={[styles.input, styles.textArea, errors.description && styles.inputError]}
          value={description}
          onChangeText={setDescription}
          placeholder="Add extra notes..."
          multiline
          numberOfLines={3}
          textAlignVertical="top"
          editable={!isSubmitting}
          accessible={true}
          accessibilityLabel="Expense description"
          accessibilityHint="Add an optional note about this expense"
          accessibilityRole="text"
        />
        {errors.description && (
          <Text
            style={styles.errorText}
            accessible={true}
            accessibilityRole="alert"
          >
            {errors.description}
          </Text>
        )}
      </View>

      {/* Date Picker */}
      <View style={styles.field}>
        <Text style={styles.label}>Date</Text>
        <TouchableOpacity
          style={styles.dateDisplay}
          onPress={() => {
            setTempDate(expenseDate);
            setShowDatePicker(true);
          }}
          accessible={true}
          accessibilityLabel={`Expense date: ${expenseDate.toLocaleDateString()}`}
          accessibilityHint="Tap to change date"
          accessibilityRole="button"
        >
          <Text style={styles.dateText}>{expenseDate.toLocaleDateString()}</Text>
          <Ionicons name="calendar-outline" size={20} color="#666" />
        </TouchableOpacity>
      </View>

      {/* Date Picker Modal for iOS */}
      {
        Platform.OS === 'ios' && showDatePicker && (
          <Modal
            visible={showDatePicker}
            transparent
            animationType="slide"
            onRequestClose={() => setShowDatePicker(false)}
          >
            <View style={styles.datePickerOverlay}>
              <View style={styles.datePickerContainer}>
                <View style={styles.datePickerHeader}>
                  <TouchableOpacity onPress={() => setShowDatePicker(false)}>
                    <Text style={styles.datePickerCancel}>Cancel</Text>
                  </TouchableOpacity>
                  <TouchableOpacity onPress={() => {
                    setExpenseDate(tempDate);
                    setShowDatePicker(false);
                  }}>
                    <Text style={styles.datePickerDone}>Done</Text>
                  </TouchableOpacity>
                </View>
                <DateTimePicker
                  value={tempDate}
                  mode="date"
                  display="spinner"
                  onChange={(event, date) => {
                    if (date) setTempDate(date);
                  }}
                />
              </View>
            </View>
          </Modal>
        )
      }

      {/* Date Picker for Android */}
      {
        Platform.OS === 'android' && showDatePicker && (
          <DateTimePicker
            value={expenseDate}
            mode="date"
            display="default"
            onChange={(event, date) => {
              setShowDatePicker(false);
              if (date) setExpenseDate(date);
            }}
          />
        )
      }

      {/* Submit Error */}
      {
        errors.submit && (
          <View style={styles.submitError}>
            <Text style={styles.errorText}>{errors.submit}</Text>
          </View>
        )
      }

      {/* Action Buttons */}
      <View style={styles.actions}>
        <TouchableOpacity
          style={[styles.button, styles.cancelButton]}
          onPress={onCancel}
          disabled={isSubmitting}
          accessible={true}
          accessibilityLabel="Cancel"
          accessibilityHint="Cancel and discard changes"
          accessibilityRole="button"
        >
          <Text style={styles.cancelButtonText} accessible={false}>Cancel</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.button, styles.submitButton, isSubmitting && styles.buttonDisabled]}
          onPress={handleSubmit}
          disabled={isSubmitting}
          accessible={true}
          accessibilityLabel={submitLabel}
          accessibilityHint={isSubmitting ? 'Saving expense' : 'Save expense'}
          accessibilityRole="button"
          accessibilityState={{ disabled: isSubmitting }}
        >
          <Text style={styles.submitButtonText} accessible={false}>
            {isSubmitting ? 'Saving...' : submitLabel}
          </Text>
        </TouchableOpacity>
      </View>
    </ScrollView >
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
  },
  content: {
    padding: 16,
  },
  field: {
    marginBottom: 20,
  },
  label: {
    fontSize: 14,
    fontWeight: '600',
    color: '#333',
    marginBottom: 8,
  },
  input: {
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 8,
    padding: 12,
    fontSize: 16,
    color: '#333',
    backgroundColor: '#fff',
  },
  inputError: {
    borderColor: '#FF3B30',
  },
  amountContainer: {
    flexDirection: 'row',
    gap: 8,
  },
  amountInput: {
    flex: 1,
  },
  currencyInput: {
    width: 80,
  },
  textArea: {
    minHeight: 80,
    paddingTop: 12,
  },
  categoryGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  categoryButton: {
    width: '23%',
    aspectRatio: 1,
    borderRadius: 12,
    borderWidth: 2,
    borderColor: '#e0e0e0',
    backgroundColor: '#f9f9f9',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 8,
  },
  categoryButtonActive: {
    borderColor: '#007AFF',
    backgroundColor: '#E3F2FD',
  },
  categoryLabel: {
    fontSize: 11,
    color: '#666',
    textAlign: 'center',
    marginTop: 4,
  },
  categoryLabelActive: {
    color: '#007AFF',
    fontWeight: '600',
  },
  dateDisplay: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 8,
    padding: 12,
    backgroundColor: '#f9f9f9',
  },
  dateText: {
    fontSize: 16,
    color: '#333',
  },
  datePickerOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.4)',
    justifyContent: 'flex-end',
  },
  datePickerContainer: {
    backgroundColor: '#fff',
    borderTopLeftRadius: 16,
    borderTopRightRadius: 16,
    paddingBottom: 20,
  },
  datePickerHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
  },
  datePickerCancel: {
    fontSize: 16,
    color: '#6B7280',
  },
  datePickerDone: {
    fontSize: 16,
    fontWeight: '600',
    color: '#007AFF',
  },
  errorText: {
    fontSize: 12,
    color: '#FF3B30',
    marginTop: 4,
  },
  submitError: {
    marginBottom: 16,
  },
  actions: {
    flexDirection: 'row',
    gap: 12,
    marginTop: 8,
  },
  button: {
    flex: 1,
    padding: 16,
    borderRadius: 8,
    alignItems: 'center',
  },
  cancelButton: {
    backgroundColor: '#f0f0f0',
  },
  cancelButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#666',
  },
  submitButton: {
    backgroundColor: '#007AFF',
  },
  submitButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#fff',
  },
  buttonDisabled: {
    opacity: 0.5,
  },
});
