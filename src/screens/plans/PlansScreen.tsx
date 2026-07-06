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
import { getPlans, getActiveMembership, Plan } from '../../api/membershipPlans';
import { payForMembership } from '../../utils/razorpayCheckout';
import BottomNav from '../../components/BottomNav';

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
export default function PlansScreen({ navigation, route }: any) {
  const targetProfileId = route?.params?.profileId; // optional (opened from a profile)
  const [plans, setPlans] = useState<Plan[]>([]);
  const [loading, setLoading] = useState(true);
  const [activePlanId, setActivePlanId] = useState<string | null>(null);
  const [buyingId, setBuyingId] = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const [list, active] = await Promise.all([getPlans(), getActiveMembership()]);
      console.log('PLANS RAW:', JSON.stringify(list.map((p) => ({ name: p.planName, rank: p.rank }))));
      console.log('PLANS FULL:', JSON.stringify(list[0]));
      setPlans(list.sort((a: any, b: any) => (a.displayOrder ?? a.rank ?? 99) - (b.displayOrder ?? b.rank ?? 99)));
      setActivePlanId(active?.planId || active?.plan?._id || null);
    } catch {
      setPlans([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useFocusEffect(
    useCallback(() => {
      load();
    }, [load])
  );

  const buy = async (plan: Plan) => {
    setBuyingId(plan._id);
    const result = await payForMembership(plan._id);
    setBuyingId(null);
    if (result.success) {
      Alert.alert('Success', `${plan.planName} activated successfully!`);
      load(); // refresh active membership
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
                      ₹{plan.price}
                      {plan.duration ? (
                        <Text style={styles.planDuration}> / {plan.duration.value} {plan.duration.unit.toLowerCase()}</Text>
                      ) : null}
                    </Text>

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
                      onPress={() => !isActive && buy(plan)}
                      disabled={isActive || buyingId === plan._id}
                    >
                      {buyingId === plan._id ? (
                        <ActivityIndicator color={theme.btnText} />
                      ) : (
                        <Text style={[styles.buyText, { color: isActive ? '#1a7f37' : theme.btnText }]}>
                          {isActive ? '✓ Active Plan' : 'Upgrade Plan'}
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
  benefitBox: { borderRadius: 12, padding: 14, marginBottom: 16 },
  benefitRow: { flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 8 },
  benefitText: { fontSize: 13 },
  buyBtn: { backgroundColor: '#fff', borderRadius: 8, paddingVertical: 14, alignItems: 'center' },
  buyBtnActive: { backgroundColor: '#eafaf0' },
  buyText: { fontSize: 15, fontWeight: '700' },
  empty: { textAlign: 'center', color: '#999', marginTop: 40 },
});