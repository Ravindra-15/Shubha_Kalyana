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
  placeholder?: string;
  value: string[];
  options: Option[];
  onChange: (values: string[]) => void;
  allowCustom?: boolean;
  disabled?: boolean;
};

export default function MultiSelectDropdown({
  placeholder = 'Select',
  value,
  options,
  onChange,
  allowCustom = false,
  disabled = false,
}: Props) {
  const [open, setOpen] = useState(false);
  const [search, setSearch] = useState('');

  const summary =
    value.length === 0
      ? ''
      : value.length === 1
        ? options.find((o) => o.value === value[0])?.label || value[0]
        : `${value.length} selected`;

  const filtered = search
    ? options.filter((o) => o.label.toLowerCase().includes(search.toLowerCase()))
    : options;

  const toggle = (val: string) => {
    onChange(value.includes(val) ? value.filter((v) => v !== val) : [...value, val]);
  };

  const handleCustom = () => {
    const custom = search.trim();
    if (custom && !value.includes(custom)) {
      onChange([...value, custom]);
    }
    setSearch('');
  };

  const close = () => {
    setOpen(false);
    setSearch('');
  };

  return (
    <>
      <TouchableOpacity
        style={[styles.field, disabled && styles.fieldDisabled]}
        onPress={() => !disabled && setOpen(true)}
        activeOpacity={0.7}
      >
        <Text style={[styles.fieldText, !summary && styles.placeholder]} numberOfLines={1}>
          {summary || placeholder}
        </Text>
        {summary && !disabled ? (
          <TouchableOpacity onPress={() => onChange([])} hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}>
            <Text style={styles.clear}>✕</Text>
          </TouchableOpacity>
        ) : (
          <Text style={styles.arrow}>▾</Text>
        )}
      </TouchableOpacity>

      <Modal visible={open} transparent animationType="fade" onRequestClose={close}>
        <TouchableOpacity style={styles.overlay} activeOpacity={1} onPress={close}>
          <View style={styles.modal} onStartShouldSetResponder={() => true}>
            <TextInput
              style={styles.search}
              placeholder="Search..."
              placeholderTextColor="#999"
              value={search}
              onChangeText={setSearch}
              autoFocus
              onSubmitEditing={allowCustom ? handleCustom : undefined}
            />

            <FlatList
              data={filtered}
              keyExtractor={(item) => item.value}
              keyboardShouldPersistTaps="handled"
              style={{ maxHeight: 280 }}
              renderItem={({ item }) => {
                const checked = value.includes(item.value);
                return (
                  <TouchableOpacity style={styles.option} onPress={() => toggle(item.value)}>
                    <View style={[styles.checkbox, checked && styles.checkboxActive]}>
                      {checked && <Text style={styles.checkmark}>✓</Text>}
                    </View>
                    <Text style={styles.optionText}>{item.label}</Text>
                  </TouchableOpacity>
                );
              }}
              ListEmptyComponent={<Text style={styles.empty}>No results</Text>}
            />

            {allowCustom && search.trim() && (
              <TouchableOpacity style={styles.customRow} onPress={handleCustom}>
                <Text style={styles.customText}>+ Add "{search.trim()}"</Text>
              </TouchableOpacity>
            )}

            <TouchableOpacity style={styles.doneBtn} onPress={close}>
              <Text style={styles.doneText}>Done</Text>
            </TouchableOpacity>
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
  fieldDisabled: { backgroundColor: '#f5f5f5' },
  fieldText: { fontSize: 15, color: '#000', flex: 1, marginRight: 8 },
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
    maxHeight: 420,
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
  option: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    paddingVertical: 12,
    paddingHorizontal: 8,
    borderBottomWidth: 1,
    borderBottomColor: '#f2f2f2',
  },
  checkbox: {
    width: 20,
    height: 20,
    borderRadius: 5,
    borderWidth: 1.5,
    borderColor: '#ccc',
    alignItems: 'center',
    justifyContent: 'center',
  },
  checkboxActive: { borderColor: '#D20236', backgroundColor: '#D20236' },
  checkmark: { color: '#fff', fontSize: 13, fontWeight: '700' },
  optionText: { fontSize: 15, color: '#333', flex: 1 },
  customRow: { paddingVertical: 12, paddingHorizontal: 8, borderTopWidth: 1, borderTopColor: '#eee' },
  customText: { fontSize: 15, color: '#D20236', fontFamily: 'Outfit-SemiBold' },
  empty: { textAlign: 'center', color: '#999', paddingVertical: 20 },
  clear: { fontSize: 15, color: '#999', fontFamily: 'Outfit-SemiBold' },
  doneBtn: {
    backgroundColor: '#D20236',
    borderRadius: 8,
    paddingVertical: 12,
    alignItems: 'center',
    marginTop: 8,
  },
  doneText: { fontSize: 15, fontFamily: 'Outfit-Bold', color: '#fff' },
});
