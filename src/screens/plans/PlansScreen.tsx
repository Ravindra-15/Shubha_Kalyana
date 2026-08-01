import React, { useState, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useFocusEffect } from '@react-navigation/native';
import { ArrowLeft, Crown, Check } from 'lucide-react-native';
import { getPlans, getActiveMembership, createMembershipOrder } from '../../api/membershipPlans';
import type { Plan } from '../../api/membershipPlans';
import { getMyFullProfile } from '../../api/profile';
import { openRazorpayOrder } from '../../utils/razorpayCheckout';
import { formatMoney, type PaymentOrderResult } from '../../utils/paymentBreakup';
import PaymentBreakupModal from '../../components/PaymentBreakupModal';
import BottomNav from '../../components/BottomNav';
import VerificationPromptModal from '../../components/VerificationPromptModal';
import { getVerificationPromptStatus } from '../../utils/verificationPrompt';
import type { VerificationPromptStatus } from '../../utils/verificationPrompt';

// human-readable benefit lines from the toggles
const benefitLines = (plan: Plan): string[] => {
  const b = plan.benefits || {};
  const lines: string[] = [];
  if (plan.accessLimit) lines.push(`${plan.accessLimit} profile views`);
  if (plan.duration) lines.push(`${plan.duration.value} ${plan.duration.unit.toLowerCase()} access`);
  if (b.chatOptions) lines.push('Chat with your matches');
  if (b.sendUnlimitedMessages) lines.push('Unlimited messages');
  if (b.matchesCanConnectDirectly) lines.push('Direct connect with matches');
  if (b.customerSupport) lines.push('Priority customer support');
  if (b.verifiedBadge) lines.push('Verified badge');
  if (lines.length === 0) lines.push('Premium features'); // fallback
  return lines;
};

// pick a theme by rank (1 = gold, else silver-ish)
const planTheme = (planName?: string) => {
  const n = (planName || '').toLowerCase();
  if (n.includes('gold')) return { bg: '#C99700', light: 'rgba(255,255,255,0.18)', text: '#fff', btnText: '#C99700' };
  if (n.includes('silver')) return { bg: '#B4B4B4', light: 'rgba(255,255,255,0.25)', text: '#fff', btnText: '#6b6b6b' };
  if (n.includes('bronze')) return { bg: '#CD7F32', light: 'rgba(255,255,255,0.20)', text: '#fff', btnText: '#CD7F32' };
  if (n.includes('platinum')) return { bg: '#3A4A5A', light: 'rgba(255,255,255,0.18)', text: '#fff', btnText: '#3A4A5A' };
  if (n.includes('diamond')) return { bg: '#2b6cb0', light: 'rgba(255,255,255,0.18)', text: '#fff', btnText: '#2b6cb0' };
  return { bg: '#7A5CA6', light: 'rgba(255,255,255,0.18)', text: '#fff', btnText: '#7A5CA6' }; // default
};

const getPlanUpgradePricing = (plan: Plan) =>
  plan.upgradePricing?.isUpgrade ? plan.upgradePricing : null;

const getPlanPayableAmount = (plan: Plan) =>
  getPlanUpgradePricing(plan)?.payableAmount ?? plan.price;

type PendingPayment = {
  plan: Plan;
  orderResult: PaymentOrderResult;
  title: string;
  description: string;
  itemLabel: string;
};

