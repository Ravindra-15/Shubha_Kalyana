import React, { useState, useEffect } from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet, Modal } from 'react-native';
import Slider from '@react-native-community/slider';
import { X } from 'lucide-react-native';

export type VendorFilters = {
  location: string;
  minExperience: number;
};

type Props = {
  visible: boolean;
  initial: VendorFilters;
  onClose: () => void;
  onApply: (filters: VendorFilters) => void;
  onReset: () => void;
};

export default function VendorFilterModal({ visible, initial, onClose, onApply, onReset }: Props) {
  const [location, setLocation] = useState(initial.location);
  const [minExperience, setMinExperience] = useState(initial.minExperience);

  useEffect(() => {
    if (visible) {
      setLocation(initial.location);
      setMinExperience(initial.minExperience);
    }
  }, [visible, initial]);

  const handleApply = () => {
    onApply({ location: location.trim(), minExperience });
  };

  const handleReset = () => {
    setLocation('');
    setMinExperience(0);
    onReset();
  };

  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={onClose}>
      <View style={styles.overlay}>
        <View style={styles.sheet}>
          <View style={styles.handle} />

          <View style={styles.headRow}>
            <Text style={styles.title}>Filter & Show</Text>
            <TouchableOpacity onPress={onClose}>
              <X color="#999" size={22} />
            </TouchableOpacity>
          </View>

          <Text style={styles.label}>Select Location</Text>
          <View style={styles.inputWrap}>
            <TextInput
              style={styles.input}
              placeholder="E.g Bangalore"
              placeholderTextColor="#999"
              value={location}
              onChangeText={setLocation}
            />
            {!!location && (
              <TouchableOpacity onPress={() => setLocation('')} hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}>
                <X color="#999" size={16} />
              </TouchableOpacity>
            )}
          </View>

          <View style={styles.expHeadRow}>
            <Text style={styles.label}>Experience</Text>
            <Text style={styles.expValue}>{minExperience} Years</Text>
          </View>
          <Slider
            style={{ width: '100%', height: 40 }}
            minimumValue={0}
            maximumValue={20}
            step={1}
            value={minExperience}
            onValueChange={setMinExperience}
            minimumTrackTintColor="#D20236"
            maximumTrackTintColor="#f0d0d8"
            thumbTintColor="#D20236"
          />

          <TouchableOpacity style={styles.applyBtn} onPress={handleApply}>
            <Text style={styles.applyText}>Apply Filters</Text>
          </TouchableOpacity>

          <TouchableOpacity style={styles.resetBtn} onPress={handleReset}>
            <Text style={styles.resetText}>Reset Filters</Text>
          </TouchableOpacity>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.4)', justifyContent: 'flex-end' },
  sheet: {
    backgroundColor: '#fff', borderTopLeftRadius: 24, borderTopRightRadius: 24,
    paddingHorizontal: 24, paddingTop: 12, paddingBottom: 30,
  },
  handle: { width: 40, height: 4, borderRadius: 2, backgroundColor: '#e0e0e0', alignSelf: 'center', marginBottom: 16 },
  headRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 },
  title: { fontSize: 18, fontWeight: '700', color: '#000' },
  label: { fontSize: 14, fontWeight: '600', color: '#333', marginBottom: 10 },
  inputWrap: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    borderWidth: 1, borderColor: '#e0e0e0', borderRadius: 10,
    paddingHorizontal: 14, paddingVertical: 12, marginBottom: 24,
  },
  input: { flex: 1, fontSize: 14, color: '#000' },
  expHeadRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  expValue: { fontSize: 13, fontWeight: '700', color: '#D20236', marginBottom: 10 },
  applyBtn: {
    backgroundColor: '#D20236', borderRadius: 10, paddingVertical: 15,
    alignItems: 'center', marginTop: 20,
  },
  applyText: { fontSize: 15, fontWeight: '700', color: '#fff' },
  resetBtn: {
    borderWidth: 1, borderColor: '#e0e0e0', borderRadius: 10, paddingVertical: 15,
    alignItems: 'center', marginTop: 12,
  },
  resetText: { fontSize: 15, fontWeight: '600', color: '#333' },
});