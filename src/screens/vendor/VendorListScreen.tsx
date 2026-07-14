import React, { useState, useEffect, useMemo, useCallback } from 'react';
import {
  View, Text, TextInput, TouchableOpacity, StyleSheet, FlatList,
  Image, ActivityIndicator, Linking,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { ArrowLeft, Search, Filter, BadgeCheck, MapPin, Briefcase, Phone, Globe } from 'lucide-react-native';
import { getPublicVendors } from '../../api/vendor';
import { resolveImageUrl } from '../../utils/imageUrl';
import BottomNav from '../../components/BottomNav';
import VendorFilterModal, { VendorFilters } from '../../components/VendorFilterModal';

const PAGE_SIZE = 6;

export default function VendorListScreen({ navigation }: any) {
  const [allVendors, setAllVendors] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [activeCategory, setActiveCategory] = useState('All');
  const [showFilter, setShowFilter] = useState(false);
  const [filters, setFilters] = useState<VendorFilters>({ location: '', minExperience: 0 });
  const [visibleCount, setVisibleCount] = useState(PAGE_SIZE);

  const load = useCallback(async () => {
    setLoading(true);
    const data = await getPublicVendors();
    setAllVendors(data);
    setLoading(false);
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  const categories = useMemo(() => {
    const unique = Array.from(new Set(allVendors.map((v) => v.serviceCategory).filter(Boolean)));
    return ['All', ...unique];
  }, [allVendors]);

  const filtered = useMemo(() => {
    return allVendors.filter((v) => {
      if (activeCategory !== 'All' && v.serviceCategory !== activeCategory) return false;
      if (search.trim() && !v.vendorName.toLowerCase().includes(search.trim().toLowerCase())) return false;
      if (filters.location.trim() && !(v.location || '').toLowerCase().includes(filters.location.trim().toLowerCase())) return false;
      if (filters.minExperience > 0 && (v.experience || 0) < filters.minExperience) return false;
      return true;
    });
  }, [allVendors, activeCategory, search, filters]);

  useEffect(() => {
    setVisibleCount(PAGE_SIZE);
  }, [activeCategory, search, filters]);

  const visibleVendors = filtered.slice(0, visibleCount);
  const hasMore = visibleCount < filtered.length;

  const loadMore = () => {
    if (hasMore) setVisibleCount((c) => c + PAGE_SIZE);
  };

  const handleApplyFilters = (next: VendorFilters) => {
    setFilters(next);
    setShowFilter(false);
  };

  const handleResetFilters = () => {
    setFilters({ location: '', minExperience: 0 });
    setShowFilter(false);
  };

  const contactVendor = (contactNumber: string) => {
    if (contactNumber) Linking.openURL(`tel:${contactNumber}`);
  };

  const openWebsite = (url: string) => {
    if (url) Linking.openURL(url);
  };

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()}>
          <ArrowLeft color="#000" size={24} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Vendor Directory</Text>
        <View style={{ width: 24 }} />
      </View>

      <View style={styles.searchRow}>
        <View style={styles.searchBox}>
          <Search color="#999" size={16} />
          <TextInput
            style={styles.searchInput}
            placeholder="Search vendors..."
            placeholderTextColor="#999"
            value={search}
            onChangeText={setSearch}
          />
        </View>
        <TouchableOpacity style={styles.filterBtn} onPress={() => setShowFilter(true)}>
          <Filter color="#333" size={18} />
        </TouchableOpacity>
      </View>

      <View style={styles.chipsWrap}>
        <FlatList
          data={categories}
          horizontal
          keyExtractor={(item) => item}
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={{ paddingHorizontal: 16, gap: 8 }}
          renderItem={({ item }) => {
            const active = activeCategory === item;
            return (
              <TouchableOpacity
                style={[styles.chip, active && styles.chipActive]}
                onPress={() => setActiveCategory(item)}
              >
                <Text style={[styles.chipText, active && styles.chipTextActive]}>{item}</Text>
              </TouchableOpacity>
            );
          }}
        />
      </View>

      {loading ? (
        <ActivityIndicator color="#D20236" style={{ marginTop: 40 }} />
      ) : (
        <FlatList
          data={visibleVendors}
          keyExtractor={(item) => item._id}
          contentContainerStyle={styles.list}
          showsVerticalScrollIndicator={false}
          onEndReached={loadMore}
          onEndReachedThreshold={0.5}
          renderItem={({ item }) => (
            <View style={styles.card}>
              {item.image?.url ? (
                <Image source={{ uri: resolveImageUrl(item.image.url) }} style={styles.cardImage} />
              ) : (
                <View style={[styles.cardImage, styles.cardImagePlaceholder]} />
              )}

              <View style={styles.cardBody}>
                <View style={styles.nameRow}>
                  <Text style={styles.vendorName}>{item.vendorName}</Text>
                  <BadgeCheck color="#1a7f37" size={16} fill="#1a7f37" />
                </View>

                <View style={styles.metaRow}>
                  <Briefcase color="#888" size={13} />
                  <Text style={styles.metaText}>{item.serviceCategory}</Text>
                </View>
                <View style={styles.metaRow}>
                  <MapPin color="#888" size={13} />
                  <Text style={styles.metaText}>{item.location}</Text>
                </View>
                <View style={styles.metaRow}>
                  <Text style={styles.experienceText}>★ {item.experience}+ Years</Text>
                </View>

                {!!item.about && <Text style={styles.about} numberOfLines={2}>{item.about}</Text>}

                {!!item.contactNumber && (
                  <View style={styles.metaRow}>
                    <Phone color="#888" size={13} />
                    <Text style={styles.metaText}>+91 {item.contactNumber}</Text>
                  </View>
                )}

                <View style={styles.actionRow}>
                  <TouchableOpacity
                    style={styles.contactBtn}
                    onPress={() => contactVendor(item.contactNumber)}
                  >
                    <Text style={styles.contactBtnText}>Contact Vendor</Text>
                  </TouchableOpacity>
                  {!!item.portfolioLink && (
                    <TouchableOpacity
                      style={styles.websiteBtn}
                      onPress={() => openWebsite(item.portfolioLink)}
                    >
                      <Globe color="#333" size={14} />
                      <Text style={styles.websiteBtnText}>Website</Text>
                    </TouchableOpacity>
                  )}
                </View>
              </View>
            </View>
          )}
          ListEmptyComponent={<Text style={styles.empty}>No vendors found</Text>}
          ListFooterComponent={hasMore ? <ActivityIndicator color="#D20236" style={{ marginVertical: 20 }} /> : null}
        />
      )}

      <VendorFilterModal
        visible={showFilter}
        initial={filters}
        onClose={() => setShowFilter(false)}
        onApply={handleApplyFilters}
        onReset={handleResetFilters}
      />

      <BottomNav active="HomeTab" />
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
  searchRow: { flexDirection: 'row', gap: 10, paddingHorizontal: 16, marginBottom: 12 },
  searchBox: {
    flex: 1, flexDirection: 'row', alignItems: 'center', gap: 8,
    backgroundColor: '#f5f5f5', borderRadius: 10, paddingHorizontal: 12, paddingVertical: 10,
  },
  searchInput: { flex: 1, fontSize: 14, color: '#000' },
  filterBtn: {
    width: 42, height: 42, borderRadius: 10, borderWidth: 1, borderColor: '#e0e0e0',
    alignItems: 'center', justifyContent: 'center',
  },
  chipsWrap: { marginBottom: 12 },
  chip: {
    borderWidth: 1, borderColor: '#e0e0e0', borderRadius: 20,
    paddingHorizontal: 16, paddingVertical: 8,
  },
  chipActive: { backgroundColor: '#D20236', borderColor: '#D20236' },
  chipText: { fontSize: 13, color: '#333', fontWeight: '500' },
  chipTextActive: { color: '#fff', fontWeight: '700' },
  list: { paddingHorizontal: 16, paddingBottom: 20 },
  card: {
    backgroundColor: '#fff', borderRadius: 16, borderWidth: 1, borderColor: '#f0f0f0',
    marginBottom: 16, overflow: 'hidden',
  },
  cardImage: { width: '100%', height: 140 },
  cardImagePlaceholder: { backgroundColor: '#eee' },
  cardBody: { padding: 16 },
  nameRow: { flexDirection: 'row', alignItems: 'center', gap: 6, marginBottom: 6 },
  vendorName: { fontSize: 16, fontWeight: '700', color: '#000' },
  metaRow: { flexDirection: 'row', alignItems: 'center', gap: 6, marginBottom: 4 },
  metaText: { fontSize: 13, color: '#666' },
  experienceText: { fontSize: 12, color: '#b8860b', fontWeight: '600' },
  about: { fontSize: 13, color: '#555', marginTop: 6, marginBottom: 10, lineHeight: 18 },
  actionRow: { flexDirection: 'row', gap: 10, marginTop: 8 },
  contactBtn: {
    flex: 1, backgroundColor: '#D20236', borderRadius: 8, paddingVertical: 12, alignItems: 'center',
  },
  contactBtnText: { fontSize: 14, fontWeight: '700', color: '#fff' },
  websiteBtn: {
    flexDirection: 'row', alignItems: 'center', gap: 6,
    borderWidth: 1, borderColor: '#e0e0e0', borderRadius: 8,
    paddingHorizontal: 16, paddingVertical: 12,
  },
  websiteBtnText: { fontSize: 13, fontWeight: '600', color: '#333' },
  empty: { textAlign: 'center', color: '#999', marginTop: 40 },
});