export default function PlansScreen({ navigation, route }: any) {
  const targetProfileId = route?.params?.profileId; // optional (opened from a profile)
  const [plans, setPlans] = useState<Plan[]>([]);
  const [loading, setLoading] = useState(true);
  const [activePlanId, setActivePlanId] = useState<string | null>(null);
  const [activePlanRank, setActivePlanRank] = useState(0);
  const [buyingId, setBuyingId] = useState<string | null>(null);
  const [pendingPayment, setPendingPayment] = useState<PendingPayment | null>(null);
  const [confirmingPayment, setConfirmingPayment] = useState(false);
  const [verificationPrompt, setVerificationPrompt] =
    useState<VerificationPromptStatus | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const [list, active] = await Promise.all([getPlans(), getActiveMembership()]);
      console.log('PLANS RAW:', JSON.stringify(list.map((p) => ({ name: p.planName, rank: p.rank }))));
      console.log('PLANS FULL:', JSON.stringify(list[0]));
      setPlans(list.sort((a: any, b: any) => (a.displayOrder ?? a.rank ?? 99) - (b.displayOrder ?? b.rank ?? 99)));
      setActivePlanId(active?.planId?._id || active?.planId || active?.plan?._id || null);
      setActivePlanRank(Number(active?.planSnapshot?.rank || active?.plan?.rank || 0));
    } catch {
      setPlans([]);
      setActivePlanId(null);
      setActivePlanRank(0);
    } finally {
      setLoading(false);
    }
  }, []);

  useFocusEffect(
    useCallback(() => {
      load();
    }, [load])
  );

  const showVerificationPrompt = useCallback(async () => {
    try {
      const [profile, activeMembership] = await Promise.all([
        getMyFullProfile(),
        getActiveMembership(),
      ]);
      const status = getVerificationPromptStatus(profile, activeMembership);
      if (status.shouldShow) {
        setVerificationPrompt(status);
        return true;
      }
      setVerificationPrompt(null);
    } catch {
      // Keep membership success intact if this secondary check fails.
    }

    return false;
  }, []);

  const buy = async (plan: Plan) => {
    setBuyingId(plan._id);
    try {
      const orderResult = await createMembershipOrder(plan._id);
      if (!orderResult?.order?.gatewayOrderId || !orderResult?.keyId) {
        Alert.alert('Payment', 'Could not create membership order');
        return;
      }

      const upgradePricing =
        orderResult?.order?.metadata?.upgradePricing || getPlanUpgradePricing(plan);
      setPendingPayment({
        plan,
        orderResult,
        title: `${plan.planName} Membership`,
        description: upgradePricing?.isUpgrade
          ? `Your unused ${upgradePricing.currentPlanName || 'current plan'} value is adjusted before GST.`
          : 'Review the GST breakup before continuing to Razorpay.',
        itemLabel: upgradePricing?.isUpgrade ? 'Upgrade amount' : 'Membership price',
      });
    } catch (err: any) {
      Alert.alert('Payment', err?.response?.data?.message || 'Could not create membership order');
    } finally {
      setBuyingId(null);
    }
  };

  const closePaymentBreakup = () => {
    if (confirmingPayment) return;
    setPendingPayment(null);
  };

  const confirmPayment = async () => {
    const payment = pendingPayment;
    if (!payment) return;

    setConfirmingPayment(true);
    const result = await openRazorpayOrder(payment.orderResult, 'Membership Plan');
    setConfirmingPayment(false);
    setPendingPayment(null);

    if (result.success) {
      await load(); // refresh active membership
      const promptShown = await showVerificationPrompt();
      if (!promptShown) {
        Alert.alert('Success', `${payment.plan.planName} activated successfully!`);
      }
    } else {
      Alert.alert('Payment', result.message || 'Payment failed');
    }
  };

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()}>
          <ArrowLeft color="#000" size={24} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Upgrade to Premium</Text>
        <View style={{ width: 24 }} />
      </View>

      <View style={styles.content}>
        {loading ? (
          <ActivityIndicator color="#D20236" style={{ marginTop: 40 }} />
        ) : (
          <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scroll}>
            {/* Optional per-profile unlock banner */}
            {targetProfileId && (
              <>
                <TouchableOpacity
                  style={styles.unlockBanner}
                  onPress={() => navigation.goBack()}
                >
                  <Text style={styles.unlockBannerText}>Unlock this profile individually</Text>
                </TouchableOpacity>
                <View style={styles.orRow}>
                  <View style={styles.orLine} />
                  <Text style={styles.orText}>or choose a plan</Text>
                  <View style={styles.orLine} />
                </View>
              </>
            )}

            {plans.length === 0 ? (
              <Text style={styles.empty}>No plans available right now</Text>
            ) : (
              plans.map((plan) => {
                const theme = planTheme(plan.planName);
                const isActive = activePlanId === plan._id;
                const cannotUpgrade =
                  !isActive && activePlanRank > 0 && Number(plan.rank || 0) <= activePlanRank;
                const upgradePricing = getPlanUpgradePricing(plan);
                const payableAmount = getPlanPayableAmount(plan);
                return (
                  <View key={plan._id} style={[styles.planCard, { backgroundColor: theme.bg }]}>
                    <View style={styles.planHead}>
                      <Crown color={theme.text} size={20} />
                      <Text style={[styles.planName, { color: theme.text }]}>{plan.planName}</Text>
                    </View>
                    <Text style={[styles.planSub, { color: theme.text }]}>
                      {plan.label || 'Upgrade to unlock premium features'}
                    </Text>
                    <Text style={[styles.planPrice, { color: theme.text }]}>
                      {formatMoney(payableAmount, plan.currency)}
                      {plan.duration ? (
                        <Text style={styles.planDuration}> / {plan.duration.value} {plan.duration.unit.toLowerCase()}</Text>
                      ) : null}
                    </Text>
                    {upgradePricing ? (
                      <Text style={[styles.upgradeCredit, { color: theme.text }]}>
                        {formatMoney(upgradePricing.targetPlanPrice, plan.currency)} before {formatMoney(upgradePricing.creditAmount, plan.currency)} credit
                      </Text>
                    ) : null}

                    <View style={[styles.benefitBox, { backgroundColor: theme.light }]}>
                      {benefitLines(plan).map((line, i) => (
                        <View key={i} style={styles.benefitRow}>
                          <Check color={theme.text} size={14} />
                          <Text style={[styles.benefitText, { color: theme.text }]}>{line}</Text>
                        </View>
                      ))}
                    </View>

                    <TouchableOpacity
                      style={[styles.buyBtn, isActive && styles.buyBtnActive]}
                      onPress={() => !isActive && !cannotUpgrade && buy(plan)}
                      disabled={isActive || cannotUpgrade || buyingId === plan._id}
                    >
                      {buyingId === plan._id ? (
                        <ActivityIndicator color={theme.btnText} />
                      ) : (
                        <Text style={[styles.buyText, { color: isActive ? '#1a7f37' : theme.btnText }]}>
                          {isActive ? 'Active Plan' : cannotUpgrade ? 'Higher Plan Required' : 'Upgrade Plan'}
                        </Text>
                      )}
                    </TouchableOpacity>
                  </View>
                );
              })
            )}
          </ScrollView>
        )}
      </View>

      <BottomNav active="ProfileTab" />
      <PaymentBreakupModal
        visible={Boolean(pendingPayment)}
        payment={pendingPayment}
        loading={confirmingPayment}
        onClose={closePaymentBreakup}
        onPurchase={confirmPayment}
      />
      <VerificationPromptModal
        visible={Boolean(verificationPrompt)}
        status={verificationPrompt}
        onClose={() => setVerificationPrompt(null)}
        onVerifyPhoto={() => {
          setVerificationPrompt(null);
          navigation.navigate('FaceTecTest');
        }}
        onVerifyAadhaar={() => undefined}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#fff' },
  header: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    paddingHorizontal: 16, paddingVertical: 12,
  },
  headerTitle: { fontSize: 18, fontWeight: '700', color: '#000' },
  content: { flex: 1 },
  scroll: { padding: 16, paddingBottom: 20 },
  unlockBanner: {
    backgroundColor: '#D20236', borderRadius: 10, paddingVertical: 15, alignItems: 'center', marginBottom: 16,
  },
  unlockBannerText: { color: '#fff', fontSize: 15, fontWeight: '700' },
  orRow: { flexDirection: 'row', alignItems: 'center', marginBottom: 16, gap: 10 },
  orLine: { flex: 1, height: 1, backgroundColor: '#eee' },
  orText: { fontSize: 12, color: '#D20236', fontWeight: '600' },
  planCard: { borderRadius: 16, padding: 18, marginBottom: 16 },
  planHead: { flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 6 },
  planName: { fontSize: 18, fontWeight: '700' },
  planSub: { fontSize: 13, marginBottom: 12, opacity: 0.9 },
  planPrice: { fontSize: 26, fontWeight: '800', marginBottom: 14 },
  planDuration: { fontSize: 13, fontWeight: '500' },
  upgradeCredit: { marginTop: -8, marginBottom: 14, fontSize: 12, fontWeight: '700', opacity: 0.88 },
  benefitBox: { borderRadius: 12, padding: 14, marginBottom: 16 },
  benefitRow: { flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 8 },
  benefitText: { fontSize: 13 },
  buyBtn: { backgroundColor: '#fff', borderRadius: 8, paddingVertical: 14, alignItems: 'center' },
  buyBtnActive: { backgroundColor: '#eafaf0' },
  buyText: { fontSize: 15, fontWeight: '700' },
  empty: { textAlign: 'center', color: '#999', marginTop: 40 },
});
