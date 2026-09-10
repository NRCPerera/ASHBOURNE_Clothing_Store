const crypto = require('crypto');
const { PAYHERE_MERCHANT_ID, PAYHERE_MERCHANT_SECRET, PAYHERE_SANDBOX } = require('../config/env');

/**
 * PayHere sandbox vs live URLs.
 */
const PAYHERE_CHECKOUT_URL = PAYHERE_SANDBOX
  ? 'https://sandbox.payhere.lk/pay/checkout'
  : 'https://www.payhere.lk/pay/checkout';

/**
 * Generate the MD5 hash PayHere expects in the checkout form.
 *
 * hash = strtoupper(
 *   md5(
 *     merchant_id +
 *     order_id +
 *     amount (formatted to 2 decimals) +
 *     currency +
 *     strtoupper(md5(merchant_secret))
 *   )
 * )
 */
function generateCheckoutHash(orderId, amount, currency = 'LKR') {
  const merchantSecretHash = crypto
    .createHash('md5')
    .update(PAYHERE_MERCHANT_SECRET)
    .digest('hex')
    .toUpperCase();

  const formattedAmount = Number(amount).toFixed(2);

  const raw = PAYHERE_MERCHANT_ID + orderId + formattedAmount + currency + merchantSecretHash;

  return crypto
    .createHash('md5')
    .update(raw)
    .digest('hex')
    .toUpperCase();
}

/**
 * Verify the MD5 signature PayHere sends in the /notify webhook.
 *
 * md5sig = strtoupper(
 *   md5(
 *     merchant_id +
 *     order_id +
 *     payhere_amount +
 *     payhere_currency +
 *     status_code +
 *     strtoupper(md5(merchant_secret))
 *   )
 * )
 */
function verifyNotifyHash(payload) {
  const {
    merchant_id,
    order_id,
    payhere_amount,
    payhere_currency,
    status_code,
    md5sig,
  } = payload;

  const merchantSecretHash = crypto
    .createHash('md5')
    .update(PAYHERE_MERCHANT_SECRET)
    .digest('hex')
    .toUpperCase();

  const localSig = crypto
    .createHash('md5')
    .update(
      merchant_id +
        order_id +
        payhere_amount +
        payhere_currency +
        status_code +
        merchantSecretHash
    )
    .digest('hex')
    .toUpperCase();

  return localSig === md5sig;
}

/**
 * PayHere status codes:
 *  2  = success
 *  0  = pending
 * -1  = canceled
 * -2  = failed
 * -3  = chargedback
 */
const PAYHERE_STATUS = {
  SUCCESS: '2',
  PENDING: '0',
  CANCELED: '-1',
  FAILED: '-2',
  CHARGEDBACK: '-3',
};

module.exports = {
  PAYHERE_CHECKOUT_URL,
  PAYHERE_MERCHANT_ID,
  generateCheckoutHash,
  verifyNotifyHash,
  PAYHERE_STATUS,
};
