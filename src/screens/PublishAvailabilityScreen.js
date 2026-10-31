/**
 * PublishAvailabilityScreen.js
 *
 * Allows the provider to publish new availability slots.
 *
 * API: POST /provider-slots/provider/{providerId}
 *
 * When triggered from BookingDetailsScreen (Suggest flow), the order prop is
 * present and the screen lets the provider propose a new time.
 * The screen builds one or more ProviderSlot objects from the selected hours
 * and minutes and posts them all to the backend.
 *
 * ProviderSlot request body:
 *   providerId      – Long (from AsyncStorage 'agencyId' or 'username')
 *   slotDate        – "YYYY-MM-DD"
 *   startTime       – "YYYY-MM-DDTHH:mm:ss"
 *   endTime         – "YYYY-MM-DDTHH:mm:ss"
 *   slotDurationMins– number  (default 15)
 *   status          – "AVAILABLE"
 *   remarks         – string | null
 */

import React, { useEffect, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { SafeAreaView } from 'react-native-safe-area-context';
import AsyncStorage from '@react-native-async-storage/async-storage';

import { createProviderSlot } from '../../src/utils/api';

// ─── Colour tokens ─────────────────────────────────────────────────────────────
const COLORS = {
  background: '#F4F7FC',
  navy: '#19365A',
  green: '#279653',
  paleGreen: '#E1F1D9',
  white: '#FFFFFF',
  border: '#DCE4F0',
  text: '#687B98',
  blue: '#2D63ED',
};

// ─── Hour / minute options ─────────────────────────────────────────────────────
// Each hour entry has a unique id (used as the state key) and a 24-hour value
// for building ISO datetime strings.
const HOURS = [
  { id: 'h06', label: '6',  value24: 6  },
  { id: 'h07', label: '7',  value24: 7  },
  { id: 'h08', label: '8',  value24: 8  },
  { id: 'h09', label: '9',  value24: 9  },
  { id: 'h10', label: '10', value24: 10 },
  { id: 'h11', label: '11', value24: 11 },
  { id: 'h12', label: '12', value24: 12 },
  { id: 'h13', label: '1',  value24: 13 },
  { id: 'h14', label: '2',  value24: 14 },
  { id: 'h15', label: '3',  value24: 15 },
  { id: 'h16', label: '4',  value24: 16 },
  { id: 'h17', label: '5',  value24: 17 },
  { id: 'h18', label: '6',  value24: 18 },
  { id: 'h19', label: '7',  value24: 19 },
  { id: 'h20', label: '8',  value24: 20 },
  { id: 'h21', label: '9',  value24: 21 },
];

const MINUTES = ['00', '15', '30', '45'];

// ─── Helpers ──────────────────────────────────────────────────────────────────

/** Pad a number to 2 digits */
const pad2 = (n) => String(n).padStart(2, '0');

/** Build an ISO datetime string for a given date, hour (24h), and minute */
function buildDateTime(dateStr, hour24, minuteStr) {
  // dateStr is "YYYY-MM-DD"
  return `${dateStr}T${pad2(hour24)}:${minuteStr}:00`;
}

/** Get today's date as "YYYY-MM-DD" */
function todayStr() {
  return new Date().toISOString().slice(0, 10);
}

// ─── Component ────────────────────────────────────────────────────────────────
export default function PublishAvailabilityScreen({ order, onBack, onClose, onPublished }) {
  const [selectedHours, setSelectedHours] = useState(['h11', 'h13']);
  const [selectedMinutes, setSelectedMinutes] = useState(['00', '15']);
  const [slotDuration, setSlotDuration] = useState('15');
  const [note, setNote] = useState('');
  const [slotDate, setSlotDate] = useState(todayStr());
  const [providerId, setProviderId] = useState(null);
  const [loading, setLoading] = useState(false);

  // Load the provider/agent ID from AsyncStorage
  useEffect(() => {
    async function loadProviderId() {
      // Prefer the agency numeric ID; fall back to username (phone)
      const agencyId = await AsyncStorage.getItem('agencyId');
      const username = await AsyncStorage.getItem('username');
      setProviderId(agencyId || username);
    }
    loadProviderId();
  }, []);

  // If order has a date, default to that date
  useEffect(() => {
    if (order?.orderDate) setSlotDate(order.orderDate);
    else if (order?.deliveryDate) setSlotDate(order.deliveryDate);
  }, [order]);

  function toggleHour(hourId) {
    setSelectedHours((curr) =>
      curr.includes(hourId) ? curr.filter((id) => id !== hourId) : [...curr, hourId]
    );
  }

  function toggleMinute(minute) {
    setSelectedMinutes((curr) =>
      curr.includes(minute) ? curr.filter((v) => v !== minute) : [...curr, minute]
    );
  }

  // ── Publish ────────────────────────────────────────────────────────────────
  async function publishAvailability() {
    if (selectedHours.length === 0 || selectedMinutes.length === 0) {
      Alert.alert('Select availability', 'Choose at least one hour and one minute option.');
      return;
    }
    if (!providerId) {
      Alert.alert('Not ready', 'Provider ID not found. Please try again.');
      return;
    }

    const durationMins = parseInt(slotDuration, 10) || 15;

    // Build one slot per selected hour × minute combination
    const slots = [];
    for (const hourId of selectedHours) {
      const hourEntry = HOURS.find((h) => h.id === hourId);
      if (!hourEntry) continue;
      for (const minute of selectedMinutes) {
        const startTime = buildDateTime(slotDate, hourEntry.value24, minute);
        // endTime = startTime + durationMins
        const endHour = hourEntry.value24 + Math.floor((parseInt(minute, 10) + durationMins) / 60);
        const endMin = (parseInt(minute, 10) + durationMins) % 60;
        const endTime = buildDateTime(slotDate, endHour % 24, pad2(endMin));

        slots.push({
          slotDate,
          startTime,
          endTime,
          slotDurationMins: durationMins,
          status: 'AVAILABLE',
          remarks: note.trim() || null,
        });
      }
    }

    setLoading(true);
    try {
      // Post all slots sequentially (could be parallelised if needed)
      for (const slot of slots) {
        await createProviderSlot(providerId, slot);
      }

      Alert.alert(
        'Published',
        `${slots.length} availability slot${slots.length !== 1 ? 's' : ''} published successfully.`,
        [{ text: 'OK', onPress: onPublished || onClose }]
      );
    } catch (err) {
      Alert.alert('Error', err.message || 'Failed to publish availability.');
    } finally {
      setLoading(false);
    }
  }

  // ── Render ─────────────────────────────────────────────────────────────────
  // Derive display month/day from slotDate
  const [, month, day] = slotDate.split('-');
  const monthNames = ['JAN','FEB','MAR','APR','MAY','JUN','JUL','AUG','SEP','OCT','NOV','DEC'];
  const monthLabel = monthNames[parseInt(month, 10) - 1] || month;

  return (
    <SafeAreaView style={styles.safeArea}>
      <StatusBar style="dark" />

      <ScrollView
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
      >
        {/* Back button */}
        <Pressable
          accessibilityRole="button"
          onPress={onBack}
          style={styles.backButton}
        >
          <Text style={styles.backArrow}>‹</Text>
          <Text style={styles.backText}>Booking Details</Text>
        </Pressable>

        {/* Header */}
        <View style={styles.header}>
          <View style={styles.headerText}>
            <Text style={styles.eyebrow}>OHBABU · PROVIDER</Text>
            <Text style={styles.title}>Publish Availability</Text>
            <Text style={styles.subtitle}>Choose the hours when you are available.</Text>
          </View>

          <View style={styles.dateBadge}>
            <Text style={styles.dateMonth}>{monthLabel}</Text>
            <Text style={styles.dateDay}>{day}</Text>
          </View>
        </View>

        {order ? (
          <Text style={styles.bookingReference}>Booking #{order.id}</Text>
        ) : null}

        {/* Hours grid */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Hours</Text>
          <View style={styles.hoursGrid}>
            {HOURS.map((hour) => {
              const selected = selectedHours.includes(hour.id);
              return (
                <Pressable
                  key={hour.id}
                  accessibilityRole="button"
                  accessibilityState={{ selected }}
                  onPress={() => toggleHour(hour.id)}
                  style={[styles.hourButton, selected && styles.selectedOption]}
                >
                  <Text style={[styles.optionText, selected && styles.selectedOptionText]}>
                    {hour.label}
                  </Text>
                </Pressable>
              );
            })}
          </View>
        </View>

        {/* Minutes row */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Minutes</Text>
          <View style={styles.minuteRow}>
            {MINUTES.map((minute) => {
              const selected = selectedMinutes.includes(minute);
              return (
                <Pressable
                  key={minute}
                  accessibilityRole="button"
                  accessibilityState={{ selected }}
                  onPress={() => toggleMinute(minute)}
                  style={[styles.minuteButton, selected && styles.selectedOption]}
                >
                  <Text style={[styles.optionText, selected && styles.selectedOptionText]}>
                    {minute}
                  </Text>
                </Pressable>
              );
            })}
          </View>
        </View>

        {/* Slot duration */}
        <View style={styles.section}>
          <Text style={styles.fieldLabel}>Slot Duration (minutes)</Text>
          <TextInput
            accessibilityLabel="Slot duration in minutes"
            style={styles.discountInput}
            value={slotDuration}
            onChangeText={(v) => setSlotDuration(v.replace(/\D/g, '').slice(0, 3))}
            keyboardType="number-pad"
            placeholder="15"
            maxLength={3}
          />
        </View>

        {/* Note */}
        <View style={styles.section}>
          <Text style={styles.fieldLabel}>Note</Text>
          <TextInput
            accessibilityLabel="Availability note"
            style={styles.noteInput}
            value={note}
            onChangeText={setNote}
            placeholder="Add any instructions..."
            placeholderTextColor="#8793A5"
            multiline
            textAlignVertical="top"
            maxLength={300}
          />
        </View>

        {/* Action buttons */}
        <View style={styles.actionRow}>
          <Pressable
            accessibilityRole="button"
            onPress={publishAvailability}
            disabled={loading}
            style={({ pressed }) => [
              styles.publishButton,
              pressed && styles.pressed,
              loading && { opacity: 0.6 },
            ]}
          >
            {loading ? (
              <ActivityIndicator color={COLORS.white} />
            ) : (
              <Text style={styles.actionText}>Publish</Text>
            )}
          </Pressable>

          <Pressable
            accessibilityRole="button"
            onPress={onClose}
            disabled={loading}
            style={({ pressed }) => [styles.closeButton, pressed && styles.pressed]}
          >
            <Text style={styles.actionText}>Close</Text>
          </Pressable>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

// ─── Styles ───────────────────────────────────────────────────────────────────
const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: COLORS.background },
  content: { padding: 20, paddingBottom: 32 },
  backButton: {
    flexDirection: 'row',
    alignItems: 'center',
    alignSelf: 'flex-start',
    marginBottom: 22,
  },
  backArrow: { color: COLORS.blue, fontSize: 30, marginRight: 8 },
  backText: { color: COLORS.blue, fontSize: 13, fontWeight: '700' },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 14,
  },
  headerText: { flex: 1, paddingRight: 12 },
  eyebrow: {
    color: COLORS.blue,
    fontSize: 11,
    fontWeight: '800',
    letterSpacing: 1.4,
    marginBottom: 8,
  },
  title: { color: COLORS.navy, fontSize: 24, fontWeight: '800' },
  subtitle: { color: COLORS.text, fontSize: 13, lineHeight: 19, marginTop: 7 },
  dateBadge: {
    width: 60,
    height: 64,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: COLORS.white,
    borderWidth: 1,
    borderColor: COLORS.border,
    borderRadius: 12,
  },
  dateMonth: { color: COLORS.green, fontSize: 11, fontWeight: '800' },
  dateDay: { color: COLORS.navy, fontSize: 23, fontWeight: '800' },
  bookingReference: { color: COLORS.text, fontSize: 12, marginBottom: 20 },
  section: { marginBottom: 24 },
  sectionTitle: { color: COLORS.navy, fontSize: 16, fontWeight: '800', marginBottom: 14 },
  hoursGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    rowGap: 8,
  },
  hourButton: {
    width: '23%',
    minHeight: 45,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: COLORS.paleGreen,
    borderWidth: 1,
    borderColor: '#BEDCB3',
    borderRadius: 10,
  },
  minuteRow: { flexDirection: 'row', gap: 8 },
  minuteButton: {
    flex: 1,
    minHeight: 46,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: COLORS.paleGreen,
    borderWidth: 1,
    borderColor: '#BEDCB3',
    borderRadius: 10,
  },
  selectedOption: { backgroundColor: COLORS.green, borderColor: COLORS.green },
  optionText: { color: COLORS.navy, fontSize: 13, fontWeight: '700' },
  selectedOptionText: { color: COLORS.white },
  fieldLabel: { color: COLORS.navy, fontSize: 13, fontWeight: '800', marginBottom: 9 },
  discountInput: {
    height: 45,
    backgroundColor: COLORS.white,
    borderWidth: 1,
    borderColor: COLORS.border,
    borderRadius: 10,
    paddingHorizontal: 12,
    color: COLORS.navy,
    fontSize: 14,
  },
  noteInput: {
    minHeight: 82,
    backgroundColor: COLORS.white,
    borderWidth: 1,
    borderColor: COLORS.border,
    borderRadius: 10,
    padding: 12,
    color: COLORS.navy,
    fontSize: 13,
  },
  actionRow: { flexDirection: 'row', gap: 10, marginTop: 2 },
  publishButton: {
    flex: 1,
    minHeight: 48,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: COLORS.green,
    borderRadius: 10,
  },
  closeButton: {
    flex: 1,
    minHeight: 48,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: COLORS.blue,
    borderRadius: 10,
  },
  actionText: { color: COLORS.white, fontSize: 14, fontWeight: '800' },
  pressed: { opacity: 0.78 },
});
