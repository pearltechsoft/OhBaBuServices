
import { useState } from 'react';
import {
  Alert,
  Modal,
  Pressable,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';

const COLORS = {
  green: '#279653',
  paleGreen: '#DCEBD6',
  navy: '#19365A',
  white: '#FFFFFF',
  text: '#687B98',
  gold: '#E6AD37',
  border: '#B8D6AA',
};

export default function FeedbackScreen({ visible, orderId, onClose }) {
  const [rating, setRating] = useState(0);
  const [description, setDescription] = useState('');

  function submitFeedback() {
    if (rating === 0) {
      Alert.alert('Rating required', 'Please select a star rating.');
      return;
    }

    Alert.alert(
      'Feedback preview',
      `Booking #${orderId}\nRating: ${rating}/5\nDescription: ${
        description.trim() || 'No description'
      }\n\nSaving feedback will be connected later.`,
      [
        {
          text: 'OK',
          onPress: onClose,
        },
      ]
    );
  }

  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      onRequestClose={onClose}
    >
      <View style={styles.overlay}>
        <View style={styles.card}>
          <View style={styles.header}>
            <Text style={styles.title}>Feedback</Text>
            <Text style={styles.bookingId}>#{orderId}</Text>
          </View>

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
                    star <= rating
                      ? styles.selectedStar
                      : styles.unselectedStar,
                  ]}
                >
                  ★
                </Text>
              </Pressable>
            ))}
          </View>

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
          />

          <Pressable
            accessibilityRole="button"
            onPress={submitFeedback}
            style={({ pressed }) => [
              styles.submitButton,
              pressed && styles.pressed,
            ]}
          >
            <Text style={styles.submitText}>Submit</Text>
          </Pressable>

          <Pressable
            accessibilityRole="button"
            onPress={onClose}
            style={styles.cancelButton}
          >
            <Text style={styles.cancelText}>Cancel</Text>
          </Pressable>
        </View>
      </View>
    </Modal>
  );
}

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
  title: {
    color: COLORS.navy,
    fontSize: 17,
    fontWeight: '800',
  },
  bookingId: {
    color: COLORS.navy,
    fontSize: 17,
    fontWeight: '700',
  },
  stars: {
    flexDirection: 'row',
    justifyContent: 'center',
    marginVertical: 14,
  },
  starButton: {
    paddingHorizontal: 4,
    paddingVertical: 2,
  },
  star: {
    fontSize: 38,
  },
  selectedStar: {
    color: COLORS.gold,
  },
  unselectedStar: {
    color: '#9299A5',
  },
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
  submitText: {
    color: COLORS.white,
    fontSize: 14,
    fontWeight: '800',
  },
  cancelButton: {
    alignItems: 'center',
    paddingVertical: 12,
  },
  cancelText: {
    color: COLORS.text,
    fontSize: 13,
    fontWeight: '600',
  },
  pressed: {
    opacity: 0.8,
  },
});
