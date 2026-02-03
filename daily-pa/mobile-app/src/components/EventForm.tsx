/**
 * Event Form Component
 * Reusable form for creating and editing calendar events
 * Uses DateTimePicker for date/time selection
 */

import React, { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  Switch,
  Platform,
  Alert,
} from 'react-native';
import DateTimePicker, { DateTimePickerEvent } from '@react-native-community/datetimepicker';
import { z } from 'zod';
import { calendarService } from '@/services/CalendarService';
import { translations, useEffectiveLanguage } from '@/store/languageStore';
import { InputAccessory } from './InputAccessory';

// Validation schema
const eventSchema = z.object({
  title: z.string().min(1, 'Title is required').max(100, 'Title is too long'),
  description: z.string().max(500, 'Description is too long').optional(),
  startTime: z.date(),
  endTime: z.date(),
  allDay: z.boolean(),
  color: z.string().optional(),
  externalCalendarId: z.string().optional(),
}).refine(
  (data) => data.endTime > data.startTime,
  { message: 'End time must be after start time', path: ['endTime'] }
);

export type EventFormData = z.infer<typeof eventSchema>;

interface EventFormProps {
  initialData?: Partial<EventFormData>;
  onSubmit: (data: EventFormData) => void | Promise<void>;
  onCancel: () => void;
  onDelete?: () => void;
  submitLabel?: string;
}

const COLORS = [
  { name: 'Blue', value: '#2196F3' },
  { name: 'Red', value: '#F44336' },
  { name: 'Green', value: '#4CAF50' },
  { name: 'Orange', value: '#FF9800' },
  { name: 'Purple', value: '#9C27B0' },
  { name: 'Pink', value: '#E91E63' },
];

// Helper to map app language to standard locale for DateTimePicker
const getLocaleIdentifier = (lang: string) => {
  switch (lang) {
    case 'zh': return 'zh-Hans'; // Simplified Chinese
    case 'ms': return 'ms-MY';
    case 'ta': return 'ta-IN';
    case 'ja': return 'ja-JP';
    case 'ko': return 'ko-KR';
    case 'id': return 'id-ID';
    case 'es': return 'es-ES';
    case 'fr': return 'fr-FR';
    case 'de': return 'de-DE';
    case 'th': return 'th-TH';
    case 'vi': return 'vi-VN';
    default: return 'en-US';
  }
};


