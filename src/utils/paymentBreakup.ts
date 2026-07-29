export const GST_RATE = 18;
export const CGST_RATE = GST_RATE / 2;
export const SGST_RATE = GST_RATE / 2;

export type PaymentBreakup = {
  taxableAmount: number;
  taxAmount: number;
  taxRate: number;
  cgstAmount: number;
  cgstRate: number;
  sgstAmount: number;
  sgstRate: number;
  totalAmount: number;
};

export type PaymentOrder = {
  amount?: number;
  taxableAmount?: number;
  taxAmount?: number;
  taxRate?: number;
  currency?: string;
  gatewayOrderId?: string;
  metadata?: {
    billingBreakup?: Partial<PaymentBreakup>;
  };
};

export type PaymentOrderResult = {
  order?: PaymentOrder;
  keyId?: string;
  gateway?: string;
};

const roundMoney = (value: number | string | undefined | null) =>
  Math.round(Number(value || 0) * 100) / 100;

export const formatMoney = (amount: number | string | undefined | null, currency = 'INR') => {
  const numericValue = Number(amount || 0);
  const value = numericValue.toLocaleString('en-IN', {
    minimumFractionDigits: Number.isInteger(numericValue) ? 0 : 2,
    maximumFractionDigits: 2,
  });

  return currency === 'INR' ? `\u20B9${value}` : `${currency} ${value}`;
};

export const getBillingBreakupFromOrder = (order: PaymentOrder = {}): PaymentBreakup => {
  const metadataBreakup = order.metadata?.billingBreakup || {};
  const taxableAmount = roundMoney(
    order.taxableAmount ?? metadataBreakup.taxableAmount ?? order.amount,
  );
  const totalAmount = roundMoney(
    order.amount ?? metadataBreakup.totalAmount ?? taxableAmount,
  );
  const taxAmount = roundMoney(
    order.taxAmount ?? metadataBreakup.taxAmount ?? totalAmount - taxableAmount,
  );
  const taxRate = Number(order.taxRate ?? metadataBreakup.taxRate ?? GST_RATE);
  const cgstRate = Number(metadataBreakup.cgstRate ?? taxRate / 2);
  const sgstRate = Number(metadataBreakup.sgstRate ?? taxRate / 2);
  const cgstAmount = roundMoney(metadataBreakup.cgstAmount ?? taxAmount / 2);
  const sgstAmount = roundMoney(metadataBreakup.sgstAmount ?? taxAmount - cgstAmount);

  return {
    taxableAmount,
    taxAmount,
    taxRate,
    cgstAmount,
    cgstRate,
    sgstAmount,
    sgstRate,
    totalAmount,
  };
};
