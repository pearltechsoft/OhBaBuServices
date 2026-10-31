/**
 * BookedSlotsScreen.js
 *
 * Displays all orders assigned to the logged-in provider/agent.
 *
 * API: GET /ohbabu/orders/agent/{agentId}
 *      Returns an array of OrdersDTO.
 *
 * Key OrdersDTO fields used here:
 *   id           – order ID (int)
 *   description  – service description
 *   status       – "Open" | "Assigned" | "InProgress" | "Completed" | "Closed" | "Cancelled" …
 *   orderDate    – "YYYY-MM-DD"
 *   deliverySlot – "Morning" | "AfterNoon" | … | "Immediate"
 *   userid       – customer username
 *   customerphone
 *   rating       – not on OrdersDTO; pulled from FeedbackDTO when available
 */

import React, { useCallback, useEffect, useState } from 'react';
import {
  ActivityIndicator,
  Pressable,
  RefreshControl,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { SafeAreaView } from 'react-native-safe-area-context';
import AsyncStorage from '@react-native-async-storage/async-storage';

import { fetchOrdersByAgent } from '../../src/utils/api';
import BookingDetailsScreen from './BookingDetailsScreen';

// ─── Colour tokens ─────────────────────────────────────────────────────────────
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
  red: '#D93025',
};

// ─── Helpers ──────────────────────────────────────────────────────────────────

function getStatusStyle(status) {
  const s = (status || '').toLowerCase();
  if (s === 'closed' || s === 'completed' || s === 'ratedbyagent' || s === 'ratedbyuser')
    return styles.closedStatus;
  if (s === 'assigned' || s === 'inprogress')
    return styles.confirmedStatus;
  return styles.pendingStatus;
}

function formatDate(dateStr) {
  if (!dateStr) return '—';
  try {
    const d = new Date(dateStr);
    return d.toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' });
  } catch {
    return dateStr;
  }
}

// ─── BookingCard ──────────────────────────────────────────────────────────────
function BookingCard({ order, onPress }) {
  const displayDate = formatDate(order.orderDate || order.deliveryDate);
  const displaySlot = order.deliverySlot || '—';

  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={`Open booking ${order.id}`}
      onPress={onPress}
      style={({ pressed }) => [
        styles.bookingCard,
        pressed && styles.bookingCardPressed,
      ]}
    >
      <View style={styles.cardHeader}>
        <Text style={styles.bookingId}>#{order.id}</Text>
        <View style={[styles.statusBadge, getStatusStyle(order.status)]}>
          <Text style={styles.statusText}>{order.status || 'Open'}</Text>
        </View>
      </View>

      <View style={styles.bookingInfo}>
        <View style={styles.infoColumn}>
          <Text style={styles.infoLabel}>DATE</Text>
          <Text style={styles.infoValue}>{displayDate}</Text>
        </View>
        <View style={styles.infoColumn}>
          <Text style={styles.infoLabel}>SLOT</Text>
          <Text style={styles.infoValue}>{displaySlot}</Text>
        </View>
      </View>

      {order.description ? (
        <Text style={styles.descriptionText} numberOfLines={2}>
          {order.description}
        </Text>
      ) : null}

      <View style={styles.cardFooter}>
        <Text style={styles.viewDetails}>View details</Text>
        <Text style={styles.arrow}>›</Text>
      </View>
    </Pressable>
  );
}

