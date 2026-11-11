const { env } = require('../config/env');
const { ApiError } = require('../middlewares/errorHandler');

const API_URL = 'https://api.flutterwave.com/v3';

function requireSecretKey() {
  if (!env.flutterwaveSecretKey) {
    throw new ApiError(503, 'Flutterwave payments are not configured.');
  }
}

async function request(path, { method = 'GET', body } = {}) {
  requireSecretKey();

  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 10_000);
  let response;
  try {
    response = await fetch(`${API_URL}${path}`, {
      method,
      headers: {
        Authorization: `Bearer ${env.flutterwaveSecretKey}`,
        'Content-Type': 'application/json',
      },
      ...(body ? { body: JSON.stringify(body) } : {}),
      signal: controller.signal,
    });
  } catch (error) {
    throw new ApiError(502, `Unable to reach Flutterwave: ${error.message}`);
  } finally {
    clearTimeout(timeout);
  }

  let result;
  try {
    result = await response.json();
  } catch {
    throw new ApiError(502, 'Flutterwave returned an invalid response.');
  }
  if (!response.ok || result.status !== 'success') {
    throw new ApiError(
      502,
      result.message || 'Flutterwave could not complete the request.'
    );
  }
  return result.data;
}

function createCheckout(payload) {
  return request('/payments', { method: 'POST', body: payload });
}

function verifyTransaction(transactionId) {
  return request(`/transactions/${encodeURIComponent(transactionId)}/verify`);
}

function listSubscriptions({ email, planId, transactionId, status = 'active' }) {
  const query = new URLSearchParams({ page: '1' });
  if (email) query.set('email', email);
  if (planId) query.set('plan', String(planId));
  if (transactionId) query.set('transaction_id', String(transactionId));
  if (status) query.set('status', status);
  return request(`/subscriptions?${query.toString()}`);
}

function cancelSubscription(subscriptionId) {
  return request(`/subscriptions/${encodeURIComponent(subscriptionId)}/cancel`, {
    method: 'PUT',
  });
}

module.exports = {
  createCheckout,
  verifyTransaction,
  listSubscriptions,
  cancelSubscription,
};
