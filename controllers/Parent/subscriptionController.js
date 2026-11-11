const subscriptionService = require('../../services/subscriptionService');

exports.getStatus = async (req, res, next) => {
  try {
    const status = await subscriptionService.getSubscriptionStatusForParent(
      req.parentId
    );
    res.json({ success: true, subscription: status });
  } catch (error) {
    next(error);
  }
};

exports.createCheckout = async (req, res, next) => {
  try {
    const checkout = await subscriptionService.startPremiumCheckout(
      req.parentId,
      req.body?.billingInterval
    );
    res.status(201).json({ success: true, ...checkout });
  } catch (error) {
    next(error);
  }
};

exports.verifyPayment = async (req, res, next) => {
  try {
    const result = await subscriptionService.verifyPremiumPayment(
      req.parentId,
      req.body.txRef,
      req.body.transactionId
    );
    res.json({ success: true, ...result });
  } catch (error) {
    next(error);
  }
};

exports.cancel = async (req, res, next) => {
  try {
    const subscription = await subscriptionService.cancelPremiumSubscription(
      req.parentId
    );
    res.json({ success: true, subscription });
  } catch (error) {
    next(error);
  }
};

exports.webhook = async (req, res, next) => {
  try {
    if (
      !subscriptionService.verifyWebhookSignature(req.get('verif-hash'))
    ) {
      return res
        .status(401)
        .json({ success: false, message: 'Invalid webhook signature.' });
    }

    await subscriptionService.handleWebhook(req.body?.event, req.body?.data);
    res.status(200).json({ success: true });
  } catch (error) {
    next(error);
  }
};
