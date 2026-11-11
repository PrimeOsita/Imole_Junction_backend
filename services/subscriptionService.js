 const crypto = require('crypto');
const Parent = require('../models/Parent');
const SubscriptionPayment = require('../models/SubscriptionPayment');
const { env } = require('../config/env');
const { ApiError } = require('../middlewares/errorHandler');
const flutterwave = require('./flutterwaveService');

const normalizedEmail = (email) => email?.trim().toLowerCase();

function getPlanConfig(interval = 'monthly') {
  const planId = interval === 'monthly'
    ? env.flutterwavePremiumMonthlyPlanId ??
      (env.flutterwavePremiumInterval === 'monthly' ? env.flutterwavePremiumPlanId : undefined)
    : env.flutterwavePremiumYearlyPlanId ??
      (env.flutterwavePremiumInterval === 'yearly' ? env.flutterwavePremiumPlanId : undefined);
  const amount = interval === 'monthly'
    ? env.flutterwavePremiumMonthlyAmount ??
      (env.flutterwavePremiumInterval === 'monthly' ? env.flutterwavePremiumAmount : undefined)
    : env.flutterwavePremiumYearlyAmount ??
      (env.flutterwavePremiumInterval === 'yearly' ? env.flutterwavePremiumAmount : undefined);

  if (
    !['monthly', 'yearly'].includes(interval) ||
    !Number.isInteger(planId) ||
    planId <= 0 ||
    !Number.isFinite(amount) ||
    amount <= 0 ||
    Math.round(amount * 100) !== amount * 100 ||
    !['monthly', 'yearly'].includes(interval)
  ) {
    throw new ApiError(503, 'Premium subscription settings are incomplete.');
  }

  return { planId, amount, interval };
}

function getConfiguredPlans() {
  return ['monthly', 'yearly'].flatMap((interval) => {
    try {
      return [getPlanConfig(interval)];
    } catch {
      return [];
    }
  });
}

function getPlanConfigById(planId) {
  return getConfiguredPlans().find((plan) => plan.planId === planId);
}

function addBillingPeriod(date, interval) {
  const result = new Date(date);
  const day = result.getUTCDate();
  result.setUTCDate(1);
  result.setUTCMonth(result.getUTCMonth() + (interval === 'yearly' ? 12 : 1));
  const lastDay = new Date(
    Date.UTC(result.getUTCFullYear(), result.getUTCMonth() + 1, 0)
  ).getUTCDate();
  result.setUTCDate(Math.min(day, lastDay));
  return result;
}

function subscriptionIsPremium(subscription, now = new Date()) {
  return (
    subscription?.plan === 'premium' &&
    ['active', 'cancelled'].includes(subscription.status) &&
    subscription.currentPeriodEndsAt > now
  );
}

function getSubscriptionStatus(parent) {
  const subscription = parent.subscription || {};
  const premium = subscriptionIsPremium(subscription);
  return {
    plan: premium ? 'premium' : 'freemium',
    status: premium ? subscription.status : 'inactive',
    isPremium: premium,
    autoRenew: premium && subscription.status === 'active',
    currentPeriodEndsAt: premium
      ? subscription.currentPeriodEndsAt
      : null,
  };
}

async function getSubscriptionStatusForParent(parentId) {
  const parent = await Parent.findById(parentId);
  if (!parent) throw new ApiError(404, 'Parent account not found.');
  return getSubscriptionStatus(parent);
}

function requirePaymentConfig({ billingInterval = 'monthly', requireRedirectUrl = false } = {}) {
  const plan = getPlanConfig(billingInterval);
  if (!env.flutterwaveSecretKey) {
    throw new ApiError(503, 'Flutterwave payments are not configured.');
  }
  if (requireRedirectUrl && !env.flutterwaveRedirectUrl) {
    throw new ApiError(503, 'Premium checkout is not configured.');
  }
  return plan;
}

