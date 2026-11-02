import React, { useState, useEffect } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Modal } from 'react-native';
import Slider from '@react-native-community/slider';
import { X } from 'lucide-react-native';
import SearchableDropdown from './SearchableDropdown';
import { INDIAN_STATE_OPTIONS } from '../constants/indianStates';
import { getDistrictOptionsForStates } from '../constants/districtsByState';

export type VendorFilters = {
  state: string;
  city: string;
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
  const [state, setState] = useState(initial.state);
  const [city, setCity] = useState(initial.city);
  const [minExperience, setMinExperience] = useState(initial.minExperience);

  useEffect(() => {
    if (visible) {
      setState(initial.state);
      setCity(initial.city);
      setMinExperience(initial.minExperience);
    }
  }, [visible, initial]);

  const handleApply = () => {
    onApply({ state, city, minExperience });
  };

  const handleReset = () => {
    setState('');
    setCity('');
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

          <Text style={styles.label}>State</Text>
          <SearchableDropdown
            placeholder="All States"
            value={state}
            options={INDIAN_STATE_OPTIONS}
            onSelect={(next) => {
              setState(next);
              // Districts belong to one state, so a new state clears it.
              setCity('');
            }}
          />

          <Text style={styles.label}>City / District</Text>
          <SearchableDropdown
            placeholder={state ? 'All Cities / Districts' : 'Select a state first'}
            value={city}
            options={getDistrictOptionsForStates(state ? [state] : [])}
            onSelect={setCity}
            disabled={!state}
          />

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
  title: { fontSize: 18, fontFamily: 'Outfit-Bold', color: '#000' },
  label: { fontSize: 14, fontFamily: 'Outfit-SemiBold', color: '#333', marginBottom: 10 },
  expHeadRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginTop: 12 },
  expValue: { fontSize: 13, fontFamily: 'Outfit-Bold', color: '#D20236', marginBottom: 10 },
  applyBtn: {
    backgroundColor: '#D20236', borderRadius: 10, paddingVertical: 15,
    alignItems: 'center', marginTop: 20,
  },
  applyText: { fontSize: 15, fontFamily: 'Outfit-Bold', color: '#fff' },
  resetBtn: {
    borderWidth: 1, borderColor: '#e0e0e0', borderRadius: 10, paddingVertical: 15,
    alignItems: 'center', marginTop: 12,
  },
  resetText: { fontSize: 15, fontFamily: 'Outfit-SemiBold', color: '#333' },
});
