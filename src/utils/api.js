/**
 * Centralised API service for OhBaBu Provider App.
 *
 * Base URL : https://ohbabu.com/ohbabu
 * Auth     : Bearer token stored in AsyncStorage under key "token"
 *
 * All methods throw on network failure and return parsed JSON on success.
 * A 401 response is surfaced as an Error with message "Unauthorized".
 */

import AsyncStorage from '@react-native-async-storage/async-storage';

const BASE_URL = 'https://ohbabu.com/ohbabu/ohbabu';

// ─── Helpers ──────────────────────────────────────────────────────────────────

async function getToken() {
  return AsyncStorage.getItem('token');
}

async function authHeaders(extra = {}) {
  const token = await getToken();
  return {
    'Content-Type': 'application/json',
    Accept: 'application/json',
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
    ...extra,
  };
}

async function request(method, path, body) {
  const headers = await authHeaders();
  const options = { method, headers };
  if (body !== undefined) {
    options.body = JSON.stringify(body);
  }

  const response = await fetch(`${BASE_URL}${path}`, options);

  if (response.status === 401) {
    throw new Error('Unauthorized');
  }

  if (!response.ok) {
    const text = await response.text();
    throw new Error(text || `HTTP ${response.status}`);
  }

  // Some endpoints return plain text (status strings, deleted IDs, etc.)
  const contentType = response.headers.get('content-type') || '';
  if (contentType.includes('application/json')) {
    return response.json();
  }
  return response.text();
}

// ─── Firebase / Auth ──────────────────────────────────────────────────────────

/**
 * Exchange a Firebase ID token for OhBaBu access + refresh tokens.
 * POST /ohbabu/user/fcb
 * @param {string} idToken
 * @returns {{ accessToken: string, refreshToken: string }}
 */
export async function exchangeFirebaseToken(idToken) {
  const response = await fetch(`${BASE_URL}/user/fcb`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ idToken }),
  });
  if (!response.ok) {
    const text = await response.text();
    throw new Error(`Backend authentication failed: ${response.status} – ${text}`);
  }
  return response.json();
}

// ─── User Preferences ─────────────────────────────────────────────────────────

/**
 * Fetch provider/agent preferences (agencyId, language, theme, name, etc.)
 * GET /ohbabu/user/agencypreferences/{username}
 * @param {string} username
 */
export async function fetchUserPreferences(username) {
  return request('GET', `/user/agencypreferences/${encodeURIComponent(username)}`);
}

// ─── Orders (Provider booked slots) ───────────────────────────────────────────

/**
 * Get all orders assigned to this agent/provider.
 * GET /ohbabu/orders/agent/{agentId}
 * @param {string} agentId  — the provider's username / phone
 */
export async function fetchOrdersByAgent(agentId) {
  return request('GET', `/orders/agent/${encodeURIComponent(agentId)}`);
}

/**
 * Get a single order by its ID.
 * GET /ohbabu/orders/{id}
 * @param {number|string} orderId
 */
export async function fetchOrderById(orderId) {
  return request('GET', `/orders/${orderId}`);
}

/**
 * Accept an order.
 * PATCH /ohbabu/orders/{orderId}/accept
 * @param {number|string} orderId
 */
export async function acceptOrder(orderId) {
  return request('PATCH', `/orders/${orderId}/accept`);
}

/**
 * Change the status of an order (e.g. "Cancelled").
 * PATCH /ohbabu/orders/status/{id}
 * Body: plain JSON string like "Cancelled"
 * @param {number|string} orderId
 * @param {string}        status   — must be one of the OrdersDTO status enum values
 */
export async function changeOrderStatus(orderId, status) {
  const headers = await authHeaders();
  // The body is a raw JSON string value, not an object.
  const response = await fetch(`${BASE_URL}/orders/status/${orderId}`, {
    method: 'PATCH',
    headers,
    body: JSON.stringify(status),
  });
  if (response.status === 401) throw new Error('Unauthorized');
  if (!response.ok) {
    const text = await response.text();
    throw new Error(text || `HTTP ${response.status}`);
  }
  return response.text();
}

// ─── Provider Slots ────────────────────────────────────────────────────────────

/**
 * Get all slots for a provider.
 * GET /provider-slots/provider/{providerId}
 * @param {number|string} providerId
 */
export async function fetchSlotsByProvider(providerId) {
  return request('GET', `/provider-slots/provider/${providerId}`);
}

/**
 * Create a new availability slot for a provider.
 * POST /provider-slots/provider/{providerId}
 *
 * Body shape (ProviderSlot):
 *   slotDate        : "YYYY-MM-DD"
 *   startTime       : "YYYY-MM-DDTHH:mm:ss"
 *   endTime         : "YYYY-MM-DDTHH:mm:ss"
 *   slotDurationMins: number  (default 15)
 *   status          : "AVAILABLE"
 *   remarks         : string | null
 *
 * @param {number|string} providerId
 * @param {object}        slotData
 */
export async function createProviderSlot(providerId, slotData) {
  return request('POST', `/provider-slots/provider/${providerId}`, slotData);
}

/**
 * Update an existing provider slot.
 * PUT /provider-slots/provider/{providerId}/{slotId}
 * @param {number|string} providerId
 * @param {number|string} slotId
 * @param {object}        slotData
 */
export async function updateProviderSlot(providerId, slotId, slotData) {
  return request('PUT', `/provider-slots/provider/${providerId}/${slotId}`, slotData);
}

/**
 * Delete a provider slot.
 * DELETE /provider-slots/provider/{providerId}/{slotId}
 * @param {number|string} providerId
 * @param {number|string} slotId
 */
export async function deleteProviderSlot(providerId, slotId) {
  return request('DELETE', `/provider-slots/provider/${providerId}/${slotId}`);
}

// ─── Feedback ─────────────────────────────────────────────────────────────────

/**
 * Submit feedback for a completed order.
 * POST /ohbabu/feedback
 *
 * Body shape (FeedbackDTO):
 *   userid  : string   — provider's username
 *   orderid : number
 *   details : string
 *   rating  : number   (1–5)
 *
 * @param {object} feedbackData
 */
export async function submitFeedback(feedbackData) {
  return request('POST', '/feedback', feedbackData);
}

