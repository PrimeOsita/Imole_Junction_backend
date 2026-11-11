const mongoose = require('mongoose');

const subscriptionPaymentSchema = new mongoose.Schema(
  {
    parentId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Parent',
      required: true,
      index: true,
    },
    txRef: { type: String, required: true, unique: true },
    gatewayTransactionId: { type: String, unique: true, sparse: true },
    kind: {
      type: String,
      enum: ['initial', 'renewal'],
      default: 'initial',
    },
    billingInterval: {
      type: String,
      enum: ['monthly', 'yearly'],
    },
    amount: { type: Number, required: true },
    currency: { type: String, required: true, default: 'NGN' },
    status: {
      type: String,
      enum: ['pending', 'processing', 'successful', 'failed'],
      default: 'pending',
      index: true,
    },
    processingAt: Date,
    paidAt: Date,
  },
  { timestamps: true }
);

module.exports = mongoose.model('SubscriptionPayment', subscriptionPaymentSchema);
