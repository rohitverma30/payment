const express = require('express');
const Razorpay = require('razorpay');
const crypto = require('crypto');
const cors = require('cors');

const app = express();
app.use(cors());
app.use(express.json());

// Use your Razorpay dashboard keys here exactly
const key_id = "rzp_test_ZbZidO7p76BUBV";
const key_secret = "OpGf4moFKr61tLp0NhEsdbGN";

const razorpayInstance = new Razorpay({
  key_id,
  key_secret,
});

app.post('/create-order', async (req, res) => {
  const { amount, currency, receipt } = req.body;

  try {
    if (!amount || amount <= 0) {
      return res.status(400).json({ error: "Invalid amount" });
    }

    const options = {
      amount: amount * 100, // paise
      currency: currency || 'INR',
      receipt: receipt || `receipt_order_${Date.now()}`,
      payment_capture: 1, // auto capture payment after successful authorization
    };

    const order = await razorpayInstance.orders.create(options);
    console.log("Order created:", order);
    res.json(order);
  } catch (err) {
    console.error('Order creation error:', err);
    res.status(500).json({ error: 'Error creating Razorpay order' });
  }
});

app.post('/verify-signature', (req, res) => {
  const { razorpay_order_id, razorpay_payment_id, razorpay_signature } = req.body;

  if (!razorpay_order_id || !razorpay_payment_id || !razorpay_signature) {
    return res.status(400).json({ success: false, message: "Missing required parameters" });
  }

  const generated_signature = crypto
    .createHmac('sha256', key_secret)
    .update(razorpay_order_id + "|" + razorpay_payment_id)
    .digest('hex');

  console.log("Generated signature:", generated_signature);
  console.log("Received signature:", razorpay_signature);

  if (generated_signature === razorpay_signature) {
    return res.json({ success: true, message: "Payment verified successfully" });
  } else {
    return res.status(400).json({ success: false, message: "Invalid signature" });
  }
});

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
});
