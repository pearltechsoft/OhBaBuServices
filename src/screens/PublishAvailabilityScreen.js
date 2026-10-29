
import { useState } from 'react';
import {
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

const HOURS = [
  { id: 'h6a', label: '6' },
  { id: 'h7a', label: '7' },
  { id: 'h8a', label: '8' },
  { id: 'h9a', label: '9' },
  { id: 'h10', label: '10' },
  { id: 'h11', label: '11' },
  { id: 'h12', label: '12' },
  { id: 'h1a', label: '1' },
  { id: 'h2a', label: '2' },
  { id: 'h3a', label: '3' },
  { id: 'h4a', label: '4' },
  { id: 'h5a', label: '5' },
  { id: 'h6p', label: '6' },
  { id: 'h7p', label: '7' },
  { id: 'h8p', label: '8' },
  { id: 'h9p', label: '9' },
];

const MINUTES = ['00', '15', '30', '45'];

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

export default function PublishAvailabilityScreen({ booking, onBack, onClose }) {
  const [selectedHours, setSelectedHours] = useState(['h11', 'h1a']);
  const [selectedMinutes, setSelectedMinutes] = useState(['00', '15']);
  const [discount, setDiscount] = useState('20');
  const [note, setNote] = useState('');

  function toggleHour(hourId) {
    setSelectedHours((current) =>
      current.includes(hourId)
        ? current.filter((id) => id !== hourId)
        : [...current, hourId]
    );
  }

  function toggleMinute(minute) {
    setSelectedMinutes((current) =>
      current.includes(minute)
        ? current.filter((value) => value !== minute)
        : [...current, minute]
    );
  }

  function publishAvailability() {
    if (selectedHours.length === 0 || selectedMinutes.length === 0) {
      Alert.alert('Select availability', 'Choose at least one hour and one minute option.');
      return;
    }

    Alert.alert(
      'Availability preview',
      `Hours selected: ${selectedHours.length}\nMinutes selected: ${selectedMinutes.join(', ')}\nDiscount: ${discount || '0'}%\n\nPublishing will be connected to the backend later.`
    );
  }

  return (
    <SafeAreaView style={styles.safeArea}>
      <StatusBar style="dark" />

      <ScrollView
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
      >
        <Pressable
          accessibilityRole="button"
          onPress={onBack}
          style={styles.backButton}
        >
          <Text style={styles.backArrow}>‹</Text>
          <Text style={styles.backText}>Booking Details</Text>
        </Pressable>

        <View style={styles.header}>
          <View style={styles.headerText}>
            <Text style={styles.eyebrow}>OHBABU · PROVIDER</Text>
            <Text style={styles.title}>Publish Availability</Text>
            <Text style={styles.subtitle}>
              Choose the hours when you are available.
            </Text>
          </View>

          <View style={styles.dateBadge}>
            <Text style={styles.dateMonth}>OCT</Text>
            <Text style={styles.dateDay}>28</Text>
          </View>
        </View>

        {booking ? (
          <Text style={styles.bookingReference}>
            Booking #{booking.id}
          </Text>
        ) : null}

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
                  style={[
                    styles.hourButton,
                    selected && styles.selectedOption,
                  ]}
                >
                  <Text
                    style={[
                      styles.optionText,
                      selected && styles.selectedOptionText,
                    ]}
                  >
                    {hour.label}
                  </Text>
                </Pressable>
              );
            })}
          </View>
        </View>

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
                  style={[
                    styles.minuteButton,
                    selected && styles.selectedOption,
                  ]}
                >
                  <Text
                    style={[
                      styles.optionText,
                      selected && styles.selectedOptionText,
                    ]}
                  >
                    {minute}
                  </Text>
                </Pressable>
              );
            })}
          </View>
        </View>

        <View style={styles.section}>
          <Text style={styles.fieldLabel}>Discount (%)</Text>

          <TextInput
            accessibilityLabel="Discount percentage"
            style={styles.discountInput}
            value={discount}
            onChangeText={(value) =>
              setDiscount(value.replace(/\D/g, '').slice(0, 3))
            }
            keyboardType="number-pad"
            placeholder="20"
            maxLength={3}
          />
        </View>

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

        <View style={styles.actionRow}>
          <Pressable
            accessibilityRole="button"
            onPress={publishAvailability}
            style={({ pressed }) => [
              styles.publishButton,
              pressed && styles.pressed,
            ]}
          >
            <Text style={styles.actionText}>Publish</Text>
          </Pressable>

          <Pressable
            accessibilityRole="button"
            onPress={onClose}
            style={({ pressed }) => [
              styles.closeButton,
              pressed && styles.pressed,
            ]}
          >
            <Text style={styles.actionText}>Close</Text>
          </Pressable>
        </View>

        <Text style={styles.previewNote}>
          UI preview only. Availability is not saved to the server yet.
        </Text>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
  content: {
    padding: 20,
    paddingBottom: 32,
  },
  backButton: {
    flexDirection: 'row',
    alignItems: 'center',
    alignSelf: 'flex-start',
    marginBottom: 22,
  },
  backArrow: {
    color: COLORS.blue,
    fontSize: 30,
    marginRight: 8,
  },
  backText: {
    color: COLORS.blue,
    fontSize: 13,
    fontWeight: '700',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 14,
  },
  headerText: {
    flex: 1,
    paddingRight: 12,
  },
  eyebrow: {
    color: COLORS.blue,
    fontSize: 11,
    fontWeight: '800',
    letterSpacing: 1.4,
    marginBottom: 8,
  },
  title: {
    color: COLORS.navy,
    fontSize: 24,
    fontWeight: '800',
  },
  subtitle: {
    color: COLORS.text,
    fontSize: 13,
    lineHeight: 19,
    marginTop: 7,
  },
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
  dateMonth: {
    color: COLORS.green,
    fontSize: 11,
    fontWeight: '800',
  },
  dateDay: {
    color: COLORS.navy,
    fontSize: 23,
    fontWeight: '800',
  },
  bookingReference: {
    color: COLORS.text,
    fontSize: 12,
    marginBottom: 20,
  },
  section: {
    marginBottom: 24,
  },
  sectionTitle: {
    color: COLORS.navy,
    fontSize: 16,
    fontWeight: '800',
    marginBottom: 14,
  },
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
  minuteRow: {
    flexDirection: 'row',
    gap: 8,
  },
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
  selectedOption: {
    backgroundColor: COLORS.green,
    borderColor: COLORS.green,
  },
  optionText: {
    color: COLORS.navy,
    fontSize: 13,
    fontWeight: '700',
  },
  selectedOptionText: {
    color: COLORS.white,
  },
  fieldLabel: {
    color: COLORS.navy,
    fontSize: 13,
    fontWeight: '800',
    marginBottom: 9,
  },
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
  actionRow: {
    flexDirection: 'row',
    gap: 10,
    marginTop: 2,
  },
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
  actionText: {
    color: COLORS.white,
    fontSize: 14,
    fontWeight: '800',
  },
  pressed: {
    opacity: 0.78,
  },
  previewNote: {
    color: COLORS.text,
    fontSize: 11,
    lineHeight: 17,
    textAlign: 'center',
    marginTop: 16,
  },
});
