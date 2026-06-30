import React, { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  Modal,
  FlatList,
  StyleSheet,
} from 'react-native';

type Option = { label: string; value: string };

type Props = {
  label?: string;
  placeholder?: string;
  value: string;
  options: Option[];
  onSelect: (value: string, label: string) => void;
  allowCustom?: boolean;
  error?: boolean;
  disabled?: boolean;
};

export default function SearchableDropdown({
  placeholder = 'Select',
  value,
  options,
  onSelect,
  allowCustom = false,
  error = false,
  disabled = false,
}: Props) {
  const [open, setOpen] = useState(false);
  const [search, setSearch] = useState('');

  const selectedLabel =
    options.find((o) => o.value === value)?.label || value || '';

  const filtered = search
    ? options.filter((o) => o.label.toLowerCase().includes(search.toLowerCase()))
    : options;

  const handlePick = (val: string, label: string) => {
    onSelect(val, label);
    setOpen(false);
    setSearch('');
  };

  const handleCustom = () => {
    if (search.trim()) {
      onSelect(search.trim(), search.trim());
      setOpen(false);
      setSearch('');
    }
  };

  return (
    <>
      <TouchableOpacity
        style={[styles.field, error && styles.fieldError, disabled && styles.fieldDisabled]}
        onPress={() => !disabled && setOpen(true)}
        activeOpacity={0.7}
      >
        <Text style={[styles.fieldText, !selectedLabel && styles.placeholder]}>
          {selectedLabel || placeholder}
        </Text>
        {selectedLabel ? (
          <TouchableOpacity onPress={() => onSelect('', '')} hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}>
            <Text style={styles.clear}>✕</Text>
          </TouchableOpacity>
        ) : (
          <Text style={styles.arrow}>▾</Text>
        )}
      </TouchableOpacity>

      <Modal visible={open} transparent animationType="fade" onRequestClose={() => setOpen(false)}>
        <TouchableOpacity style={styles.overlay} activeOpacity={1} onPress={() => setOpen(false)}>
          <View style={styles.modal}>
            <TextInput
              style={styles.search}
              placeholder="Search or type..."
              placeholderTextColor="#999"
              value={search}
              onChangeText={setSearch}
              autoFocus
            />

            <FlatList
              data={filtered}
              keyExtractor={(item) => item.value}
              keyboardShouldPersistTaps="handled"
              style={{ maxHeight: 280 }}
              renderItem={({ item }) => (
                <TouchableOpacity style={styles.option} onPress={() => handlePick(item.value, item.label)}>
                  <Text style={styles.optionText}>{item.label}</Text>
                </TouchableOpacity>
              )}
              ListEmptyComponent={
                allowCustom && search.trim() ? (
                  <TouchableOpacity style={styles.option} onPress={handleCustom}>
                    <Text style={styles.customText}>Use "{search.trim()}"</Text>
                  </TouchableOpacity>
                ) : (
                  <Text style={styles.empty}>No results</Text>
                )
              }
            />

            {allowCustom && search.trim() && filtered.length > 0 && (
              <TouchableOpacity style={styles.customRow} onPress={handleCustom}>
                <Text style={styles.customText}>+ Use "{search.trim()}"</Text>
              </TouchableOpacity>
            )}
          </View>
        </TouchableOpacity>
      </Modal>
    </>
  );
}

const styles = StyleSheet.create({
  field: {
    borderWidth: 1,
    borderColor: '#e0e0e0',
    borderRadius: 8,
    paddingHorizontal: 14,
    paddingVertical: 14,
    marginBottom: 12,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: '#fff',
  },
  fieldError: { borderColor: '#D20236', borderWidth: 1.5 },
  fieldDisabled: { backgroundColor: '#f5f5f5' },
  fieldText: { fontSize: 15, color: '#000' },
  placeholder: { color: '#999' },
  arrow: { fontSize: 14, color: '#666' },
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.4)',
    justifyContent: 'center',
    paddingHorizontal: 30,
  },
  modal: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 12,
    maxHeight: 380,
  },
  search: {
    borderWidth: 1,
    borderColor: '#e0e0e0',
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 10,
    fontSize: 15,
    color: '#000',
    marginBottom: 8,
  },
  option: { paddingVertical: 14, paddingHorizontal: 8, borderBottomWidth: 1, borderBottomColor: '#f2f2f2' },
  optionText: { fontSize: 15, color: '#333' },
  customRow: { paddingVertical: 12, paddingHorizontal: 8, borderTopWidth: 1, borderTopColor: '#eee' },
  customText: { fontSize: 15, color: '#D20236', fontWeight: '600' },
  empty: { textAlign: 'center', color: '#999', paddingVertical: 20 },
  clear: { fontSize: 15, color: '#999', fontWeight: '600' },
});