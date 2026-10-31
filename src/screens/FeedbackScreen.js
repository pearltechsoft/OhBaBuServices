/**
 * FeedbackScreen.js
 *
 * Modal allowing the provider to submit star-rating feedback for a completed order.
 *
 * API: POST /ohbabu/feedback
 *
 * FeedbackDTO body:
 *   userid  : string   — provider's username (from AsyncStorage)
 *   orderid : number   — the order / booking ID
 *   details : string   — free-text feedback
 *   rating  : number   — 1–5
 *
 * Props:
 *   visible    : boolean
 *   orderId    : number | string
 *   customerId : string  (optional – customer username shown in header)
 *   onClose    : () => void   — called when modal is dismissed without submitting
 *   onSubmitted: () => void   — called after a successful API submission
 */

import React, { useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  Modal,
  Pressable,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';

import { submitFeedback } from '../../src/utils/api';

// ─── Colour tokens ─────────────────────────────────────────────────────────────
const COLORS = {
  green: '#279653',
  paleGreen: '#DCEBD6',
  navy: '#19365A',
  white: '#FFFFFF',
  text: '#687B98',
  gold: '#E6AD37',
  border: '#B8D6AA',
  red: '#D93025',
};

// ─── Component ────────────────────────────────────────────────────────────────
export default function FeedbackScreen({
  visible,
  orderId,
  customerId,
  onClose,
  onSubmitted,
}) {
  const [rating, setRating] = useState(0);
  const [description, setDescription] = useState('');
  const [loading, setLoading] = useState(false);

  function resetState() {
    setRating(0);
    setDescription('');
  }

  function handleClose() {
    resetState();
    onClose();
  }

  // ── Submit ─────────────────────────────────────────────────────────────────
  async function submitFeedbackHandler() {
    if (rating === 0) {
      Alert.alert('Rating required', 'Please select a star rating before submitting.');
      return;
    }

    setLoading(true);
    try {
      const username = await AsyncStorage.getItem('username');

      await submitFeedback({
        userid: username || '',
        orderid: typeof orderId === 'string' ? parseInt(orderId, 10) : orderId,
        details: description.trim(),
        rating,
      });

      resetState();
      Alert.alert('Feedback submitted', 'Thank you for your feedback!', [
        { text: 'OK', onPress: onSubmitted || onClose },
      ]);
    } catch (err) {
      Alert.alert('Error', err.message || 'Failed to submit feedback. Please try again.');
    } finally {
      setLoading(false);
    }
  }

  // ── Render ─────────────────────────────────────────────────────────────────
  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      onRequestClose={handleClose}
    >
      <View style={styles.overlay}>
        <View style={styles.card}>
          {/* Header */}
          <View style={styles.header}>
            <Text style={styles.title}>Feedback</Text>
            <Text style={styles.bookingId}>#{orderId}</Text>
          </View>

          {customerId ? (
            <Text style={styles.customerHint}>for {customerId}</Text>
          ) : null}

          {/* Star rating */}
          <View style={styles.stars}>
            {[1, 2, 3, 4, 5].map((star) => (
              <Pressable
                key={star}
                accessibilityRole="button"
                accessibilityLabel={`Rate ${star} out of 5 stars`}
                accessibilityState={{ selected: rating === star }}
                onPress={() => setRating(star)}
                style={styles.starButton}
              >
                <Text
                  style={[
                    styles.star,
                    star <= rating ? styles.selectedStar : styles.unselectedStar,
                  ]}
                >
                  ★
                </Text>
              </Pressable>
            ))}
          </View>

          {/* Description */}
          <TextInput
            accessibilityLabel="Feedback description"
            style={styles.description}
            value={description}
            onChangeText={setDescription}
            placeholder="Write your feedback..."
            placeholderTextColor={COLORS.text}
            multiline
            textAlignVertical="top"
            maxLength={500}
            editable={!loading}
          />

          {/* Submit */}
          <Pressable
            accessibilityRole="button"
            onPress={submitFeedbackHandler}
            disabled={loading}
            style={({ pressed }) => [
              styles.submitButton,
              pressed && styles.pressed,
              loading && { opacity: 0.6 },
            ]}
          >
            {loading ? (
              <ActivityIndicator color={COLORS.white} />
            ) : (
              <Text style={styles.submitText}>Submit</Text>
            )}
          </Pressable>

          {/* Cancel */}
          <Pressable
            accessibilityRole="button"
            onPress={handleClose}
            disabled={loading}
            style={styles.cancelButton}
          >
            <Text style={styles.cancelText}>Cancel</Text>
          </Pressable>
        </View>
      </View>
    </Modal>
  );
}

// ─── Styles ───────────────────────────────────────────────────────────────────
const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.55)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 24,
  },
  card: {
    width: '100%',
    maxWidth: 380,
    backgroundColor: COLORS.paleGreen,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: COLORS.border,
    padding: 18,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
    paddingBottom: 12,
  },
  title: { color: COLORS.navy, fontSize: 17, fontWeight: '800' },
  bookingId: { color: COLORS.navy, fontSize: 17, fontWeight: '700' },
  customerHint: {
    color: COLORS.text,
    fontSize: 12,
    marginTop: 6,
    marginBottom: 2,
  },
  stars: {
    flexDirection: 'row',
    justifyContent: 'center',
    marginVertical: 14,
  },
  starButton: { paddingHorizontal: 4, paddingVertical: 2 },
  star: { fontSize: 38 },
  selectedStar: { color: COLORS.gold },
  unselectedStar: { color: '#9299A5' },
  description: {
    minHeight: 96,
    backgroundColor: COLORS.white,
    borderWidth: 1,
    borderColor: COLORS.border,
    borderRadius: 8,
    padding: 12,
    color: COLORS.navy,
    fontSize: 14,
  },
  submitButton: {
    minHeight: 44,
    backgroundColor: COLORS.green,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 16,
  },
  submitText: { color: COLORS.white, fontSize: 14, fontWeight: '800' },
  cancelButton: { alignItems: 'center', paddingVertical: 12 },
  cancelText: { color: COLORS.text, fontSize: 13, fontWeight: '600' },
  pressed: { opacity: 0.8 },
});
