
import { useState } from 'react';
import {
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { SafeAreaView } from 'react-native-safe-area-context';

import BookingDetailsScreen from './BookingDetailsScreen';

// Temporary data for building and testing the UI.
// We will replace this with real API data later.
const BOOKINGS = [
  {
    id: '123',
    date: '28 Oct 2026',
    time: '1:00–1:15 PM',
    status: 'Pending',
  },
  {
    id: '126',
    date: '28 Oct 2026',
    time: '1:00–1:15 PM',
    status: 'Closed',
    rating: 4,
  },
  {
    id: '1263',
    date: '28 Oct 2026',
    time: '1:00–1:15 PM',
    status: 'Confirmed',
  },
  {
    id: '1268',
    date: '29 Oct 2026',
    time: '10:00–10:15 AM',
    status: 'Pending',
  },
];

const COLORS = {
  background: '#F4F7FC',
  navy: '#19365A',
  primary: '#2D63ED',
  text: '#687B98',
  white: '#FFFFFF',
  border: '#DCE4F0',
  paleGreen: '#E6F6EC',
  paleOrange: '#FFF3D8',
  paleGrey: '#EEF1F5',
};

function getStatusStyle(status) {
  if (status === 'Closed') {
    return styles.closedStatus;
  }

  if (status === 'Confirmed') {
    return styles.confirmedStatus;
  }

  return styles.pendingStatus;
}

function BookingCard({ booking, onPress }) {
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={`Open booking ${booking.id}`}
      onPress={onPress}
      style={({ pressed }) => [
        styles.bookingCard,
        pressed && styles.bookingCardPressed,
      ]}
    >
      <View style={styles.cardHeader}>
        <Text style={styles.bookingId}>#{booking.id}</Text>

        <View
          style={[
            styles.statusBadge,
            getStatusStyle(booking.status),
          ]}
        >
          <Text style={styles.statusText}>{booking.status}</Text>
        </View>
      </View>

      <View style={styles.bookingInfo}>
        <View style={styles.infoColumn}>
          <Text style={styles.infoLabel}>DATE</Text>
          <Text style={styles.infoValue}>{booking.date}</Text>
        </View>

        <View style={styles.infoColumn}>
          <Text style={styles.infoLabel}>TIME</Text>
          <Text style={styles.infoValue}>{booking.time}</Text>
        </View>
      </View>

      {booking.rating ? (
        <View style={styles.ratingRow}>
          <Text style={styles.ratingLabel}>Customer rating</Text>

          <Text style={styles.ratingStars}>
            {'★'.repeat(booking.rating)}
            {'☆'.repeat(5 - booking.rating)}
          </Text>
        </View>
      ) : null}

      <View style={styles.cardFooter}>
        <Text style={styles.viewDetails}>View details</Text>
        <Text style={styles.arrow}>›</Text>
      </View>
    </Pressable>
  );
}