async function startPremiumCheckout(parentId, billingInterval = 'monthly') {
  const plan = requirePaymentConfig({ billingInterval, requireRedirectUrl: true });
  const parent = await Parent.findById(parentId);
  if (!parent) throw new ApiError(404, 'Parent account not found.');
  if (!parent.email) {
    throw new ApiError(400, 'An email address is required for Premium.');
  }

  const subscription = parent.subscription || {};
  if (subscriptionIsPremium(subscription)) {
    throw new ApiError(409, 'Your Premium subscription is already active.');
  }

  const txRef = `IMOLE-PREMIUM-${crypto.randomUUID()}`;
  const payment = await SubscriptionPayment.create({
    parentId: parent._id,
    txRef,
    kind: 'initial',
    billingInterval: plan.interval,
    amount: plan.amount,
    currency: 'NGN',
  });

  const checkout = await flutterwave.createCheckout({
    tx_ref: txRef,
    amount: plan.amount,
    currency: 'NGN',
    redirect_url: env.flutterwaveRedirectUrl,
    payment_options: 'card',
    payment_plan: plan.planId,
    customer: {
      email: normalizedEmail(parent.email),
      name: parent.name,
    },
    meta: {
      parentId: String(parent._id),
      plan: 'premium',
    },
    customizations: {
      title: 'IMOLE Premium',
      description: 'Premium subscription',
    },
  });

  if (!checkout?.link) {
    throw new ApiError(502, 'Flutterwave did not return a checkout link.');
  }

  return {
    txRef,
    checkoutUrl: checkout.link,
    amount: plan.amount,
    currency: 'NGN',
    billingInterval: plan.interval,
  };
}

function validateVerifiedPayment(data, payment, plan, transactionId) {
  if (
    data.status !== 'successful' ||
    String(data.id) !== String(transactionId) ||
    data.currency !== 'NGN' ||
    Number(data.amount) !== payment.amount ||
    String(data.tx_ref) !== payment.txRef
  ) {
    throw new ApiError(400, 'Flutterwave could not verify this payment.');
  }

  const verifiedPlanId = data.payment_plan ?? data.plan;
  if (
    verifiedPlanId !== undefined &&
    Number(verifiedPlanId) !== plan.planId
  ) {
    throw new ApiError(400, 'The payment is not for the Premium plan.');
  }

}

async function findProviderCustomerEmail(parent, plan) {
  if (parent.subscription?.providerCustomerEmail) {
    return normalizedEmail(parent.subscription.providerCustomerEmail);
  }

  const payment = await SubscriptionPayment.findOne({
    parentId: parent._id,
    kind: 'initial',
    status: 'successful',
  });
  if (!payment?.gatewayTransactionId) return normalizedEmail(parent.email);

  const verifiedData = await flutterwave.verifyTransaction(
    payment.gatewayTransactionId
  );
  validateVerifiedPayment(
    verifiedData,
    payment,
    plan,
    payment.gatewayTransactionId
  );
  return normalizedEmail(verifiedData.customer?.email) ||
    normalizedEmail(parent.email);
}

async function findProviderSubscriptionId(parent, planId, customerEmail) {
  const subscriptions = await flutterwave.listSubscriptions({
    email: customerEmail,
    planId,
    status: null,
  });
  const match = (Array.isArray(subscriptions) ? subscriptions : []).find(
    (subscription) =>
      Number(subscription.plan) === planId &&
      normalizedEmail(
        subscription.customer?.customer_email || subscription.customer?.email
      ) === customerEmail &&
      String(subscription.status).toLowerCase() === 'active'
  );
  return match?.id ? Number(match.id) : undefined;
}

async function applySuccessfulPayment(payment, parent, data, plan) {
  const transactionId = String(data.id);
  const alreadyProcessed =
    parent.subscription?.lastProcessedTransactionId === transactionId;

  if (!alreadyProcessed) {
    const now = data.created_at ? new Date(data.created_at) : new Date();
    const previousEnd = parent.subscription?.currentPeriodEndsAt;
    const periodStart =
      previousEnd && previousEnd > now ? previousEnd : now;
    const currentPeriodEndsAt = addBillingPeriod(periodStart, plan.interval);
    const wasCancelled =
      payment.kind === 'renewal' && parent.subscription?.status === 'cancelled';

    parent.subscription = {
      plan: 'premium',
      status: wasCancelled ? 'cancelled' : 'active',
      provider: 'flutterwave',
      billingInterval: plan.interval,
      providerPlanId: plan.planId,
      providerSubscriptionId: parent.subscription?.providerSubscriptionId,
      currentPeriodEndsAt,
      cancelledAt: wasCancelled ? parent.subscription.cancelledAt : undefined,
      lastProcessedTransactionId: transactionId,
    };
    await parent.save();
  }

  await SubscriptionPayment.updateOne(
    { _id: payment._id },
    {
      $set: {
        status: 'successful',
        gatewayTransactionId: transactionId,
        paidAt: data.created_at ? new Date(data.created_at) : new Date(),
      },
      $unset: { processingAt: 1 },
    }
  );
}

