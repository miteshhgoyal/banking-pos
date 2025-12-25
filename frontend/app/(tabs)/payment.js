// app/(tabs)/payment.js
import React, { useState, useEffect } from 'react';
import {
    View,
    Text,
    TextInput,
    TouchableOpacity,
    ScrollView,
    ActivityIndicator,
    Alert
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useRouter, useLocalSearchParams } from 'expo-router';
import * as Location from 'expo-location';
import * as Device from 'expo-device';
import api from '@/services/api';

export default function PaymentScreen() {
    const router = useRouter();
    const { customerId } = useLocalSearchParams();

    const [customer, setCustomer] = useState(null);
    const [loading, setLoading] = useState(true);
    const [submitting, setSubmitting] = useState(false);
    const [amount, setAmount] = useState('');
    const [paymentMode, setPaymentMode] = useState('cash');
    const [remarks, setRemarks] = useState('');

    const paymentModes = [
        { id: 'cash', label: 'Cash', icon: 'cash' },
        { id: 'upi', label: 'UPI', icon: 'phone-portrait' },
        { id: 'qr', label: 'QR Code', icon: 'qr-code' },
        { id: 'card', label: 'Card', icon: 'card' }
    ];

    useEffect(() => {
        fetchCustomer();
    }, []);

    const fetchCustomer = async () => {
        try {
            const response = await api.get(`/customers/${customerId}`);
            if (response.data.success) {
                setCustomer(response.data.data.customer);
                setAmount(response.data.data.customer.loanDetails.emiAmount.toString());
            }
        } catch (error) {
            console.error('Fetch customer error:', error);
            Alert.alert('Error', 'Failed to load customer details');
        } finally {
            setLoading(false);
        }
    };

    const handleSubmitPayment = async () => {
        if (!amount || parseFloat(amount) <= 0) {
            Alert.alert('Error', 'Please enter a valid amount');
            return;
        }

        try {
            setSubmitting(true);

            let location = { latitude: 0, longitude: 0 };
            const { status } = await Location.requestForegroundPermissionsAsync();
            if (status === 'granted') {
                const loc = await Location.getCurrentPositionAsync({});
                location = { latitude: loc.coords.latitude, longitude: loc.coords.longitude };
            }

            const deviceId = Device.osInternalBuildId || Device.modelId || 'unknown_device';

            const response = await api.post('/collections', {
                customerId: customer._id,
                collectionAmount: parseFloat(amount),
                paymentMode,
                latitude: location.latitude,
                longitude: location.longitude,
                deviceId,
                remarks
            });

            if (response.data.success) {
                Alert.alert('Success', 'Payment recorded successfully!', [
                    {
                        text: 'View Receipt',
                        onPress: () => router.replace({
                            pathname: '/(tabs)/receipt',
                            params: { collectionId: response.data.data.collection._id }
                        })
                    },
                    {
                        text: 'Done',
                        onPress: () => router.back()
                    }
                ]);
            }
        } catch (error) {
            console.error('Payment error:', error);
            Alert.alert('Error', error.response?.data?.message || 'Failed to record payment');
        } finally {
            setSubmitting(false);
        }
    };

    if (loading) {
        return (
            <View style={{ flex: 1, backgroundColor: '#FFFFFF', alignItems: 'center', justifyContent: 'center' }}>
                <ActivityIndicator size="large" color="#1F8A70" />
            </View>
        );
    }

    return (
        <SafeAreaView style={{ flex: 1, backgroundColor: '#FFFFFF' }} edges={['top']}>
            <ScrollView showsVerticalScrollIndicator={false}>
                {/* Header */}
                <View style={{ flexDirection: 'row', alignItems: 'center', paddingHorizontal: 20, paddingVertical: 16, borderBottomWidth: 1, borderBottomColor: '#E5E7EB' }}>
                    <TouchableOpacity onPress={() => router.back()}>
                        <Ionicons name="arrow-back" size={24} color="#1F2937" />
                    </TouchableOpacity>
                    <Text style={{ fontSize: 20, fontWeight: 'bold', color: '#1F2937', marginLeft: 16 }}>
                        Record Payment
                    </Text>
                </View>

                {/* Customer Details Card */}
                <View style={{ margin: 20, backgroundColor: '#F9FAFB', borderRadius: 12, padding: 16 }}>
                    <Text style={{ fontSize: 16, fontWeight: 'bold', color: '#1F2937', marginBottom: 12 }}>
                        {customer?.name}
                    </Text>
                    <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginBottom: 8 }}>
                        <Text style={{ fontSize: 14, color: '#6B7280' }}>Loan ID:</Text>
                        <Text style={{ fontSize: 14, fontWeight: '600', color: '#1F2937' }}>{customer?.loanId}</Text>
                    </View>
                    <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginBottom: 8 }}>
                        <Text style={{ fontSize: 14, color: '#6B7280' }}>Outstanding:</Text>
                        <Text style={{ fontSize: 14, fontWeight: 'bold', color: '#EF4444' }}>
                            ₹{customer?.outstandingAmount?.toLocaleString()}
                        </Text>
                    </View>
                    <View style={{ flexDirection: 'row', justifyContent: 'space-between' }}>
                        <Text style={{ fontSize: 14, color: '#6B7280' }}>EMI Amount:</Text>
                        <Text style={{ fontSize: 14, fontWeight: 'bold', color: '#1F8A70' }}>
                            ₹{customer?.loanDetails?.emiAmount?.toLocaleString()}
                        </Text>
                    </View>
                </View>

                {/* Amount Input */}
                <View style={{ paddingHorizontal: 20, marginBottom: 20 }}>
                    <Text style={{ fontSize: 14, fontWeight: '600', color: '#374151', marginBottom: 8 }}>
                        Collection Amount
                    </Text>
                    <View style={{ flexDirection: 'row', alignItems: 'center', backgroundColor: '#F9FAFB', borderRadius: 12, borderWidth: 1, borderColor: '#E5E7EB', paddingHorizontal: 16 }}>
                        <Text style={{ fontSize: 24, fontWeight: 'bold', color: '#1F2937' }}>₹</Text>
                        <TextInput
                            style={{ flex: 1, height: 56, marginLeft: 8, color: '#1F2937', fontSize: 24, fontWeight: 'bold' }}
                            placeholder="0"
                            placeholderTextColor="#9CA3AF"
                            value={amount}
                            onChangeText={setAmount}
                            keyboardType="numeric"
                            editable={!submitting}
                        />
                    </View>
                </View>

                {/* Payment Mode Selection */}
                <View style={{ paddingHorizontal: 20, marginBottom: 20 }}>
                    <Text style={{ fontSize: 14, fontWeight: '600', color: '#374151', marginBottom: 12 }}>
                        Payment Mode
                    </Text>
                    <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 12 }}>
                        {paymentModes.map((mode) => (
                            <TouchableOpacity
                                key={mode.id}
                                style={{
                                    flex: 1,
                                    minWidth: '47%',
                                    flexDirection: 'row',
                                    alignItems: 'center',
                                    backgroundColor: paymentMode === mode.id ? '#1F8A70' : '#F9FAFB',
                                    borderRadius: 12,
                                    padding: 16,
                                    borderWidth: 1,
                                    borderColor: paymentMode === mode.id ? '#1F8A70' : '#E5E7EB'
                                }}
                                onPress={() => setPaymentMode(mode.id)}
                                disabled={submitting}
                            >
                                <Ionicons
                                    name={mode.icon}
                                    size={24}
                                    color={paymentMode === mode.id ? '#FFFFFF' : '#6B7280'}
                                />
                                <Text style={{
                                    fontSize: 14,
                                    fontWeight: '600',
                                    color: paymentMode === mode.id ? '#FFFFFF' : '#1F2937',
                                    marginLeft: 8
                                }}>
                                    {mode.label}
                                </Text>
                            </TouchableOpacity>
                        ))}
                    </View>
                </View>

                {/* Remarks */}
                <View style={{ paddingHorizontal: 20, marginBottom: 20 }}>
                    <Text style={{ fontSize: 14, fontWeight: '600', color: '#374151', marginBottom: 8 }}>
                        Remarks (Optional)
                    </Text>
                    <TextInput
                        style={{ backgroundColor: '#F9FAFB', borderRadius: 12, borderWidth: 1, borderColor: '#E5E7EB', padding: 16, color: '#1F2937', fontSize: 16, minHeight: 80, textAlignVertical: 'top' }}
                        placeholder="Add any notes..."
                        placeholderTextColor="#9CA3AF"
                        value={remarks}
                        onChangeText={setRemarks}
                        multiline
                        editable={!submitting}
                    />
                </View>

                {/* Submit Button */}
                <View style={{ paddingHorizontal: 20, paddingBottom: 20 }}>
                    <TouchableOpacity
                        style={{ backgroundColor: '#1F8A70', borderRadius: 12, height: 56, alignItems: 'center', justifyContent: 'center', shadowColor: '#1F8A70', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.3, shadowRadius: 8, elevation: 8 }}
                        onPress={handleSubmitPayment}
                        disabled={submitting}
                    >
                        {submitting ? (
                            <ActivityIndicator color="#FFFFFF" />
                        ) : (
                            <Text style={{ color: '#FFFFFF', fontSize: 18, fontWeight: 'bold' }}>
                                Record Payment
                            </Text>
                        )}
                    </TouchableOpacity>
                </View>
            </ScrollView>
        </SafeAreaView>
    );
}