export const EventForm: React.FC<EventFormProps> = ({
  initialData,
  onSubmit,
  onCancel,
  onDelete,
  submitLabel,
}) => {
  const lang = useEffectiveLanguage();
  const pickerLocale = getLocaleIdentifier(lang);
  const t = translations[lang];

  const [title, setTitle] = useState(initialData?.title || '');
  const [description, setDescription] = useState(initialData?.description || '');
  const [startTime, setStartTime] = useState(initialData?.startTime || new Date());
  const [endTime, setEndTime] = useState(
    initialData?.endTime || new Date(Date.now() + 60 * 60 * 1000)
  );
  const [allDay, setAllDay] = useState(initialData?.allDay || false);
  const [color, setColor] = useState(initialData?.color || COLORS[0].value);
  const [selectedCalendarId, setSelectedCalendarId] = useState<string | undefined>(initialData?.externalCalendarId);
  const [calendars, setCalendars] = useState<any[]>([]);

  const [errors, setErrors] = useState<Record<string, string>>({});
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Picker visibility states
  const [showStartDatePicker, setShowStartDatePicker] = useState(false);
  const [showStartTimePicker, setShowStartTimePicker] = useState(false);
  const [showEndDatePicker, setShowEndDatePicker] = useState(false);
  const [showEndTimePicker, setShowEndTimePicker] = useState(false);

  React.useEffect(() => {
    loadCalendars();
  }, []);

  const loadCalendars = async () => {
    try {
      const cals = await calendarService.getAvailableCalendars();
      setCalendars(cals.sort((a, b) => (a.title === 'Daily PA' ? -1 : 1)));
    } catch (e) { console.log(e); }
  };

  const handleSubmit = async () => {
    try {
      setErrors({});
      setIsSubmitting(true);
      const data = eventSchema.parse({
        title: title.trim(),
        description: description.trim() || undefined,
        startTime,
        endTime,
        allDay,
        color,
        externalCalendarId: selectedCalendarId
      });
      await onSubmit(data);
    } catch (error) {
      if (error instanceof z.ZodError) {
        const newErrors: Record<string, string> = {};
        error.issues.forEach((err: z.ZodIssue) => {
          if (err.path[0]) newErrors[err.path[0].toString()] = err.message;
        });
        setErrors(newErrors);
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  // Temp values for iOS picker (only commit on Done)
  const [tempStartDate, setTempStartDate] = useState(startTime);
  const [tempEndDate, setTempEndDate] = useState(endTime);

  const onStartDateChange = (_: DateTimePickerEvent, date?: Date) => {
    if (Platform.OS === 'android') {
      setShowStartDatePicker(false);
      if (date) {
        const newStart = new Date(startTime);
        newStart.setFullYear(date.getFullYear(), date.getMonth(), date.getDate());
        const duration = endTime.getTime() - startTime.getTime();
        setStartTime(newStart);
        setEndTime(new Date(newStart.getTime() + duration));
      }
    } else if (date) {
      setTempStartDate(date);
    }
  };

  const onStartTimeChange = (_: DateTimePickerEvent, date?: Date) => {
    if (Platform.OS === 'android') {
      setShowStartTimePicker(false);
      if (date) {
        const newStart = new Date(startTime);
        newStart.setHours(date.getHours(), date.getMinutes());
        const duration = endTime.getTime() - startTime.getTime();
        setStartTime(newStart);
        setEndTime(new Date(newStart.getTime() + duration));
      }
    } else if (date) {
      setTempStartDate(date);
    }
  };

  const onEndDateChange = (_: DateTimePickerEvent, date?: Date) => {
    if (Platform.OS === 'android') {
      setShowEndDatePicker(false);
      if (date) {
        const newEnd = new Date(endTime);
        newEnd.setFullYear(date.getFullYear(), date.getMonth(), date.getDate());
        setEndTime(newEnd);
      }
    } else if (date) {
      setTempEndDate(date);
    }
  };

  const onEndTimeChange = (_: DateTimePickerEvent, date?: Date) => {
    if (Platform.OS === 'android') {
      setShowEndTimePicker(false);
      if (date) {
        const newEnd = new Date(endTime);
        newEnd.setHours(date.getHours(), date.getMinutes());
        setEndTime(newEnd);
      }
    } else if (date) {
      setTempEndDate(date);
    }
  };

  const confirmStartDatePicker = () => {
    const newStart = new Date(startTime);
    newStart.setFullYear(tempStartDate.getFullYear(), tempStartDate.getMonth(), tempStartDate.getDate());
    const duration = endTime.getTime() - startTime.getTime();
    setStartTime(newStart);
    setEndTime(new Date(newStart.getTime() + duration));
    setShowStartDatePicker(false);
  };

  const confirmStartTimePicker = () => {
    const newStart = new Date(startTime);
    newStart.setHours(tempStartDate.getHours(), tempStartDate.getMinutes());
    const duration = endTime.getTime() - startTime.getTime();
    setStartTime(newStart);
    setEndTime(new Date(newStart.getTime() + duration));
    setShowStartTimePicker(false);
  };

  const confirmEndDatePicker = () => {
    const newEnd = new Date(endTime);
    newEnd.setFullYear(tempEndDate.getFullYear(), tempEndDate.getMonth(), tempEndDate.getDate());
    setEndTime(newEnd);
    setShowEndDatePicker(false);
  };

  const confirmEndTimePicker = () => {
    const newEnd = new Date(endTime);
    newEnd.setHours(tempEndDate.getHours(), tempEndDate.getMinutes());
    setEndTime(newEnd);
    setShowEndTimePicker(false);
  };

  const formatDate = (date: Date) => date.toLocaleDateString(lang, {
    weekday: 'short', month: 'short', day: 'numeric', year: 'numeric'
  });

  const formatTime = (date: Date) => date.toLocaleTimeString(lang, {
    hour: '2-digit', minute: '2-digit'
  });


  return (
    <ScrollView style={styles.container} keyboardShouldPersistTaps="handled">
      <InputAccessory id="eventFormAccessory" />

      {/* Title */}
      <View style={styles.field}>
        <Text style={styles.label}>{t.eventTitleLabel} *</Text>
        <TextInput
          style={[styles.input, errors.title && styles.inputError]}
          value={title}
          onChangeText={setTitle}
          placeholder={t.eventTitlePlaceholder}
          placeholderTextColor="#94A3B8"
          maxLength={100}
          inputAccessoryViewID="eventFormAccessory"
        />
        {errors.title && <Text style={styles.errorText}>{errors.title}</Text>}
      </View>

      {/* Calendar Selection */}
      {calendars.length > 0 && (
        <View style={styles.field}>
          <Text style={styles.label}>Calendar</Text>
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={{ gap: 8 }}
            keyboardShouldPersistTaps="always"
          >
            <TouchableOpacity
              style={[
                styles.calChip,
                !selectedCalendarId && styles.calChipSelected,
                { borderColor: '#E2E8F0' }
              ]}
              onPress={() => setSelectedCalendarId(undefined)}
            >
              <View style={[styles.calDot, { backgroundColor: '#3B82F6' }]} />
              <Text style={[styles.calChipText, !selectedCalendarId && { color: '#fff' }]}>App Local</Text>
            </TouchableOpacity>

            {calendars.map(cal => (
              <TouchableOpacity
                key={cal.id}
                style={[
                  styles.calChip,
                  selectedCalendarId === cal.id && styles.calChipSelected,
                  { borderColor: cal.color }
                ]}
                onPress={() => setSelectedCalendarId(cal.id)}
              >
                <View style={[styles.calDot, { backgroundColor: cal.color }]} />
                <Text style={[styles.calChipText, selectedCalendarId === cal.id && { color: '#fff' }]}>
                  {cal.title}
                </Text>
              </TouchableOpacity>
            ))}
          </ScrollView>
        </View>
      )}

      {/* Description */}
      <View style={styles.field}>
        <Text style={styles.label}>{t.eventDescLabel}</Text>
        <TextInput
          style={[styles.input, styles.textArea]}
          value={description}
          onChangeText={setDescription}
          placeholder={t.eventDescPlaceholder}
          placeholderTextColor="#94A3B8"
          multiline
          numberOfLines={3}
          maxLength={500}
          inputAccessoryViewID="eventFormAccessory"
        />
      </View>

      {/* All Day Toggle */}
      <View style={styles.field}>
        <View style={styles.switchRow}>
          <Text style={styles.label}>{t.allDay}</Text>
          <Switch
            value={allDay}
            onValueChange={setAllDay}
            trackColor={{ false: '#e0e0e0', true: '#3B82F6' }}
            thumbColor="#fff"
          />
        </View>
      </View>

      {/* Start Date */}
      <View style={styles.field}>
        <Text style={styles.label}>{t.startDate}</Text>
        <TouchableOpacity
          style={styles.pickerButton}
          onPress={() => { setTempStartDate(startTime); setShowStartDatePicker(true); }}
        >
          <Text style={styles.pickerButtonText}>{formatDate(startTime)}</Text>
          <Text style={styles.pickerIcon}>📅</Text>
        </TouchableOpacity>
        {showStartDatePicker && (
          <View style={styles.pickerContainer}>
            <DateTimePicker
              value={Platform.OS === 'ios' ? tempStartDate : startTime}
              mode="date"
              display={Platform.OS === 'ios' ? 'inline' : 'default'}
              onChange={onStartDateChange}
              locale={pickerLocale}
              themeVariant="light"
              textColor="#000000"
            />
            {Platform.OS === 'ios' && (
              <TouchableOpacity style={styles.pickerDoneButton} onPress={confirmStartDatePicker}>
                <Text style={styles.pickerDoneText}>{t.done}</Text>
              </TouchableOpacity>
            )}
          </View>
        )}
      </View>

      {/* Start Time */}
      {!allDay && (
        <View style={styles.field}>
          <Text style={styles.label}>{t.startTime}</Text>
          <TouchableOpacity
            style={styles.pickerButton}
            onPress={() => { setTempStartDate(startTime); setShowStartTimePicker(true); }}
          >
            <Text style={styles.pickerButtonText}>{formatTime(startTime)}</Text>
            <Text style={styles.pickerIcon}>🕐</Text>
          </TouchableOpacity>
          {showStartTimePicker && (
            <View style={styles.pickerContainer}>
              <DateTimePicker
                value={Platform.OS === 'ios' ? tempStartDate : startTime}
                mode="time"
                display={Platform.OS === 'ios' ? 'spinner' : 'default'}
                onChange={onStartTimeChange}
                locale={pickerLocale}
                themeVariant="light"
                textColor="#000000"
              />
              {Platform.OS === 'ios' && (
                <TouchableOpacity style={styles.pickerDoneButton} onPress={confirmStartTimePicker}>
                  <Text style={styles.pickerDoneText}>{t.done}</Text>
                </TouchableOpacity>
              )}
            </View>
          )}
        </View>
      )}

      {/* End Date */}
      <View style={styles.field}>
        <Text style={styles.label}>{t.endDate}</Text>
        <TouchableOpacity
          style={styles.pickerButton}
          onPress={() => { setTempEndDate(endTime); setShowEndDatePicker(true); }}
        >
          <Text style={styles.pickerButtonText}>{formatDate(endTime)}</Text>
          <Text style={styles.pickerIcon}>📅</Text>
        </TouchableOpacity>
        {showEndDatePicker && (
          <View style={styles.pickerContainer}>
            <DateTimePicker
              value={Platform.OS === 'ios' ? tempEndDate : endTime}
              mode="date"
              display={Platform.OS === 'ios' ? 'inline' : 'default'}
              onChange={onEndDateChange}
              minimumDate={startTime}
              locale={pickerLocale}
              themeVariant="light"
              textColor="#000000"
            />
            {Platform.OS === 'ios' && (
              <TouchableOpacity style={styles.pickerDoneButton} onPress={confirmEndDatePicker}>
                <Text style={styles.pickerDoneText}>{t.done}</Text>
              </TouchableOpacity>
            )}
          </View>
        )}
      </View>

      {/* End Time */}
      {!allDay && (
        <View style={styles.field}>
          <Text style={styles.label}>{t.endTime}</Text>
          <TouchableOpacity
            style={styles.pickerButton}
            onPress={() => { setTempEndDate(endTime); setShowEndTimePicker(true); }}
          >
            <Text style={styles.pickerButtonText}>{formatTime(endTime)}</Text>
            <Text style={styles.pickerIcon}>🕐</Text>
          </TouchableOpacity>
          {showEndTimePicker && (
            <View style={styles.pickerContainer}>
              <DateTimePicker
                value={Platform.OS === 'ios' ? tempEndDate : endTime}
                mode="time"
                display={Platform.OS === 'ios' ? 'spinner' : 'default'}
                onChange={onEndTimeChange}
                locale={pickerLocale}
                themeVariant="light"
                textColor="#000000"
              />
              {Platform.OS === 'ios' && (
                <TouchableOpacity style={styles.pickerDoneButton} onPress={confirmEndTimePicker}>
                  <Text style={styles.pickerDoneText}>{t.done}</Text>
                </TouchableOpacity>
              )}
            </View>
          )}
          {errors.endTime && <Text style={styles.errorText}>{errors.endTime}</Text>}
        </View>
      )}


      {/* Color Picker */}
      <View style={styles.field}>
        <Text style={styles.label}>{t.color}</Text>
        <View style={styles.colorPicker}>
          {COLORS.map((c) => (
            <TouchableOpacity
              key={c.value}
              style={[
                styles.colorOption,
                { backgroundColor: c.value },
                color === c.value && styles.colorOptionSelected,
              ]}
              onPress={() => setColor(c.value)}
            >
              {color === c.value && <Text style={styles.colorCheckmark}>✓</Text>}
            </TouchableOpacity>
          ))}
        </View>
      </View>

      {/* Buttons */}
      <View style={styles.buttons}>
        <TouchableOpacity
          style={[styles.button, styles.cancelButton]}
          onPress={onCancel}
          disabled={isSubmitting}
        >
          <Text style={styles.cancelButtonText}>{t.cancel}</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.button, styles.submitButton]}
          onPress={handleSubmit}
          disabled={isSubmitting}
        >
          <Text style={styles.submitButtonText}>
            {isSubmitting ? t.saving : (submitLabel || t.save)}
          </Text>
        </TouchableOpacity>
      </View>

      {onDelete && (
        <TouchableOpacity
          style={[styles.button, styles.deleteButton]}
          onPress={() => {
            Alert.alert(
              t.confirmDeleteTitle,
              t.confirmDeleteMsg,
              [
                { text: t.cancel, style: 'cancel' },
                { text: t.delete, style: 'destructive', onPress: onDelete },
              ]
            );
          }}
          disabled={isSubmitting}
        >
          <Text style={styles.deleteButtonText}>{t.confirmDeleteTitle}</Text>
        </TouchableOpacity>
      )}

      <View style={{ height: 40 }} />
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#fff', padding: 16 },
  field: { marginBottom: 20 },
  label: { fontSize: 16, fontFamily: FONTS.semiBold, color: '#333', marginBottom: 8 },
  input: {
    borderWidth: 1, borderColor: '#e0e0e0', borderRadius: 12,
    padding: 14, fontSize: 16, color: '#333', backgroundColor: '#F8FAFC',
  },
  inputError: { borderColor: '#FF3B30' },
  textArea: { height: 80, textAlignVertical: 'top' },
  errorText: { fontSize: 14, color: '#FF3B30', marginTop: 4 },
  switchRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  pickerButton: {
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
    borderWidth: 1, borderColor: '#e0e0e0', borderRadius: 12,
    padding: 14, backgroundColor: '#F8FAFC',
  },
  pickerButtonText: { fontSize: 16, color: '#333', fontFamily: FONTS.medium },
  pickerIcon: { fontSize: 20 },
  pickerContainer: {
    backgroundColor: '#F8FAFC',
    borderRadius: 12,
    marginTop: 8,
    borderWidth: 1,
    borderColor: '#e0e0e0',
  },
  pickerDoneButton: {
    backgroundColor: '#3B82F6',
    padding: 12,
    alignItems: 'center',
    borderBottomLeftRadius: 12,
    borderBottomRightRadius: 12,
  },
  pickerDoneText: { color: '#fff', fontSize: 16, fontFamily: FONTS.semiBold },
  colorPicker: { flexDirection: 'row', flexWrap: 'wrap', gap: 12 },
  colorOption: {
    width: 48, height: 48, borderRadius: 24,
    justifyContent: 'center', alignItems: 'center',
    borderWidth: 2, borderColor: 'transparent',
  },
  colorOptionSelected: { borderColor: '#333', borderWidth: 3 },
  colorCheckmark: { fontSize: 24, color: '#fff', fontFamily: FONTS.bold },
  buttons: { flexDirection: 'row', gap: 12, marginTop: 24, marginBottom: 20 },
  button: { flex: 1, paddingVertical: 14, borderRadius: 12, alignItems: 'center' },
  cancelButton: { backgroundColor: '#F1F5F9' },
  cancelButtonText: { fontSize: 16, fontFamily: FONTS.semiBold, color: '#64748B' },
  submitButton: { backgroundColor: '#3B82F6' },
  submitButtonText: { fontSize: 16, fontFamily: FONTS.semiBold, color: '#fff' },
  deleteButton: { backgroundColor: '#FEE2E2', marginTop: 0 },
  deleteButtonText: { fontSize: 16, fontFamily: FONTS.semiBold, color: '#EF4444' },

  // Calendar Chip Styles
  calChip: {
    flexDirection: 'row', alignItems: 'center',
    paddingVertical: 8, paddingHorizontal: 12,
    borderRadius: 20, borderWidth: 1,
    backgroundColor: '#fff',
    marginRight: 4
  },
  calChipSelected: {
    backgroundColor: '#3B82F6',
    borderColor: '#3B82F6'
  },
  calDot: {
    width: 8, height: 8, borderRadius: 4, marginRight: 6
  },
  calChipText: {
    fontSize: 14, fontFamily: FONTS.medium, color: '#1E293B'
  }
});