async function processPayment(payment, transactionId, verifiedData) {
  const plan = requirePaymentConfig({
    billingInterval: payment.billingInterval || env.flutterwavePremiumInterval || 'monthly',
  });
  const staleProcessingTime = new Date(Date.now() - 60_000);
  const claimedPayment = await SubscriptionPayment.findOneAndUpdate(
    {
      _id: payment._id,
      $or: [
        { status: 'pending' },
        { status: 'processing', processingAt: { $lt: staleProcessingTime } },
      ],
    },
    { $set: { status: 'processing', processingAt: new Date() } },
    { new: true }
  );

  if (!claimedPayment) {
    const currentPayment = await SubscriptionPayment.findById(payment._id);
    if (currentPayment?.status === 'successful') {
      return { payment: currentPayment, alreadyProcessed: true };
    }
    throw new ApiError(409, 'Premium payment verification is already in progress.');
  }

  try {
    const data =
      verifiedData || (await flutterwave.verifyTransaction(transactionId));
    const parent = await Parent.findById(claimedPayment.parentId);
    if (!parent) throw new ApiError(404, 'Parent account not found.');
    validateVerifiedPayment(
      data,
      claimedPayment,
      plan,
      transactionId
    );

    const existingTransaction = await SubscriptionPayment.findOne({
      gatewayTransactionId: String(transactionId),
      _id: { $ne: claimedPayment._id },
    });
    if (existingTransaction) {
      throw new ApiError(409, 'This payment has already been processed.');
    }

    await applySuccessfulPayment(claimedPayment, parent, data, plan);
    return {
      payment: await SubscriptionPayment.findById(claimedPayment._id),
      subscription: getSubscriptionStatus(parent),
    };
  } catch (error) {
    await SubscriptionPayment.updateOne(
      { _id: claimedPayment._id, status: 'processing' },
      {
        $set: { status: 'pending' },
        $unset: { processingAt: 1 },
      }
    );
    throw error;
  }
}

async function verifyPremiumPayment(parentId, txRef, transactionId) {
  const payment = await SubscriptionPayment.findOne({ txRef, parentId });
  if (!payment) throw new ApiError(404, 'Premium payment was not found.');
  if (payment.status === 'successful') {
    const parent = await Parent.findById(parentId);
    if (!parent) throw new ApiError(404, 'Parent account not found.');
    return {
      payment,
      subscription: getSubscriptionStatus(parent),
      alreadyProcessed: true,
    };
  }
  if (!['pending', 'processing'].includes(payment.status)) {
    throw new ApiError(409, 'This Premium payment is no longer pending.');
  }
  return processPayment(payment, transactionId);
}

async function processWebhookPayment(data) {
  const txRef = String(data.tx_ref || '');
  const transactionId = String(data.id || '');
  if (!txRef || !/^\d+$/.test(transactionId)) {
    throw new ApiError(400, 'Invalid Flutterwave payment notification.');
  }

  let payment = await SubscriptionPayment.findOne({ txRef });
  if (!payment) {
    const verifiedData = await flutterwave.verifyTransaction(transactionId);
    const subscriptionRecords = await flutterwave.listSubscriptions({
      transactionId,
      status: null,
    });
    const email = normalizedEmail(verifiedData.customer?.email);
    const matchingSubscription = (Array.isArray(subscriptionRecords) ? subscriptionRecords : [])
      .map((subscription) => ({
        subscription,
        plan: getPlanConfigById(Number(subscription.plan)),
      }))
      .find(
        ({ subscription, plan }) => plan &&
        Number(verifiedData.amount) === plan.amount &&
        (verifiedData.payment_plan === undefined || Number(verifiedData.payment_plan) === plan.planId) &&
        Number(subscription.plan) === plan.planId &&
        normalizedEmail(
          subscription.customer?.customer_email ||
            subscription.customer?.email
        ) === email
      );
    const plan = matchingSubscription?.plan;
    if (
      !plan ||
      verifiedData.status !== 'successful' ||
      verifiedData.currency !== 'NGN'
    ) {
      throw new ApiError(400, 'The recurring charge could not be verified.');
    }
    if (!matchingSubscription.subscription) {
      throw new ApiError(400, 'The recurring charge is not linked to the Premium plan.');
    }

    const parent = email ? await Parent.findOne({ email }) : null;
    if (
      !parent ||
      parent.subscription?.provider !== 'flutterwave' ||
      Number(parent.subscription.providerPlanId) !== plan.planId
    ) {
      throw new ApiError(404, 'The Premium subscriber was not found.');
    }
    if (
      String(verifiedData.tx_ref) !== txRef ||
      normalizedEmail(verifiedData.customer?.email) !== email
    ) {
      throw new ApiError(400, 'The recurring charge could not be verified.');
    }

    try {
      payment = await SubscriptionPayment.findOneAndUpdate(
        { gatewayTransactionId: transactionId },
        {
          $setOnInsert: {
            parentId: parent._id,
            txRef,
            kind: 'renewal',
            billingInterval: plan.interval,
            gatewayTransactionId: transactionId,
            amount: plan.amount,
            currency: 'NGN',
            status: 'pending',
          },
        },
        { new: true, upsert: true }
      );
    } catch (error) {
      if (error.code !== 11000) throw error;
      payment = await SubscriptionPayment.findOne({
        gatewayTransactionId: transactionId,
      });
      if (!payment) throw error;
    }
    return processPayment(payment, transactionId, verifiedData);
  }

  return processPayment(payment, transactionId);
}