export default function BookedSlotsScreen({
  phoneNumber,
  onSignOut,
}) {
  const [selectedBooking, setSelectedBooking] = useState(null);

  // Show booking details when a booking is selected.
  if (selectedBooking) {
    return (
      <BookingDetailsScreen
        booking={selectedBooking}
        onBack={() => setSelectedBooking(null)}
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
        <View style={styles.header}>
          <View style={styles.headerText}>
            <Text style={styles.eyebrow}>OHBABU · PROVIDER</Text>

            <Text style={styles.title}>All Booked Slots</Text>

            <Text style={styles.subtitle}>
              Review your bookings and their current status.
            </Text>
          </View>

          <Pressable
            accessibilityRole="button"
            onPress={onSignOut}
            style={({ pressed }) => [
              styles.signOutButton,
              pressed && styles.buttonPressed,
            ]}
          >
            <Text style={styles.signOutText}>Sign out</Text>
          </Pressable>
        </View>

        <View style={styles.demoNotice}>
          <Text style={styles.demoTitle}>UI preview</Text>

          <Text style={styles.demoText}>
            These are sample bookings. Live API data is not connected yet.
          </Text>
        </View>

        <View style={styles.summaryCard}>
          <View style={styles.summaryIcon}>
            <Text style={styles.summaryIconText}>B</Text>
          </View>

          <View>
            <Text style={styles.summaryLabel}>Bookings displayed</Text>
            <Text style={styles.summaryCount}>{BOOKINGS.length}</Text>
          </View>
        </View>

        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>Recent bookings</Text>

          <Text style={styles.sectionCount}>
            {BOOKINGS.length} items
          </Text>
        </View>

        {BOOKINGS.map((booking) => (
          <BookingCard
            key={booking.id}
            booking={booking}
            onPress={() => setSelectedBooking(booking)}
          />
        ))}

        {phoneNumber ? (
          <Text style={styles.accountText}>
            Signed in as {phoneNumber}
          </Text>
        ) : null}
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
    flexGrow: 1,
    paddingHorizontal: 20,
    paddingTop: 24,
    paddingBottom: 28,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
    marginBottom: 22,
  },
  headerText: {
    flex: 1,
    paddingRight: 10,
  },
  eyebrow: {
    color: COLORS.primary,
    fontSize: 11,
    fontWeight: '800',
    letterSpacing: 1.4,
    marginBottom: 9,
  },
  title: {
    color: COLORS.navy,
    fontSize: 25,
    fontWeight: '800',
    marginBottom: 7,
  },
  subtitle: {
    color: COLORS.text,
    fontSize: 13,
    lineHeight: 19,
  },
  signOutButton: {
    paddingVertical: 9,
    paddingHorizontal: 12,
    backgroundColor: COLORS.white,
    borderColor: COLORS.border,
    borderWidth: 1,
    borderRadius: 10,
  },
  signOutText: {
    color: COLORS.navy,
    fontSize: 12,
    fontWeight: '700',
  },
  demoNotice: {
    backgroundColor: '#EAF0FF',
    borderRadius: 12,
    padding: 14,
    marginBottom: 18,
  },
  demoTitle: {
    color: COLORS.primary,
    fontSize: 13,
    fontWeight: '800',
    marginBottom: 4,
  },
  demoText: {
    color: COLORS.navy,
    fontSize: 12,
    lineHeight: 18,
  },
  summaryCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.navy,
    borderRadius: 16,
    padding: 18,
    marginBottom: 26,
  },
  summaryIcon: {
    width: 44,
    height: 44,
    borderRadius: 13,
    backgroundColor: '#365477',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 14,
  },
  summaryIconText: {
    color: COLORS.white,
    fontSize: 19,
    fontWeight: '800',
  },
  summaryLabel: {
    color: '#D5E0F0',
    fontSize: 12,
    marginBottom: 4,
  },
  summaryCount: {
    color: COLORS.white,
    fontSize: 25,
    fontWeight: '800',
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 12,
  },
  sectionTitle: {
    color: COLORS.navy,
    fontSize: 17,
    fontWeight: '800',
  },
  sectionCount: {
    color: COLORS.text,
    fontSize: 12,
  },
  bookingCard: {
    backgroundColor: COLORS.white,
    borderRadius: 15,
    borderWidth: 1,
    borderColor: COLORS.border,
    padding: 16,
    marginBottom: 12,
  },
  bookingCardPressed: {
    opacity: 0.82,
  },
  cardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 17,
  },
  bookingId: {
    color: COLORS.navy,
    fontSize: 17,
    fontWeight: '800',
  },
  statusBadge: {
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 20,
  },
  pendingStatus: {
    backgroundColor: COLORS.paleOrange,
  },
  confirmedStatus: {
    backgroundColor: COLORS.paleGreen,
  },
  closedStatus: {
    backgroundColor: COLORS.paleGrey,
  },
  statusText: {
    color: COLORS.navy,
    fontSize: 11,
    fontWeight: '700',
  },
  bookingInfo: {
    flexDirection: 'row',
    marginBottom: 14,
  },
  infoColumn: {
    flex: 1,
  },
  infoLabel: {
    color: COLORS.text,
    fontSize: 10,
    fontWeight: '700',
    letterSpacing: 0.8,
    marginBottom: 6,
  },
  infoValue: {
    color: COLORS.navy,
    fontSize: 13,
    fontWeight: '600',
  },
  ratingRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    borderTopWidth: 1,
    borderTopColor: COLORS.border,
    paddingTop: 11,
    marginBottom: 12,
  },
  ratingLabel: {
    color: COLORS.text,
    fontSize: 12,
  },
  ratingStars: {
    color: '#E6A52E',
    fontSize: 17,
    letterSpacing: 1,
  },
  cardFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    borderTopWidth: 1,
    borderTopColor: COLORS.border,
    paddingTop: 11,
  },
  viewDetails: {
    color: COLORS.primary,
    fontSize: 12,
    fontWeight: '700',
  },
  arrow: {
    color: COLORS.primary,
    fontSize: 23,
    lineHeight: 24,
  },
  accountText: {
    color: COLORS.text,
    fontSize: 11,
    textAlign: 'center',
    marginTop: 18,
  },
  buttonPressed: {
    opacity: 0.75,
  },
});
