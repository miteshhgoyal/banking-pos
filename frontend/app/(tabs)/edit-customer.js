import React, { useState, useEffect } from 'react';
import {
    View,
    Text,
    TextInput,
    TouchableOpacity,
    ScrollView,
    ActivityIndicator,
    Alert,
    KeyboardAvoidingView,
    Platform
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useRouter, useLocalSearchParams } from 'expo-router';
import api from '@/services/api';

export default function EditCustomerScreen() {
    const router = useRouter();
    const { customerId } = useLocalSearchParams();

    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [formData, setFormData] = useState({
        name: '',
        mobile: '',
        aadhaar: '',
        street: '',
        city: '',
        state: '',
        pincode: '',
        loanAmount: '',
        tenure: '',
        interestRate: '',
        emiAmount: '',
        emiFrequency: 'monthly',
        status: 'active'
    });

    useEffect(() => {
        fetchCustomer();
    }, []);

    const fetchCustomer = async () => {
        try {
            const response = await api.get(`/customers/${customerId}`);
            if (response.data.success) {
                const customer = response.data.data.customer;
                setFormData({
                    name: customer.name,
                    mobile: customer.mobile,
                    aadhaar: customer.aadhaar,
                    street: customer.address?.street || '',
                    city: customer.address?.city || '',
                    state: customer.address?.state || '',
                    pincode: customer.address?.pincode || '',
                    loanAmount: customer.loanDetails?.loanAmount?.toString() || '',
                    tenure: customer.loanDetails?.tenure?.toString() || '',
                    interestRate: customer.loanDetails?.interestRate?.toString() || '',
                    emiAmount: customer.loanDetails?.emiAmount?.toString() || '',
                    emiFrequency: customer.loanDetails?.emiFrequency || 'monthly',
                    status: customer.status
                });
            }
        } catch (error) {
            console.error('Fetch customer error:', error);
            Alert.alert('Error', 'Failed to load customer details');
        } finally {
            setLoading(false);
        }
    };

    const updateField = (field, value) => {
        setFormData(prev => ({ ...prev, [field]: value }));
    };

    const handleSubmit = async () => {
        // Validation
        if (!formData.name || !formData.mobile || !formData.aadhaar) {
            Alert.alert('Error', 'Please fill all required fields');
            return;
        }

        if (!/^[0-9]{10}$/.test(formData.mobile)) {
            Alert.alert('Error', 'Mobile must be 10 digits');
            return;
        }

        if (!/^[0-9]{12}$/.test(formData.aadhaar)) {
            Alert.alert('Error', 'Aadhaar must be 12 digits');
            return;
        }

        try {
            setSaving(true);

            const response = await api.put(`/customers/${customerId}`, {
                name: formData.name,
                mobile: formData.mobile,
                aadhaar: formData.aadhaar,
                address: {
                    street: formData.street,
                    city: formData.city,
                    state: formData.state,
                    pincode: formData.pincode
                },
                loanAmount: parseFloat(formData.loanAmount),
                tenure: parseInt(formData.tenure),
                interestRate: parseFloat(formData.interestRate),
                emiAmount: parseFloat(formData.emiAmount),
                emiFrequency: formData.emiFrequency,
                status: formData.status
            });

            if (response.data.success) {
                Alert.alert('Success', 'Customer updated successfully!', [
                    { text: 'OK', onPress: () => router.back() }
                ]);
            }
        } catch (error) {
            console.error('Update customer error:', error);
            Alert.alert('Error', error.response?.data?.message || 'Failed to update customer');
        } finally {
            setSaving(false);
        }
    };

    const InputField = ({ label, value, onChangeText, placeholder, keyboardType = 'default', required = false, maxLength, editable = true }) => (
        <View style={{ marginBottom: 16 }}>
            <Text style={{ fontSize: 14, fontWeight: '600', color: '#374151', marginBottom: 8 }}>
                {label} {required && <Text style={{ color: '#EF4444' }}>*</Text>}
            </Text>
            <TextInput
                style={{
                    backgroundColor: editable ? '#F9FAFB' : '#F3F4F6',
                    borderRadius: 12,
                    borderWidth: 1,
                    borderColor: '#E5E7EB',
                    paddingHorizontal: 16,
                    height: 48,
                    color: editable ? '#1F2937' : '#9CA3AF',
                    fontSize: 16
                }}
                placeholder={placeholder}
                placeholderTextColor="#9CA3AF"
                value={value}
                onChangeText={onChangeText}
                keyboardType={keyboardType}
                editable={editable && !saving}
                maxLength={maxLength}
            />
        </View>
    );

    if (loading) {
        return (
            <View style={{ flex: 1, backgroundColor: '#FFFFFF', alignItems: 'center', justifyContent: 'center' }}>
                <ActivityIndicator size="large" color="#1F8A70" />
            </View>
        );
    }

    return (
        <SafeAreaView style={{ flex: 1, backgroundColor: '#FFFFFF' }} edges={['top']}>
            <KeyboardAvoidingView
                behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
                style={{ flex: 1 }}
            >
                {/* Header */}
                <View style={{ flexDirection: 'row', alignItems: 'center', paddingHorizontal: 20, paddingVertical: 16, borderBottomWidth: 1, borderBottomColor: '#E5E7EB' }}>
                    <TouchableOpacity onPress={() => router.back()}>
                        <Ionicons name="arrow-back" size={24} color="#1F2937" />
                    </TouchableOpacity>
                    <Text style={{ fontSize: 20, fontWeight: 'bold', color: '#1F2937', marginLeft: 16 }}>
                        Edit Customer
                    </Text>
                </View>

                <ScrollView
                    showsVerticalScrollIndicator={false}
                    contentContainerStyle={{ padding: 20 }}
                >
                    {/* Basic Information */}
                    <Text style={{ fontSize: 16, fontWeight: 'bold', color: '#1F2937', marginBottom: 16 }}>
                        Basic Information
                    </Text>

                    <InputField
                        label="Customer Name"
                        value={formData.name}
                        onChangeText={(v) => updateField('name', v)}
                        placeholder="Full name"
                        required
                    />

                    <InputField
                        label="Mobile Number"
                        value={formData.mobile}
                        onChangeText={(v) => updateField('mobile', v)}
                        placeholder="10-digit mobile"
                        keyboardType="phone-pad"
                        maxLength={10}
                        required
                    />

                    <InputField
                        label="Aadhaar Number"
                        value={formData.aadhaar}
                        onChangeText={(v) => updateField('aadhaar', v)}
                        placeholder="12-digit aadhaar"
                        keyboardType="number-pad"
                        maxLength={12}
                        required
                    />

                    {/* Address */}
                    <Text style={{ fontSize: 16, fontWeight: 'bold', color: '#1F2937', marginTop: 16, marginBottom: 16 }}>
                        Address
                    </Text>

                    <InputField
                        label="Street"
                        value={formData.street}
                        onChangeText={(v) => updateField('street', v)}
                        placeholder="Street address"
                    />

                    <View style={{ flexDirection: 'row', gap: 12 }}>
                        <View style={{ flex: 1 }}>
                            <InputField
                                label="City"
                                value={formData.city}
                                onChangeText={(v) => updateField('city', v)}
                                placeholder="City"
                            />
                        </View>
                        <View style={{ flex: 1 }}>
                            <InputField
                                label="State"
                                value={formData.state}
                                onChangeText={(v) => updateField('state', v)}
                                placeholder="State"
                            />
                        </View>
                    </View>

                    <InputField
                        label="Pincode"
                        value={formData.pincode}
                        onChangeText={(v) => updateField('pincode', v)}
                        placeholder="6-digit pincode"
                        keyboardType="number-pad"
                        maxLength={6}
                    />

                    {/* Loan Details */}
                    <Text style={{ fontSize: 16, fontWeight: 'bold', color: '#1F2937', marginTop: 16, marginBottom: 16 }}>
                        Loan Details
                    </Text>

                    <InputField
                        label="Loan Amount"
                        value={formData.loanAmount}
                        onChangeText={(v) => updateField('loanAmount', v)}
                        placeholder="Total loan amount"
                        keyboardType="numeric"
                        required
                    />

                    <InputField
                        label="Tenure (Months)"
                        value={formData.tenure}
                        onChangeText={(v) => updateField('tenure', v)}
                        placeholder="Number of months"
                        keyboardType="numeric"
                        required
                    />

                    <InputField
                        label="Interest Rate (%)"
                        value={formData.interestRate}
                        onChangeText={(v) => updateField('interestRate', v)}
                        placeholder="Annual interest rate"
                        keyboardType="numeric"
                        required
                    />

                    <InputField
                        label="EMI Amount"
                        value={formData.emiAmount}
                        onChangeText={(v) => updateField('emiAmount', v)}
                        placeholder="Monthly EMI amount"
                        keyboardType="numeric"
                        required
                    />

                    {/* EMI Frequency */}
                    <Text style={{ fontSize: 14, fontWeight: '600', color: '#374151', marginBottom: 8 }}>
                        EMI Frequency <Text style={{ color: '#EF4444' }}>*</Text>
                    </Text>
                    <View style={{ flexDirection: 'row', gap: 8, marginBottom: 16 }}>
                        {['daily', 'weekly', 'monthly'].map((freq) => (
                            <TouchableOpacity
                                key={freq}
                                style={{
                                    flex: 1,
                                    paddingVertical: 12,
                                    borderRadius: 12,
                                    backgroundColor: formData.emiFrequency === freq ? '#1F8A70' : '#F3F4F6',
                                    alignItems: 'center'
                                }}
                                onPress={() => updateField('emiFrequency', freq)}
                                disabled={saving}
                            >
                                <Text style={{
                                    fontSize: 14,
                                    fontWeight: '600',
                                    color: formData.emiFrequency === freq ? '#FFFFFF' : '#6B7280',
                                    textTransform: 'capitalize'
                                }}>
                                    {freq}
                                </Text>
                            </TouchableOpacity>
                        ))}
                    </View>

                    {/* Status */}
                    <Text style={{ fontSize: 14, fontWeight: '600', color: '#374151', marginBottom: 8, marginTop: 8 }}>
                        Status
                    </Text>
                    <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginBottom: 24 }}>
                        {['active', 'closed', 'defaulter', 'npa'].map((status) => (
                            <TouchableOpacity
                                key={status}
                                style={{
                                    paddingHorizontal: 16,
                                    paddingVertical: 12,
                                    borderRadius: 12,
                                    backgroundColor: formData.status === status ? '#1F8A70' : '#F3F4F6'
                                }}
                                onPress={() => updateField('status', status)}
                                disabled={saving}
                            >
                                <Text style={{
                                    fontSize: 14,
                                    fontWeight: '600',
                                    color: formData.status === status ? '#FFFFFF' : '#6B7280',
                                    textTransform: 'capitalize'
                                }}>
                                    {status}
                                </Text>
                            </TouchableOpacity>
                        ))}
                    </View>

                    {/* Submit Button */}
                    <TouchableOpacity
                        style={{
                            backgroundColor: '#1F8A70',
                            borderRadius: 12,
                            height: 56,
                            alignItems: 'center',
                            justifyContent: 'center',
                            marginTop: 8,
                            marginBottom: 20
                        }}
                        onPress={handleSubmit}
                        disabled={saving}
                    >
                        {saving ? (
                            <ActivityIndicator color="#FFFFFF" />
                        ) : (
                            <Text style={{ color: '#FFFFFF', fontSize: 18, fontWeight: 'bold' }}>
                                Save Changes
                            </Text>
                        )}
                    </TouchableOpacity>
                </ScrollView>
            </KeyboardAvoidingView>
        </SafeAreaView>
    );
}