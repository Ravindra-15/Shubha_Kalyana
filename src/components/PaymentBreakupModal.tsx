import React from 'react';
import {
  ActivityIndicator,
  Modal,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { X } from 'lucide-react-native';
import {
  formatMoney,
  getBillingBreakupFromOrder,
} from '../utils/paymentBreakup';
import type { PaymentOrderResult } from '../utils/paymentBreakup';

type PendingPayment = {
  orderResult: PaymentOrderResult;
  title?: string;
  description?: string;
  itemLabel?: string;
};

type Props = {
  visible: boolean;
  payment: PendingPayment | null;
  loading?: boolean;
  onClose: () => void;
  onPurchase: () => void;
};

export default function PaymentBreakupModal({
  visible,
  payment,
  loading = false,
  onClose,
  onPurchase,
}: Props) {
  if (!payment) return null;

  const order = payment.orderResult?.order || {};
  const breakup = getBillingBreakupFromOrder(order);
  const currency = order.currency || 'INR';
  const upgradePricing = order.metadata?.upgradePricing;
  const showUpgradeCredit =
    !!upgradePricing?.isUpgrade && Number(upgradePricing.creditAmount || 0) > 0;

  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={onClose}>
      <View style={styles.overlay}>
        <View style={styles.sheet}>
          <TouchableOpacity style={styles.closeBtn} onPress={onClose} disabled={loading}>
            <X color="#999" size={22} />
          </TouchableOpacity>

          <Text style={styles.eyebrow}>Payment Summary</Text>
          <Text style={styles.title}>{payment.title || 'Confirm Payment'}</Text>
          {!!payment.description && (
            <Text style={styles.subtitle}>{payment.description}</Text>
          )}

          <View style={styles.breakupBox}>
            {showUpgradeCredit ? (
              <>
                <View style={styles.row}>
                  <Text style={styles.label}>Plan price</Text>
                  <Text style={styles.value}>
                    {formatMoney(upgradePricing.targetPlanPrice, currency)}
                  </Text>
                </View>
                <View style={styles.row}>
                  <Text style={styles.creditLabel}>
                    {upgradePricing.currentPlanName || 'Current plan'} credit
                  </Text>
                  <Text style={styles.creditValue}>
                    -{formatMoney(upgradePricing.creditAmount, currency)}
                  </Text>
                </View>
              </>
            ) : null}
            <View style={styles.row}>
              <Text style={styles.label}>{payment.itemLabel || 'Payment amount'}</Text>
              <Text style={styles.value}>{formatMoney(breakup.taxableAmount, currency)}</Text>
            </View>
            <View style={styles.row}>
              <Text style={styles.label}>CGST ({breakup.cgstRate}%)</Text>
              <Text style={styles.value}>{formatMoney(breakup.cgstAmount, currency)}</Text>
            </View>
            <View style={styles.row}>
              <Text style={styles.label}>SGST ({breakup.sgstRate}%)</Text>
              <Text style={styles.value}>{formatMoney(breakup.sgstAmount, currency)}</Text>
            </View>
            <View style={styles.gstRow}>
              <Text style={styles.gstLabel}>GST ({breakup.taxRate}%)</Text>
              <Text style={styles.gstValue}>{formatMoney(breakup.taxAmount, currency)}</Text>
            </View>
            <View style={styles.totalRow}>
              <Text style={styles.totalLabel}>Total payable</Text>
              <Text style={styles.totalValue}>{formatMoney(breakup.totalAmount, currency)}</Text>
            </View>
          </View>

          <View style={styles.actions}>
            <TouchableOpacity style={styles.cancelBtn} onPress={onClose} disabled={loading}>
              <Text style={styles.cancelText}>Cancel</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.purchaseBtn} onPress={onPurchase} disabled={loading}>
              {loading ? (
                <ActivityIndicator color="#fff" />
              ) : (
                <Text style={styles.purchaseText}>Purchase</Text>
              )}
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.45)',
    justifyContent: 'flex-end',
  },
  sheet: {
    backgroundColor: '#fff',
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    paddingHorizontal: 24,
    paddingTop: 28,
    paddingBottom: 26,
  },
  closeBtn: { position: 'absolute', top: 16, right: 16, padding: 4 },
  eyebrow: {
    color: '#D20236',
    fontSize: 12,
    fontWeight: '800',
    letterSpacing: 0,
    textTransform: 'uppercase',
  },
  title: { marginTop: 7, paddingRight: 32, color: '#000', fontSize: 21, fontWeight: '800' },
  subtitle: { marginTop: 8, color: '#666', fontSize: 13, lineHeight: 19 },
  breakupBox: {
    marginTop: 22,
    borderWidth: 1,
    borderColor: '#eee',
    borderRadius: 12,
    padding: 16,
  },
  row: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    gap: 12,
    marginBottom: 13,
  },
  label: { color: '#555', fontSize: 14, fontWeight: '600', flex: 1 },
  value: { color: '#111', fontSize: 14, fontWeight: '800' },
  creditLabel: { color: '#1a7f37', fontSize: 14, fontWeight: '700', flex: 1 },
  creditValue: { color: '#1a7f37', fontSize: 14, fontWeight: '800' },
  gstRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    gap: 12,
    borderRadius: 9,
    backgroundColor: '#fdf2f5',
    paddingHorizontal: 12,
    paddingVertical: 11,
  },
  gstLabel: { color: '#D20236', fontSize: 14, fontWeight: '800' },
  gstValue: { color: '#D20236', fontSize: 14, fontWeight: '800' },
  totalRow: {
    marginTop: 14,
    paddingTop: 14,
    borderTopWidth: 1,
    borderTopColor: '#eee',
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    gap: 12,
  },
  totalLabel: { color: '#000', fontSize: 16, fontWeight: '800' },
  totalValue: { color: '#000', fontSize: 18, fontWeight: '900' },
  actions: { flexDirection: 'row', gap: 12, marginTop: 22 },
  cancelBtn: {
    flex: 1,
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 9,
    paddingVertical: 14,
    alignItems: 'center',
  },
  cancelText: { color: '#333', fontSize: 15, fontWeight: '800' },
  purchaseBtn: {
    flex: 1,
    backgroundColor: '#D20236',
    borderRadius: 9,
    paddingVertical: 14,
    alignItems: 'center',
  },
  purchaseText: { color: '#fff', fontSize: 15, fontWeight: '800' },
});
