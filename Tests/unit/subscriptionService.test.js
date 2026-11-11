jest.mock('../../models/Parent', () => ({
  findById: jest.fn(),
  findOne: jest.fn(),
  updateOne: jest.fn(),
}));
jest.mock('../../models/SubscriptionPayment', () => ({
  create: jest.fn(),
  findOne: jest.fn(),
  findById: jest.fn(),
  findByIdAndUpdate: jest.fn(),
  findOneAndUpdate: jest.fn(),
  updateOne: jest.fn(),
}));
jest.mock('../../services/flutterwaveService', () => ({
  createCheckout: jest.fn(),
  verifyTransaction: jest.fn(),
  listSubscriptions: jest.fn(),
  cancelSubscription: jest.fn(),
}));
jest.mock('../../config/env', () => ({
  env: {
    flutterwaveSecretKey: 'secret-key',
    flutterwaveWebhookSecretHash: 'webhook-secret',
    flutterwavePremiumPlanId: 123,
    flutterwavePremiumAmount: 1000,
    flutterwavePremiumInterval: 'monthly',
    flutterwavePremiumMonthlyPlanId: 123,
    flutterwavePremiumMonthlyAmount: 1000,
    flutterwavePremiumYearlyPlanId: 456,
    flutterwavePremiumYearlyAmount: 10000,
    flutterwaveRedirectUrl: 'https://app.example/checkout',
  },
}));

const { env } = require('../../config/env');
const Parent = require('../../models/Parent');
const SubscriptionPayment = require('../../models/SubscriptionPayment');
const flutterwave = require('../../services/flutterwaveService');
const {
  addBillingPeriod,
  getSubscriptionStatus,
  startPremiumCheckout,
  verifyPremiumPayment,
  verifyWebhookSignature,
  cancelPremiumSubscription,
  handleWebhook,
} = require('../../services/subscriptionService');

