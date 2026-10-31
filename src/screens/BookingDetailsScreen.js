/**
 * BookingDetailsScreen.js
 *
 * Displays full details of a single order and allows the provider to:
 *   • Accept  → PATCH /ohbabu/orders/{orderId}/accept
 *   • Reject  → PATCH /ohbabu/orders/status/{orderId}  body: "Cancelled"
 *   • Suggest → opens PublishAvailabilityScreen (provider suggests new slots)
 *   • Feedback → opens FeedbackScreen modal
 *
 * The `order` prop is an OrdersDTO returned by fetchOrdersByAgent.
 * The `onBack` prop navigates back to the list.
 * The `onOrderUpdated` prop triggers a list refresh after an action.
 */

import React, { useState } from 'react';
import {
  ActivityIndicator,
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
import { acceptOrder, changeOrderStatus } from '../../src/utils/api';

// ─── Colour tokens ─────────────────────────────────────────────────────────────
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

// ─── Time selectors (for suggested rescheduling) ───────────────────────────────
const HOURS = [
  '6', '7', '8', '9',
  '10', '11', '12', '1', '2', '3',
  '4', '5', '6', '7', '8', '9',
];

const MINUTES = ['00', '15', '30', '45'];

// ─── Helper: format ISO date ───────────────────────────────────────────────────
function formatDate(dateStr) {
  if (!dateStr) return '—';
  try {
    return new Date(dateStr).toLocaleDateString('en-IN', {
      day: '2-digit', month: 'short', year: 'numeric',
    });
  } catch {
    return dateStr;
  }
}

// ─── Component ────────────────────────────────────────────────────────────────
export default function BookingDetailsScreen({ order, onBack, onOrderUpdated }) {
  const [selectedHour, setSelectedHour] = useState('1');
  const [selectedMinute, setSelectedMinute] = useState('00');
  const [showAvailability, setShowAvailability] = useState(false);
  const [feedbackVisible, setFeedbackVisible] = useState(false);
  const [rejectModalVisible, setRejectModalVisible] = useState(false);
  const [rejectReason, setRejectReason] = useState('');
  const [actionLoading, setActionLoading] = useState(false);

  // ── Accept ──────────────────────────────────────────────────────────────────
  async function handleAccept() {
    Alert.alert(
      'Accept Booking',
      `Accept booking #${order.id}?`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Accept',
          onPress: async () => {
            setActionLoading(true);
            try {
              await acceptOrder(order.id);
              Alert.alert('Success', `Booking #${order.id} accepted.`, [
                { text: 'OK', onPress: onOrderUpdated },
              ]);
            } catch (err) {
              Alert.alert('Error', err.message || 'Failed to accept booking.');
            } finally {
              setActionLoading(false);
            }
          },
        },
      ]
    );
  }

  // ── Reject ──────────────────────────────────────────────────────────────────
  async function submitRejectReason() {
    const reason = rejectReason.trim();
    if (!reason) {
      Alert.alert('Reason required', 'Please enter a reason for rejecting this booking.');
      return;
    }

    setActionLoading(true);
    try {
      // Change status to Cancelled; the reason is stored in comments via
      // the full order update if needed, but the primary action is status change.
      await changeOrderStatus(order.id, 'Cancelled');
      setRejectModalVisible(false);
      setRejectReason('');
      Alert.alert('Rejected', `Booking #${order.id} has been rejected.`, [
        { text: 'OK', onPress: onOrderUpdated },
      ]);
    } catch (err) {
      Alert.alert('Error', err.message || 'Failed to reject booking.');
    } finally {
      setActionLoading(false);
    }
  }

  // ── Show Publish Availability for Suggest flow ──────────────────────────────
  if (showAvailability) {
    return (
      <PublishAvailabilityScreen
        order={order}
        onBack={() => setShowAvailability(false)}
        onClose={onBack}
        onPublished={onOrderUpdated}
      />
    );
  }

  // ── Render ──────────────────────────────────────────────────────────────────
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
          <Text style={styles.backText}>All Booked Slots</Text>
        </Pressable>

        <Text style={styles.eyebrow}>OHBABU · PROVIDER</Text>
        <Text style={styles.title}>Booking Details</Text>
        <Text style={styles.subtitle}>Review the booking and choose an action.</Text>

        {/* Booking summary card */}
        <View style={styles.bookingCard}>
          <View style={styles.bookingHeader}>
            <Text style={styles.bookingId}>Booking #{order.id}</Text>
            <Text style={styles.status}>{order.status || 'Open'}</Text>
          </View>

          <Text style={styles.label}>BOOKING DATE</Text>
          <Text style={styles.date}>{formatDate(order.orderDate || order.deliveryDate)}</Text>

          <Text style={styles.label}>DELIVERY SLOT</Text>
          <Text style={styles.originalTime}>{order.deliverySlot || '—'}</Text>

          {order.description ? (
            <>
              <Text style={[styles.label, { marginTop: 12 }]}>DESCRIPTION</Text>
              <Text style={styles.descriptionText}>{order.description}</Text>
            </>
          ) : null}
        </View>

        {/* Hour selector */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Suggested Hour</Text>
          <Text style={styles.sectionDescription}>
            Select a proposed hour if suggesting a reschedule.
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
                  style={[styles.hourButton, selected && styles.selectedOption]}
                >
                  <Text style={[styles.optionText, selected && styles.selectedOptionText]}>
                    {hour}
                  </Text>
                </Pressable>
              );
            })}
          </View>
        </View>

        {/* Minute selector */}
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

        {/* Customer info card */}
        <View style={styles.customerCard}>
          <Text style={styles.label}>CUSTOMER</Text>
          <Text style={styles.customerName}>{order.userid || '—'}</Text>

          {order.customerphone ? (
            <>
              <View style={styles.separator} />
              <Text style={styles.label}>PHONE</Text>
              <Text style={styles.serviceName}>{order.customerphone}</Text>
            </>
          ) : null}

          {order.bookingAddress || order.deliveryAddress ? (
            <>
              <View style={styles.separator} />
              <Text style={styles.label}>ADDRESS</Text>
              <Text style={styles.serviceName}>
                {order.bookingAddress || order.deliveryAddress}
              </Text>
            </>
          ) : null}
        </View>

        {/* Action buttons */}
        {actionLoading ? (
          <ActivityIndicator size="large" color={COLORS.green} style={{ marginVertical: 16 }} />
        ) : (
          <View style={styles.actionRow}>
            <Pressable
              accessibilityRole="button"
              onPress={handleAccept}
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
        )}

        {/* Feedback button */}
        <Pressable
          accessibilityRole="button"
          onPress={() => setFeedbackVisible(true)}
          style={({ pressed }) => [styles.feedbackButton, pressed && styles.pressed]}
        >
          <Text style={styles.feedbackButtonText}>Give Feedback</Text>
        </Pressable>

        {/* Feedback modal */}
        <FeedbackScreen
          visible={feedbackVisible}
          orderId={order.id}
          customerId={order.userid}
          onClose={() => setFeedbackVisible(false)}
          onSubmitted={() => {
            setFeedbackVisible(false);
            onOrderUpdated();
          }}
        />

        {/* Reject reason modal */}
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
                Please explain why you are rejecting booking #{order.id}.
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
                  disabled={actionLoading}
                >
                  <Text style={styles.cancelText}>Cancel</Text>
                </Pressable>

                <Pressable
                  accessibilityRole="button"
                  onPress={submitRejectReason}
                  style={styles.confirmRejectButton}
                  disabled={actionLoading}
                >
                  {actionLoading ? (
                    <ActivityIndicator size="small" color={COLORS.white} />
                  ) : (
                    <Text style={styles.confirmRejectText}>Submit</Text>
                  )}
                </Pressable>
              </View>
            </View>
          </View>
        </Modal>
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
    marginBottom: 24,
  },
  backArrow: { color: COLORS.blue, fontSize: 30, marginRight: 8 },
  backText: { color: COLORS.blue, fontSize: 13, fontWeight: '700' },
  eyebrow: {
    color: COLORS.blue,
    fontSize: 11,
    fontWeight: '800',
    letterSpacing: 1.4,
    marginBottom: 8,
  },
  title: { color: COLORS.navy, fontSize: 26, fontWeight: '800' },
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
  bookingId: { color: COLORS.navy, fontSize: 17, fontWeight: '800' },
  status: { color: COLORS.green, fontSize: 12, fontWeight: '700' },
  label: {
    color: COLORS.text,
    fontSize: 10,
    fontWeight: '800',
    letterSpacing: 0.8,
    marginBottom: 6,
  },
  date: { color: COLORS.navy, fontSize: 15, fontWeight: '700', marginBottom: 16 },
  originalTime: { color: COLORS.navy, fontSize: 14, fontWeight: '600' },
  descriptionText: { color: COLORS.text, fontSize: 13, lineHeight: 18 },
  section: { marginBottom: 22 },
  sectionTitle: { color: COLORS.navy, fontSize: 16, fontWeight: '800', marginBottom: 5 },
  sectionDescription: { color: COLORS.text, fontSize: 12, marginBottom: 12 },
  optionsGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
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
  minuteRow: { flexDirection: 'row', gap: 8, marginTop: 10 },
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
  selectedOption: { backgroundColor: COLORS.green, borderColor: COLORS.green },
  optionText: { color: COLORS.navy, fontSize: 13, fontWeight: '700' },
  selectedOptionText: { color: COLORS.white },
  customerCard: {
    backgroundColor: COLORS.white,
    borderRadius: 16,
    padding: 16,
    borderWidth: 1,
    borderColor: COLORS.border,
    marginBottom: 22,
  },
  customerName: { color: COLORS.navy, fontSize: 16, fontWeight: '700' },
  separator: { height: 1, backgroundColor: COLORS.border, marginVertical: 16 },
  serviceName: { color: COLORS.navy, fontSize: 14 },
  actionRow: { flexDirection: 'row', gap: 8 },
  actionButton: {
    flex: 1,
    minHeight: 46,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 10,
    paddingHorizontal: 4,
  },
  acceptButton: { backgroundColor: COLORS.green },
  suggestButton: { backgroundColor: COLORS.blue },
  rejectButton: { backgroundColor: COLORS.red },
  actionText: { color: COLORS.white, fontSize: 13, fontWeight: '800' },
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
  feedbackButtonText: { color: COLORS.blue, fontSize: 14, fontWeight: '700' },
  rejectOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.55)',
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
  rejectTitle: { color: COLORS.navy, fontSize: 20, fontWeight: '800', marginBottom: 8 },
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
  rejectActions: { flexDirection: 'row', gap: 10, marginTop: 16 },
  cancelButton: {
    flex: 1,
    minHeight: 44,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: COLORS.border,
    borderRadius: 10,
  },
  cancelText: { color: COLORS.navy, fontWeight: '700' },
  confirmRejectButton: {
    flex: 1,
    minHeight: 44,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: COLORS.red,
    borderRadius: 10,
  },
  confirmRejectText: { color: COLORS.white, fontWeight: '800' },
  pressed: { opacity: 0.78 },
});
