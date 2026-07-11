import React, { useState } from 'react';
import {
  View, Text, TextInput, TouchableOpacity, StyleSheet, ActivityIndicator,
  ScrollView, KeyboardAvoidingView, Platform,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { ArrowLeft, Check } from 'lucide-react-native';
import { submitSupportRequest } from '../../api/settings';

type Step = 'FORM' | 'SUCCESS';

export default function ContactSupportScreen({ navigation }: any) {
  const [step, setStep] = useState<Step>('FORM');
  const [subject, setSubject] = useState('');
  const [message, setMessage] = useState('');
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');

  const canSubmit = message.trim().length >= 10 && !loading;

  const handleSubmit = async () => {
    setErrorMsg('');
    if (message.trim().length < 10) {
      setErrorMsg('Please describe your issue in at least 10 characters');
      return;
    }
    try {
      setLoading(true);
      await submitSupportRequest({ subject: subject.trim() || undefined, message: message.trim() });
      setStep('SUCCESS');
    } catch (err: any) {
      setErrorMsg(err?.response?.data?.message || 'Could not submit your request');
    } finally {
      setLoading(false);
    }
  };

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()}>
          <ArrowLeft color="#000" size={24} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Contact Support</Text>
        <View style={{ width: 24 }} />
      </View>

      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        keyboardVerticalOffset={Platform.OS === 'ios' ? 0 : 20}
      >
        {step === 'SUCCESS' ? (
          <View style={styles.successWrap}>
            <View style={styles.successIcon}>
              <Check color="#1a7f37" size={32} />
            </View>
            <Text style={styles.successTitle}>Request Submitted</Text>
            <Text style={styles.successSubtitle}>
              Thanks for reaching out. Our support team will get back to you shortly.
            </Text>
            <TouchableOpacity style={styles.doneBtn} onPress={() => navigation.goBack()}>
              <Text style={styles.doneBtnText}>Done</Text>
            </TouchableOpacity>
          </View>
        ) : (
          <ScrollView
            contentContainerStyle={styles.content}
            keyboardShouldPersistTaps="handled"
            showsVerticalScrollIndicator={false}
          >
            <Text style={styles.label}>Subject (optional)</Text>
            <TextInput
              style={styles.input}
              placeholder="Brief summary of your issue"
              placeholderTextColor="#999"
              value={subject}
              onChangeText={setSubject}
            />

            <Text style={styles.label}>Message</Text>
            <TextInput
              style={styles.textArea}
              placeholder="Describe your issue in detail..."
              placeholderTextColor="#999"
              value={message}
              onChangeText={setMessage}
              multiline
              numberOfLines={6}
            />

            {!!errorMsg && <Text style={styles.errorText}>{errorMsg}</Text>}

            <TouchableOpacity
              style={[styles.submitBtn, !canSubmit && styles.submitBtnDisabled]}
              onPress={handleSubmit}
              disabled={!canSubmit}
            >
              {loading ? (
                <ActivityIndicator color="#fff" />
              ) : (
                <Text style={styles.submitText}>Submit</Text>
              )}
            </TouchableOpacity>
          </ScrollView>
        )}
      </KeyboardAvoidingView>
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
  content: { padding: 20 },
  label: { fontSize: 13, fontWeight: '600', color: '#333', marginBottom: 8, marginTop: 12 },
  input: {
    borderWidth: 1, borderColor: '#e0e0e0', borderRadius: 10,
    paddingHorizontal: 14, paddingVertical: 13, fontSize: 14, color: '#000',
  },
  textArea: {
    borderWidth: 1, borderColor: '#e0e0e0', borderRadius: 10, padding: 12,
    fontSize: 14, color: '#000', textAlignVertical: 'top', minHeight: 130,
  },
  errorText: { fontSize: 13, color: '#D20236', marginTop: 12, fontWeight: '500' },
  submitBtn: {
    backgroundColor: '#D20236', borderRadius: 10, paddingVertical: 15,
    alignItems: 'center', marginTop: 24,
  },
  submitBtnDisabled: { backgroundColor: '#e9a9b6' },
  submitText: { fontSize: 15, fontWeight: '700', color: '#fff' },
  successWrap: { flex: 1, alignItems: 'center', justifyContent: 'center', paddingHorizontal: 30 },
  successIcon: {
    width: 64, height: 64, borderRadius: 32, backgroundColor: '#eafaf0',
    alignItems: 'center', justifyContent: 'center', marginBottom: 20,
  },
  successTitle: { fontSize: 17, fontWeight: '700', color: '#000', textAlign: 'center', marginBottom: 10 },
  successSubtitle: { fontSize: 13, color: '#777', textAlign: 'center', lineHeight: 19, marginBottom: 28 },
  doneBtn: {
    backgroundColor: '#D20236', borderRadius: 10, paddingVertical: 14, paddingHorizontal: 50,
  },
  doneBtnText: { fontSize: 15, fontWeight: '700', color: '#fff' },
});