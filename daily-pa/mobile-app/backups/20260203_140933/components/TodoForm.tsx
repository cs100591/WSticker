/**
 * Todo Form Component
 * Form for creating and editing todos
 */

import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  ScrollView,
  Platform,
} from 'react-native';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { TodoColor, TodoPriority } from '@/models';

const todoSchema = z.object({
  title: z.string().min(1, 'Title is required').max(200, 'Title is too long'),
  description: z.string().max(1000, 'Description is too long').optional(),
  dueDate: z.date().optional(),
  priority: z.enum(['low', 'medium', 'high']).optional(),
  color: z.enum(['yellow', 'blue', 'pink', 'green', 'purple', 'orange']).optional(),
});

export type TodoFormData = z.infer<typeof todoSchema>;

interface TodoFormProps {
  initialData?: Partial<TodoFormData>;
  onSubmit: (data: TodoFormData) => void | Promise<void>;
  onCancel?: () => void;
  submitLabel?: string;
}

export const TodoForm: React.FC<TodoFormProps> = ({
  initialData,
  onSubmit,
  onCancel,
  submitLabel = 'Save',
}) => {
  const {
    control,
    handleSubmit,
    formState: { errors, isSubmitting },
    watch,
  } = useForm<TodoFormData>({
    resolver: zodResolver(todoSchema),
    defaultValues: {
      title: initialData?.title || '',
      description: initialData?.description || '',
      priority: initialData?.priority || 'medium',
      color: initialData?.color || 'yellow',
      dueDate: initialData?.dueDate,
    },
  });

  const selectedColor = watch('color');
  const selectedPriority = watch('priority');

  const colors: TodoColor[] = ['yellow', 'blue', 'pink', 'green', 'purple', 'orange'];
  const priorities: TodoPriority[] = ['low', 'medium', 'high'];

  const getColorHex = (color: TodoColor): string => {
    const colorMap: Record<TodoColor, string> = {
      yellow: '#FFC107',
      blue: '#2196F3',
      pink: '#E91E63',
      green: '#4CAF50',
      purple: '#9C27B0',
      orange: '#FF9800',
    };
    return colorMap[color];
  };

  return (
    <ScrollView style={styles.container} keyboardShouldPersistTaps="handled">
      <View style={styles.form}>
        {/* Title Input */}
        <View style={styles.fieldContainer}>
          <Text style={styles.label}>Title *</Text>
          <Controller
            control={control}
            name="title"
            render={({ field: { onChange, onBlur, value } }) => (
              <TextInput
                style={[styles.input, errors.title && styles.inputError]}
                placeholder="Enter todo title"
                value={value}
                onChangeText={onChange}
                onBlur={onBlur}
                autoCapitalize="sentences"
                accessible={true}
                accessibilityLabel="Todo title"
                accessibilityHint="Enter a title for your todo item"
                accessibilityRole="text"
              />
            )}
          />
          {errors.title && (
            <Text 
              style={styles.errorText}
              accessible={true}
              accessibilityRole="alert"
            >
              {errors.title.message}
            </Text>
          )}
        </View>

        {/* Description Input */}
        <View style={styles.fieldContainer}>
          <Text style={styles.label}>Description</Text>
          <Controller
            control={control}
            name="description"
            render={({ field: { onChange, onBlur, value } }) => (
              <TextInput
                style={[styles.input, styles.textArea]}
                placeholder="Enter description (optional)"
                value={value}
                onChangeText={onChange}
                onBlur={onBlur}
                multiline
                numberOfLines={4}
                textAlignVertical="top"
                autoCapitalize="sentences"
                accessible={true}
                accessibilityLabel="Todo description"
                accessibilityHint="Enter an optional description for your todo"
                accessibilityRole="text"
              />
            )}
          />
          {errors.description && (
            <Text 
              style={styles.errorText}
              accessible={true}
              accessibilityRole="alert"
            >
              {errors.description.message}
            </Text>
          )}
        </View>

        {/* Color Picker */}
        <View style={styles.fieldContainer}>
          <Text style={styles.label}>Color</Text>
          <Controller
            control={control}
            name="color"
            render={({ field: { onChange, value } }) => (
              <View 
                style={styles.colorPicker}
                accessible={true}
                accessibilityLabel="Color picker"
                accessibilityRole="radiogroup"
              >
                {colors.map((color) => (
                  <TouchableOpacity
                    key={color}
                    style={[
                      styles.colorOption,
                      { backgroundColor: getColorHex(color) },
                      value === color && styles.colorOptionSelected,
                    ]}
                    onPress={() => onChange(color)}
                    accessible={true}
                    accessibilityLabel={`${color} color`}
                    accessibilityHint={`Select ${color} as todo color`}
                    accessibilityRole="radio"
                    accessibilityState={{ selected: value === color }}
                  />
                ))}
              </View>
            )}
          />
        </View>

        {/* Priority Picker */}
        <View style={styles.fieldContainer}>
          <Text style={styles.label}>Priority</Text>
          <Controller
            control={control}
            name="priority"
            render={({ field: { onChange, value } }) => (
              <View 
                style={styles.priorityPicker}
                accessible={true}
                accessibilityLabel="Priority picker"
                accessibilityRole="radiogroup"
              >
                {priorities.map((priority) => (
                  <TouchableOpacity
                    key={priority}
                    style={[
                      styles.priorityOption,
                      value === priority && styles.priorityOptionSelected,
                    ]}
                    onPress={() => onChange(priority)}
                    accessible={true}
                    accessibilityLabel={`${priority} priority`}
                    accessibilityHint={`Set todo priority to ${priority}`}
                    accessibilityRole="radio"
                    accessibilityState={{ selected: value === priority }}
                  >
                    <Text
                      style={[
                        styles.priorityText,
                        value === priority && styles.priorityTextSelected,
                      ]}
                      accessible={false}
                    >
                      {priority.charAt(0).toUpperCase() + priority.slice(1)}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>
            )}
          />
        </View>

        {/* Action Buttons */}
        <View style={styles.buttonContainer}>
          {onCancel && (
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
          )}
          <TouchableOpacity
            style={[
              styles.button,
              styles.submitButton,
              { backgroundColor: getColorHex(selectedColor || 'yellow') },
            ]}
            onPress={handleSubmit(onSubmit)}
            disabled={isSubmitting}
            accessible={true}
            accessibilityLabel={submitLabel}
            accessibilityHint={isSubmitting ? 'Saving todo' : 'Save todo'}
            accessibilityRole="button"
            accessibilityState={{ disabled: isSubmitting }}
          >
            <Text style={styles.submitButtonText} accessible={false}>
              {isSubmitting ? 'Saving...' : submitLabel}
            </Text>
          </TouchableOpacity>
        </View>
      </View>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  form: {
    padding: 16,
  },
  fieldContainer: {
    marginBottom: 20,
  },
  label: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
    marginBottom: 8,
  },
  input: {
    backgroundColor: '#fff',
    borderWidth: 1,
    borderColor: '#e0e0e0',
    borderRadius: 8,
    padding: 12,
    fontSize: 16,
    color: '#333',
  },
  inputError: {
    borderColor: '#FF3B30',
  },
  textArea: {
    height: 100,
    paddingTop: 12,
  },
  errorText: {
    color: '#FF3B30',
    fontSize: 14,
    marginTop: 4,
  },
  colorPicker: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
  },
  colorOption: {
    width: 48,
    height: 48,
    borderRadius: 24,
    borderWidth: 2,
    borderColor: 'transparent',
  },
  colorOptionSelected: {
    borderColor: '#333',
    borderWidth: 3,
  },
  priorityPicker: {
    flexDirection: 'row',
    gap: 12,
  },
  priorityOption: {
    flex: 1,
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 8,
    backgroundColor: '#fff',
    borderWidth: 1,
    borderColor: '#e0e0e0',
    alignItems: 'center',
  },
  priorityOptionSelected: {
    backgroundColor: '#007AFF',
    borderColor: '#007AFF',
  },
  priorityText: {
    fontSize: 16,
    color: '#666',
  },
  priorityTextSelected: {
    color: '#fff',
    fontWeight: '600',
  },
  buttonContainer: {
    flexDirection: 'row',
    gap: 12,
    marginTop: 24,
  },
  button: {
    flex: 1,
    paddingVertical: 14,
    borderRadius: 8,
    alignItems: 'center',
  },
  cancelButton: {
    backgroundColor: '#fff',
    borderWidth: 1,
    borderColor: '#e0e0e0',
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
});
