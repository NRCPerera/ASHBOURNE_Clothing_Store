// ─── Shared constants for ASHBOURNE Clothing Store ───

export const USER_ROLES = {
  CUSTOMER: 'customer',
  ADMIN: 'admin',
};

export const ORDER_STATUS = {
  PENDING: 'pending',
  CONFIRMED: 'confirmed',
  PROCESSING: 'processing',
  SHIPPED: 'shipped',
  DELIVERED: 'delivered',
  CANCELLED: 'cancelled',
};

export const PAYMENT_STATUS = {
  PENDING: 'pending',
  PAID: 'paid',
  FAILED: 'failed',
  REFUNDED: 'refunded',
};

export const STOCK_MOVEMENT_REASON = {
  SALE: 'sale',
  RESTOCK: 'restock',
  ADMIN_CORRECTION: 'admin_correction',
  RETURN: 'return',
};

export const DISCOUNT_TYPE = {
  PERCENTAGE: 'percentage',
  FIXED: 'fixed',
};

// ─── For CommonJS consumers (server) ───
// This file is also imported by the server via require(),
// so we re-export for CJS compatibility in the server's copy.