// ─── Screen ───────────────────────────────────────────────────────────────────
export default function BookedSlotsScreen({ navigation, onSignOut }) {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState('');
  const [selectedOrder, setSelectedOrder] = useState(null);
  const [agentId, setAgentId] = useState('');

  // Load agent ID once from storage
  useEffect(() => {
    AsyncStorage.getItem('username').then((id) => {
      if (id) setAgentId(id);
    });
  }, []);

  // Fetch orders whenever agentId is resolved
  useEffect(() => {
    if (agentId) loadOrders();
  }, [agentId]);

  const loadOrders = useCallback(async () => {
    if (!agentId) return;
    setError('');
    try {
      const data = await fetchOrdersByAgent(agentId);
      // API returns an array of OrdersDTO
      setOrders(Array.isArray(data) ? data : []);
    } catch (err) {
      console.error('[BookedSlots] fetchOrdersByAgent error:', err);
      setError(err.message || 'Failed to load bookings.');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [agentId]);

  function handleRefresh() {
    setRefreshing(true);
    loadOrders();
  }

  // ── Show booking details when a booking is selected ─────────────────────────
  if (selectedOrder) {
    return (
      <BookingDetailsScreen
        order={selectedOrder}
        onBack={() => setSelectedOrder(null)}
        onOrderUpdated={() => {
          setSelectedOrder(null);
          loadOrders();
        }}
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
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={handleRefresh} />
        }
      >
        {/* Header */}
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

        {/* Summary card */}
        {!loading && !error && (
          <View style={styles.summaryCard}>
            <View style={styles.summaryIcon}>
              <Text style={styles.summaryIconText}>B</Text>
            </View>
            <View>
              <Text style={styles.summaryLabel}>Bookings loaded</Text>
              <Text style={styles.summaryCount}>{orders.length}</Text>
            </View>
          </View>
        )}

        {/* Loading state */}
        {loading && (
          <View style={styles.centered}>
            <ActivityIndicator size="large" color={COLORS.primary} />
            <Text style={styles.loadingText}>Loading your bookings…</Text>
          </View>
        )}

        {/* Error state */}
        {!!error && !loading && (
          <View style={styles.errorCard}>
            <Text style={styles.errorTitle}>Could not load bookings</Text>
            <Text style={styles.errorMessage}>{error}</Text>
            <Pressable
              accessibilityRole="button"
              onPress={loadOrders}
              style={styles.retryButton}
            >
              <Text style={styles.retryText}>Try again</Text>
            </Pressable>
          </View>
        )}

        {/* Empty state */}
        {!loading && !error && orders.length === 0 && (
          <View style={styles.emptyCard}>
            <Text style={styles.emptyTitle}>No bookings yet</Text>
            <Text style={styles.emptyText}>
              Your assigned bookings will appear here.
            </Text>
          </View>
        )}

        {/* Booking list */}
        {!loading && !error && orders.length > 0 && (
          <>
            <View style={styles.sectionHeader}>
              <Text style={styles.sectionTitle}>Recent bookings</Text>
              <Text style={styles.sectionCount}>{orders.length} items</Text>
            </View>

            {orders.map((order) => (
              <BookingCard
                key={String(order.id)}
                order={order}
                onPress={() => setSelectedOrder(order)}
              />
            ))}
          </>
        )}

        {agentId ? (
          <Text style={styles.accountText}>Signed in as {agentId}</Text>
        ) : null}
      </ScrollView>
    </SafeAreaView>
  );
}

// ─── Styles ───────────────────────────────────────────────────────────────────
const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: COLORS.background },
  content: { flexGrow: 1, paddingHorizontal: 20, paddingTop: 24, paddingBottom: 28 },
  centered: { alignItems: 'center', paddingVertical: 40 },
  loadingText: { marginTop: 12, color: COLORS.text, fontSize: 14 },
  header: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
    marginBottom: 22,
  },
  headerText: { flex: 1, paddingRight: 10 },
  eyebrow: {
    color: COLORS.primary,
    fontSize: 11,
    fontWeight: '800',
    letterSpacing: 1.4,
    marginBottom: 9,
  },
  title: { color: COLORS.navy, fontSize: 25, fontWeight: '800', marginBottom: 7 },
  subtitle: { color: COLORS.text, fontSize: 13, lineHeight: 19 },
  signOutButton: {
    paddingVertical: 9,
    paddingHorizontal: 12,
    backgroundColor: COLORS.white,
    borderColor: COLORS.border,
    borderWidth: 1,
    borderRadius: 10,
  },
  signOutText: { color: COLORS.navy, fontSize: 12, fontWeight: '700' },
  buttonPressed: { opacity: 0.75 },
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
  summaryIconText: { color: COLORS.white, fontSize: 19, fontWeight: '800' },
  summaryLabel: { color: '#D5E0F0', fontSize: 12, marginBottom: 4 },
  summaryCount: { color: COLORS.white, fontSize: 25, fontWeight: '800' },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 12,
  },
  sectionTitle: { color: COLORS.navy, fontSize: 17, fontWeight: '800' },
  sectionCount: { color: COLORS.text, fontSize: 12 },
  bookingCard: {
    backgroundColor: COLORS.white,
    borderRadius: 15,
    borderWidth: 1,
    borderColor: COLORS.border,
    padding: 16,
    marginBottom: 12,
  },
  bookingCardPressed: { opacity: 0.82 },
  cardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 17,
  },
  bookingId: { color: COLORS.navy, fontSize: 17, fontWeight: '800' },
  statusBadge: { paddingHorizontal: 10, paddingVertical: 5, borderRadius: 20 },
  pendingStatus: { backgroundColor: COLORS.paleOrange },
  confirmedStatus: { backgroundColor: COLORS.paleGreen },
  closedStatus: { backgroundColor: COLORS.paleGrey },
  statusText: { color: COLORS.navy, fontSize: 11, fontWeight: '700' },
  bookingInfo: { flexDirection: 'row', marginBottom: 10 },
  infoColumn: { flex: 1 },
  infoLabel: {
    color: COLORS.text,
    fontSize: 10,
    fontWeight: '700',
    letterSpacing: 0.8,
    marginBottom: 6,
  },
  infoValue: { color: COLORS.navy, fontSize: 13, fontWeight: '600' },
  descriptionText: {
    color: COLORS.text,
    fontSize: 12,
    lineHeight: 17,
    marginBottom: 10,
  },
  cardFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    borderTopWidth: 1,
    borderTopColor: COLORS.border,
    paddingTop: 11,
  },
  viewDetails: { color: COLORS.primary, fontSize: 12, fontWeight: '700' },
  arrow: { color: COLORS.primary, fontSize: 23, lineHeight: 24 },
  accountText: { color: COLORS.text, fontSize: 11, textAlign: 'center', marginTop: 18 },
  errorCard: {
    backgroundColor: '#FFF3F3',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#F5C6C6',
    padding: 18,
    marginBottom: 16,
    alignItems: 'center',
  },
  errorTitle: { color: COLORS.red, fontWeight: '800', fontSize: 15, marginBottom: 6 },
  errorMessage: { color: COLORS.text, fontSize: 13, textAlign: 'center', lineHeight: 19 },
  retryButton: {
    marginTop: 14,
    paddingVertical: 9,
    paddingHorizontal: 20,
    backgroundColor: COLORS.primary,
    borderRadius: 10,
  },
  retryText: { color: COLORS.white, fontSize: 13, fontWeight: '700' },
  emptyCard: {
    alignItems: 'center',
    paddingVertical: 48,
  },
  emptyTitle: { color: COLORS.navy, fontSize: 17, fontWeight: '800', marginBottom: 8 },
  emptyText: { color: COLORS.text, fontSize: 13, textAlign: 'center' },
});
