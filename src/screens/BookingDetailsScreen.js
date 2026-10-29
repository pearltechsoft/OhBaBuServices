
import { useState } from 'react';
import {
  Alert,
  Modal,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { StatusBar } from 'expo-status-bar';

import FeedbackScreen from './FeedbackScreen';
import PublishAvailabilityScreen from './PublishAvailabilityScreen';

const HOURS = [
  '6', '7', '8', '9',
  '10', '11', '12', '1', '2', '3',
  '4', '5', '6', '7', '8', '9',
];

const MINUTES = ['00', '15', '30', '45'];

const COLORS = {
  background: '#F4F7FC',
  navy: '#19365A',
  green: '#279653',
  lightGreen: '#E1F1D9',
  white: '#FFFFFF',
  border: '#DCE4F0',
  text: '#687B98',
  blue: '#2D63ED',
  red: '#D64545',
};

export default function BookingDetailsScreen({ booking, onBack }) {
  const [selectedHour, setSelectedHour] = useState('1');
  const [selectedMinute, setSelectedMinute] = useState('00');
  const [showAvailability, setShowAvailability] = useState(false);
  const [feedbackVisible, setFeedbackVisible] = useState(false);
  const [rejectModalVisible, setRejectModalVisible] = useState(false);
  const [rejectReason, setRejectReason] = useState('');

  function handleAction(action) {
    const selectedTime = `${selectedHour}:${selectedMinute}`;

    Alert.alert(
      action,
      `Selected time: ${selectedTime}\n\nThe backend action will be connected later.`
    );
  }

  function submitRejectReason() {
    const reason = rejectReason.trim();

    if (!reason) {
      Alert.alert(
        'Reason required',
        'Please enter a reason for rejecting this booking.'
      );
      return;
    }

    Alert.alert(
      'Rejection preview',
      `Booking #${booking.id}\nReason: ${reason}\n\nRejection will be connected to the backend later.`,
      [
        {
          text: 'OK',
          onPress: () => {
            setRejectModalVisible(false);
            setRejectReason('');
          },
        },
      ]
    );
  }

  // Open Publish Availability when Suggest is selected.
  if (showAvailability) {
    return (
      <PublishAvailabilityScreen
        booking={booking}
        onBack={() => setShowAvailability(false)}
        onClose={onBack}
      />
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
          <Text style={styles.backText}>All Booked Slots</Text>
        </Pressable>

        <Text style={styles.eyebrow}>OHBABU · PROVIDER</Text>
        <Text style={styles.title}>Booking Details</Text>
        <Text style={styles.subtitle}>
          Review the booking and choose an action.
        </Text>

        <View style={styles.bookingCard}>
          <View style={styles.bookingHeader}>
            <Text style={styles.bookingId}>
              Booking #{booking.id}
            </Text>
            <Text style={styles.status}>{booking.status}</Text>
          </View>

          <Text style={styles.label}>BOOKING DATE</Text>
          <Text style={styles.date}>{booking.date}</Text>

          <Text style={styles.label}>ORIGINAL TIME</Text>
          <Text style={styles.originalTime}>{booking.time}</Text>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Hours</Text>
          <Text style={styles.sectionDescription}>
            Select a proposed hour.
          </Text>

          <View style={styles.optionsGrid}>
            {HOURS.map((hour, index) => {
              const selected = selectedHour === hour;

              return (
                <Pressable
                  key={`${hour}-${index}`}
                  accessibilityRole="button"
                  accessibilityState={{ selected }}
                  onPress={() => setSelectedHour(hour)}
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
                    {hour}
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
              const selected = selectedMinute === minute;

              return (
                <Pressable
                  key={minute}
                  accessibilityRole="button"
                  accessibilityState={{ selected }}
                  onPress={() => setSelectedMinute(minute)}
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

        <View style={styles.customerCard}>
          <Text style={styles.label}>CUSTOMER</Text>
          <Text style={styles.customerName}>Krishna Rao</Text>

          <View style={styles.separator} />

          <Text style={styles.label}>SERVICE</Text>
          <Text style={styles.serviceName}>Service details</Text>
        </View>

        <View style={styles.actionRow}>
          <Pressable
            accessibilityRole="button"
            onPress={() => handleAction('Accept')}
            style={({ pressed }) => [
              styles.actionButton,
              styles.acceptButton,
              pressed && styles.pressed,
            ]}
          >
            <Text style={styles.actionText}>Accept</Text>
          </Pressable>

          <Pressable
            accessibilityRole="button"
            onPress={() => setShowAvailability(true)}
            style={({ pressed }) => [
              styles.actionButton,
              styles.suggestButton,
              pressed && styles.pressed,
            ]}
          >
            <Text style={styles.actionText}>Suggest</Text>
          </Pressable>

          <Pressable
            accessibilityRole="button"
            onPress={() => {
              setRejectReason('');
              setRejectModalVisible(true);
            }}
            style={({ pressed }) => [
              styles.actionButton,
              styles.rejectButton,
              pressed && styles.pressed,
            ]}
          >
            <Text style={styles.actionText}>Reject</Text>
          </Pressable>
        </View>

        <Pressable
          accessibilityRole="button"
          onPress={() => setFeedbackVisible(true)}
          style={({ pressed }) => [
            styles.feedbackButton,
            pressed && styles.pressed,
          ]}
        >
          <Text style={styles.feedbackButtonText}>Give Feedback</Text>
        </Pressable>

        <FeedbackScreen
          visible={feedbackVisible}
          orderId={booking.id}
          onClose={() => setFeedbackVisible(false)}
        />

        <Modal
          visible={rejectModalVisible}
          transparent
          animationType="fade"
          onRequestClose={() => setRejectModalVisible(false)}
        >
          <View style={styles.rejectOverlay}>
            <View style={styles.rejectCard}>
              <Text style={styles.rejectTitle}>Reject Booking</Text>

              <Text style={styles.rejectDescription}>
                Please explain why you are rejecting booking #{booking.id}.
              </Text>

              <TextInput
                accessibilityLabel="Reason for rejecting booking"
                value={rejectReason}
                onChangeText={setRejectReason}
                placeholder="Enter rejection reason..."
                placeholderTextColor={COLORS.text}
                style={styles.rejectInput}
                multiline
                maxLength={300}
                textAlignVertical="top"
              />

              <View style={styles.rejectActions}>
                <Pressable
                  accessibilityRole="button"
                  onPress={() => setRejectModalVisible(false)}
                  style={styles.cancelButton}
                >
                  <Text style={styles.cancelText}>Cancel</Text>
                </Pressable>

                <Pressable
                  accessibilityRole="button"
                  onPress={submitRejectReason}
                  style={styles.confirmRejectButton}
                >
                  <Text style={styles.confirmRejectText}>Submit</Text>
                </Pressable>
              </View>
            </View>
          </View>
        </Modal>

        <Text style={styles.previewNote}>
          UI preview only. Booking actions are not connected to the backend.
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
    marginBottom: 24,
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
  eyebrow: {
    color: COLORS.blue,
    fontSize: 11,
    fontWeight: '800',
    letterSpacing: 1.4,
    marginBottom: 8,
  },
  title: {
    color: COLORS.navy,
    fontSize: 26,
    fontWeight: '800',
  },
  subtitle: {
    color: COLORS.text,
    fontSize: 13,
    lineHeight: 19,
    marginTop: 7,
    marginBottom: 22,
  },
  bookingCard: {
    backgroundColor: COLORS.white,
    borderRadius: 16,
    padding: 16,
    borderWidth: 1,
    borderColor: COLORS.border,
    marginBottom: 22,
  },
  bookingHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20,
  },
  bookingId: {
    color: COLORS.navy,
    fontSize: 17,
    fontWeight: '800',
  },
  status: {
    color: COLORS.green,
    fontSize: 12,
    fontWeight: '700',
  },
  label: {
    color: COLORS.text,
    fontSize: 10,
    fontWeight: '800',
    letterSpacing: 0.8,
    marginBottom: 6,
  },
  date: {
    color: COLORS.navy,
    fontSize: 15,
    fontWeight: '700',
    marginBottom: 16,
  },
  originalTime: {
    color: COLORS.navy,
    fontSize: 14,
    fontWeight: '600',
  },
  section: {
    marginBottom: 22,
  },
  sectionTitle: {
    color: COLORS.navy,
    fontSize: 16,
    fontWeight: '800',
    marginBottom: 5,
  },
  sectionDescription: {
    color: COLORS.text,
    fontSize: 12,
    marginBottom: 12,
  },
  optionsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  hourButton: {
    width: '14%',
    minHeight: 42,
    backgroundColor: COLORS.lightGreen,
    borderRadius: 9,
    borderWidth: 1,
    borderColor: '#B8D6AA',
    alignItems: 'center',
    justifyContent: 'center',
  },
  minuteRow: {
    flexDirection: 'row',
    gap: 8,
    marginTop: 10,
  },
  minuteButton: {
    flex: 1,
    minHeight: 44,
    backgroundColor: COLORS.lightGreen,
    borderRadius: 9,
    borderWidth: 1,
    borderColor: '#B8D6AA',
    alignItems: 'center',
    justifyContent: 'center',
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
  customerCard: {
    backgroundColor: COLORS.white,
    borderRadius: 16,
    padding: 16,
    borderWidth: 1,
    borderColor: COLORS.border,
    marginBottom: 22,
  },
  customerName: {
    color: COLORS.navy,
    fontSize: 16,
    fontWeight: '700',
  },
  separator: {
    height: 1,
    backgroundColor: COLORS.border,
    marginVertical: 16,
  },
  serviceName: {
    color: COLORS.navy,
    fontSize: 14,
  },
  actionRow: {
    flexDirection: 'row',
    gap: 8,
  },
  actionButton: {
    flex: 1,
    minHeight: 46,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 10,
    paddingHorizontal: 4,
  },
  acceptButton: {
    backgroundColor: COLORS.green,
  },
  suggestButton: {
    backgroundColor: COLORS.blue,
  },
  rejectButton: {
    backgroundColor: COLORS.red,
  },
  actionText: {
    color: COLORS.white,
    fontSize: 13,
    fontWeight: '800',
  },
  feedbackButton: {
    minHeight: 46,
    marginTop: 14,
    borderWidth: 1,
    borderColor: COLORS.border,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: COLORS.white,
  },
  feedbackButtonText: {
    color: COLORS.blue,
    fontSize: 14,
    fontWeight: '700',
  },
  rejectOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.55)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 24,
  },
  rejectCard: {
    width: '100%',
    maxWidth: 380,
    backgroundColor: COLORS.white,
    borderRadius: 16,
    padding: 20,
  },
  rejectTitle: {
    color: COLORS.navy,
    fontSize: 20,
    fontWeight: '800',
    marginBottom: 8,
  },
  rejectDescription: {
    color: COLORS.text,
    fontSize: 13,
    lineHeight: 19,
    marginBottom: 16,
  },
  rejectInput: {
    minHeight: 100,
    borderWidth: 1,
    borderColor: COLORS.border,
    borderRadius: 10,
    padding: 12,
    color: COLORS.navy,
    fontSize: 14,
  },
  rejectActions: {
    flexDirection: 'row',
    gap: 10,
    marginTop: 16,
  },
  cancelButton: {
    flex: 1,
    minHeight: 44,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: COLORS.border,
    borderRadius: 10,
  },
  cancelText: {
    color: COLORS.navy,
    fontWeight: '700',
  },
  confirmRejectButton: {
    flex: 1,
    minHeight: 44,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: COLORS.red,
    borderRadius: 10,
  },
  confirmRejectText: {
    color: COLORS.white,
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