function verifyWebhookSignature(signature) {
  const expected = env.flutterwaveWebhookSecretHash;
  if (!expected) {
    throw new ApiError(503, 'Flutterwave webhook verification is not configured.');
  }
  if (typeof signature !== 'string') return false;
  const receivedBuffer = Buffer.from(signature);
  const expectedBuffer = Buffer.from(expected);
  return (
    receivedBuffer.length === expectedBuffer.length &&
    crypto.timingSafeEqual(receivedBuffer, expectedBuffer)
  );
}

async function cancelPremiumSubscription(parentId) {
  const parent = await Parent.findById(parentId);
  if (!parent) throw new ApiError(404, 'Parent account not found.');
  const plan = getPlanConfigById(Number(parent.subscription?.providerPlanId));
  if (
    parent.subscription?.provider !== 'flutterwave' ||
    !plan ||
    !subscriptionIsPremium(parent.subscription)
  ) {
    throw new ApiError(409, 'There is no active Premium subscription to cancel.');
  }
  requirePaymentConfig({ billingInterval: plan.interval });

  let subscriptionId = parent.subscription.providerSubscriptionId;
  let customerEmail = normalizedEmail(
    parent.subscription.providerCustomerEmail || parent.email
  );
  if (!subscriptionId) {
    customerEmail = await findProviderCustomerEmail(parent, plan);
    subscriptionId = await findProviderSubscriptionId(
      parent,
      plan.planId,
      customerEmail
    );
  }
  if (!subscriptionId) {
    throw new ApiError(
      502,
      'Flutterwave did not return an active subscription to cancel.'
    );
  }

  await flutterwave.cancelSubscription(subscriptionId);
  parent.subscription.status = 'cancelled';
  parent.subscription.providerCustomerEmail = customerEmail;
  parent.subscription.providerSubscriptionId = subscriptionId;
  parent.subscription.cancelledAt = new Date();
  await parent.save();

  return getSubscriptionStatus(parent);
}

async function handleWebhook(event, data) {
  if (event === 'charge.completed' && data?.status === 'successful') {
    await processWebhookPayment(data);
    return;
  }

  if (event === 'charge.completed' && data?.status === 'failed') {
    const txRef = String(data.tx_ref || '');
    if (txRef) {
      await SubscriptionPayment.updateOne(
        { txRef, status: 'pending' },
        { $set: { status: 'failed' } }
      );
    }
    return;
  }

  if (event === 'subscription.cancelled') {
    const plan = getPlanConfig();
    const email = normalizedEmail(
      data?.customer?.customer_email || data?.customer?.email
    );
    if (email) {
      await Parent.updateOne(
        {
          email,
          'subscription.provider': 'flutterwave',
          'subscription.providerPlanId': plan.planId,
        },
        {
          $set: {
            'subscription.status': 'cancelled',
            'subscription.cancelledAt': new Date(),
          },
        }
      );
    }
  }
}

module.exports = {
  addBillingPeriod,
  getSubscriptionStatus,
  getSubscriptionStatusForParent,
  startPremiumCheckout,
  verifyPremiumPayment,
  verifyWebhookSignature,
  cancelPremiumSubscription,
  handleWebhook,
};
