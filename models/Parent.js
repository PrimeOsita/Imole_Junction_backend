const mongoose = require('mongoose');

const parentSchema = new mongoose.Schema(
  {
    name: { 
      type: String, 
      required: true 
    },
    email: { 
      type: String, 
      unique: true, 
      sparse: true, 
      lowercase: true, 
      trim: true 
    },
    phone: { 
      type: String, 
      sparse: true 
    },
    passwordHash: { 
      type: String, 
      required: true 
    },
    emailOtp: {
    type: String,
    default: null
},

emailOtpExpire: {
    type: Date,
    default: null
},

isEmailVerified: {
    type: Boolean,
    default: false
},
    subscription: {
    plan: {
      type: String,
      enum: ['freemium', 'premium'],
      default: 'freemium',
    },
    status: {
      type: String,
      enum: ['inactive', 'active', 'cancelled'],
      default: 'inactive',
    },
    provider: {
      type: String,
      enum: ['flutterwave'],
    },
    billingInterval: {
      type: String,
      enum: ['monthly', 'yearly'],
    },
    providerCustomerEmail: String,
    providerPlanId: Number,
    providerSubscriptionId: Number,
    currentPeriodEndsAt: Date,
    cancelledAt: Date,
    lastProcessedTransactionId: String,
}
  },
  { timestamps: true }
);

module.exports = mongoose.model('Parent', parentSchema);