describe('subscriptionService', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    env.flutterwaveRedirectUrl = 'https://app.example/checkout';
  });

  test('adds a monthly billing period without overflowing month ends', () => {
    expect(
      addBillingPeriod(new Date('2024-01-31T12:00:00.000Z'), 'monthly')
    ).toEqual(new Date('2024-02-29T12:00:00.000Z'));
  });

  test('does not report expired Premium as active', () => {
    expect(
      getSubscriptionStatus({
        subscription: {
          plan: 'premium',
          status: 'active',
          currentPeriodEndsAt: new Date('2020-01-01T00:00:00.000Z'),
        },
      })
    ).toMatchObject({
      plan: 'freemium',
      status: 'inactive',
      isPremium: false,
      autoRenew: false,
    });
  });

  test('starts a checkout using the configured card-only payment plan', async () => {
    SubscriptionPayment.create.mockResolvedValue({ _id: 'payment-id' });
    Parent.findById.mockResolvedValue({
      _id: 'parent-id',
      name: 'Parent',
      email: 'parent@example.com',
    });
    flutterwave.createCheckout.mockResolvedValue({
      link: 'https://checkout.flutterwave.com/pay/abc',
    });

    await expect(startPremiumCheckout('parent-id')).resolves.toMatchObject({
      checkoutUrl: 'https://checkout.flutterwave.com/pay/abc',
      amount: 1000,
      currency: 'NGN',
      billingInterval: 'monthly',
    });
    expect(flutterwave.createCheckout).toHaveBeenCalledWith(
      expect.objectContaining({
        amount: 1000,
        currency: 'NGN',
        payment_options: 'card',
        payment_plan: 123,
        customer: { email: 'parent@example.com', name: 'Parent' },
      })
    );
    expect(SubscriptionPayment.create).toHaveBeenCalledWith(
      expect.objectContaining({ billingInterval: 'monthly' })
    );
  });

  test('starts a yearly checkout using the configured yearly plan', async () => {
    SubscriptionPayment.create.mockResolvedValue({ _id: 'payment-id' });
    Parent.findById.mockResolvedValue({
      _id: 'parent-id',
      name: 'Parent',
      email: 'parent@example.com',
    });
    flutterwave.createCheckout.mockResolvedValue({
      link: 'https://checkout.flutterwave.com/pay/yearly',
    });

    await expect(
      startPremiumCheckout('parent-id', 'yearly')
    ).resolves.toMatchObject({
      checkoutUrl: 'https://checkout.flutterwave.com/pay/yearly',
      amount: 10000,
      currency: 'NGN',
      billingInterval: 'yearly',
    });
    expect(flutterwave.createCheckout).toHaveBeenCalledWith(
      expect.objectContaining({
        amount: 10000,
        payment_plan: 456,
      })
    );
    expect(SubscriptionPayment.create).toHaveBeenCalledWith(
      expect.objectContaining({ billingInterval: 'yearly', amount: 10000 })
    );
  });

  test('activates Premium only after Flutterwave verifies the payment', async () => {
    const parent = {
      _id: 'parent-id',
      email: 'parent@example.com',
      save: jest.fn().mockResolvedValue(undefined),
      subscription: { plan: 'freemium', status: 'inactive' },
    };
    const payment = {
      _id: 'payment-id',
      parentId: 'parent-id',
      txRef: 'IMOLE-PREMIUM-test',
      amount: 1000,
      status: 'pending',
    };
    SubscriptionPayment.findOne.mockResolvedValueOnce(payment).mockResolvedValueOnce(null);
    SubscriptionPayment.findOneAndUpdate.mockResolvedValue(payment);
    SubscriptionPayment.findById.mockResolvedValue({
      ...payment,
      status: 'successful',
    });
    Parent.findById.mockResolvedValue(parent);
    flutterwave.verifyTransaction.mockResolvedValue({
      id: 456,
      tx_ref: payment.txRef,
      amount: 1000,
      currency: 'NGN',
      status: 'successful',
      payment_plan: 123,
      customer: { email: 'payer@example.com' },
      created_at: new Date().toISOString(),
    });

    const result = await verifyPremiumPayment('parent-id', payment.txRef, '456');

    expect(parent.save).toHaveBeenCalled();
    expect(parent.subscription.plan).toBe('premium');
    expect(parent.subscription.status).toBe('active');
    expect(result.subscription.isPremium).toBe(true);
    expect(SubscriptionPayment.updateOne).toHaveBeenCalledWith(
      { _id: 'payment-id' },
      expect.objectContaining({
        $set: expect.objectContaining({
          status: 'successful',
          gatewayTransactionId: '456',
        }),
      })
    );
  });

  test('rejects webhook requests without the configured signature', () => {
    expect(verifyWebhookSignature('wrong-signature')).toBe(false);
    expect(verifyWebhookSignature('webhook-secret')).toBe(true);
  });

  test('cancels Flutterwave renewal but keeps access until the paid period ends', async () => {
    env.flutterwaveRedirectUrl = undefined;
    const parent = {
      _id: 'parent-id',
      email: 'parent@example.com',
      save: jest.fn().mockResolvedValue(undefined),
      subscription: {
        plan: 'premium',
        status: 'active',
        provider: 'flutterwave',
        providerPlanId: 123,
        currentPeriodEndsAt: new Date(Date.now() + 86_400_000),
      },
    };
    Parent.findById.mockResolvedValue(parent);
    SubscriptionPayment.findOne.mockResolvedValue({
      parentId: 'parent-id',
      txRef: 'IMOLE-PREMIUM-test',
      gatewayTransactionId: '456',
      amount: 1000,
      status: 'successful',
    });
    flutterwave.verifyTransaction.mockResolvedValue({
      id: 456,
      tx_ref: 'IMOLE-PREMIUM-test',
      amount: 1000,
      currency: 'NGN',
      status: 'successful',
      payment_plan: 123,
      customer: { email: 'payer@example.com' },
    });
    flutterwave.listSubscriptions.mockResolvedValue([
      {
        id: 987,
        plan: 123,
        status: 'Active',
        customer: { customer_email: 'payer@example.com' },
      },
    ]);
    flutterwave.cancelSubscription.mockResolvedValue({ status: 'cancelled' });

    await expect(cancelPremiumSubscription('parent-id')).resolves.toMatchObject({
      plan: 'premium',
      status: 'cancelled',
      isPremium: true,
      autoRenew: false,
    });
    expect(flutterwave.cancelSubscription).toHaveBeenCalledWith(987);
    expect(flutterwave.listSubscriptions).toHaveBeenCalledWith({
      email: 'payer@example.com',
      planId: 123,
      status: null,
    });
    expect(parent.save).toHaveBeenCalled();
    expect(parent.subscription.providerCustomerEmail).toBe('payer@example.com');
  });

  test('matches recurring charges to the Flutterwave subscription by transaction ID', async () => {
    const parent = {
      _id: 'parent-id',
      email: 'parent@example.com',
      save: jest.fn().mockResolvedValue(undefined),
      subscription: {
        plan: 'premium',
        status: 'active',
        provider: 'flutterwave',
        providerPlanId: 123,
      },
    };
    const payment = {
      _id: 'renewal-payment',
      parentId: 'parent-id',
      txRef: 'FLW-RENEWAL-1',
      amount: 1000,
      kind: 'renewal',
      status: 'pending',
    };
    Parent.findOne.mockResolvedValue(parent);
    Parent.findById.mockResolvedValue(parent);
    SubscriptionPayment.findOne
      .mockResolvedValueOnce(null)
      .mockResolvedValueOnce(null);
    SubscriptionPayment.findOneAndUpdate
      .mockResolvedValueOnce(payment)
      .mockResolvedValueOnce(payment);
    SubscriptionPayment.findById.mockResolvedValue({
      ...payment,
      status: 'successful',
    });
    flutterwave.verifyTransaction.mockResolvedValue({
      id: 789,
      tx_ref: payment.txRef,
      amount: 1000,
      currency: 'NGN',
      status: 'successful',
      customer: { email: 'parent@example.com' },
      created_at: new Date().toISOString(),
    });
    flutterwave.listSubscriptions.mockResolvedValue([
      {
        id: 987,
        plan: 123,
        status: 'active',
        customer: { customer_email: 'parent@example.com' },
      },
    ]);

    await handleWebhook('charge.completed', {
      id: 789,
      tx_ref: payment.txRef,
      status: 'successful',
    });

    expect(flutterwave.listSubscriptions).toHaveBeenCalledWith({
      transactionId: '789',
      status: null,
    });
    expect(parent.subscription.plan).toBe('premium');
    expect(parent.save).toHaveBeenCalled();
  });
});
