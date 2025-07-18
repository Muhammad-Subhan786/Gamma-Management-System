const mongoose = require('mongoose');
const Order = require('../models/Order');
require('dotenv').config();

async function migrateAddressConfirmation() {
  await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/emp', {
    useNewUrlParser: true,
    useUnifiedTopology: true,
  });
  console.log('Connected to MongoDB');

  const orders = await Order.find({});
  let updated = 0;

  for (const order of orders) {
    // Only migrate if addressConfirmation is missing
    if (!order.addressConfirmation) {
      const legacy = order.addressConfirmed;
      order.addressConfirmation = {
        confirmed: !!legacy,
        confirmedBy: null,
        confirmedAt: !!legacy ? new Date() : null,
        notes: 'Migrated from legacy field'
      };
      // Remove the old field if it exists
      if (typeof order.addressConfirmed !== 'undefined') {
        order.addressConfirmed = undefined;
      }
      await order.save();
      updated++;
    }
  }
  console.log(`Migration complete. Updated ${updated} orders.`);
  await mongoose.disconnect();
}

migrateAddressConfirmation().catch(err => {
  console.error('Migration failed:', err);
  process.exit(1);
}); 