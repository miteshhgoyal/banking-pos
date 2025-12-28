import React, { useState, useCallback } from 'react';
import {
    View,
    Text,
    TextInput,
    TouchableOpacity,
    ScrollView,
    ActivityIndicator,
    Alert,
    KeyboardAvoidingView,
    Platform,
    Image
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { useFocusEffect } from '@react-navigation/native';
import * as Location from 'expo-location';
import * as Device from 'expo-device';
import api from '@/services/api';
import Gradient from '@/components/Gradient';

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
        { id: 'cash', label: 'Cash', icon: 'cash', color: 'green' },
        { id: 'upi', label: 'UPI', icon: 'phone-portrait', color: 'blue' },
        { id: 'qr', label: 'QR Code', icon: 'qr-code', color: 'purple' },
        { id: 'card', label: 'Card', icon: 'card', color: 'amber' }
    ];

    // Use useFocusEffect instead of useEffect
    useFocusEffect(
        useCallback(() => {
            if (customerId) {
                fetchCustomer();
            }
        }, [customerId])
    );

    const fetchCustomer = async () => {
        try {
            setLoading(true);
            const response = await api.get(`/customers/${customerId}`);
            if (response.data.success) {
                setCustomer(response.data.data.customer);
                setAmount(response.data.data.customer.loanDetails?.emiAmount?.toString() || '');
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
            Alert.alert('Validation Error', 'Please enter a valid amount greater than 0');
            return;
        }

        try {
            setSubmitting(true);

            // Improved location handling with timeout and fallback
            let location = { latitude: 0, longitude: 0 };
            try {
                const { status } = await Location.requestForegroundPermissionsAsync();
                if (status === 'granted') {
                    // Add timeout to prevent indefinite waiting
                    const locationPromise = Location.getCurrentPositionAsync({
                        accuracy: Location.Accuracy.Balanced,
                        maximumAge: 10000
                    });

                    const timeoutPromise = new Promise((_, reject) =>
                        setTimeout(() => reject(new Error('Location timeout')), 8000)
                    );

                    try {
                        const loc = await Promise.race([locationPromise, timeoutPromise]);
                        location = {
                            latitude: loc.coords.latitude,
                            longitude: loc.coords.longitude
                        };
                    } catch (locationError) {
                        console.warn('Location fetch failed, using last known position');
                        const lastLoc = await Location.getLastKnownPositionAsync();
                        if (lastLoc) {
                            location = {
                                latitude: lastLoc.coords.latitude,
                                longitude: lastLoc.coords.longitude
                            };
                        }
                    }
                }
            } catch (permissionError) {
                console.warn('Location permission error:', permissionError);
                // Continue without location
            }

            const deviceId = Device.osInternalBuildId || Device.modelId || 'unknown_device';

            const response = await api.post('/collections', {
                customerId: customer._id,
                collectionAmount: parseFloat(amount),
                paymentMode,
                latitude: location.latitude,
                longitude: location.longitude,
                deviceId,
                remarks: remarks.trim()
            });

            if (response.data.success) {
                Alert.alert(
                    'Success',
                    `Payment of ₹${parseFloat(amount).toLocaleString('en-IN')} recorded successfully!`,
                    [
                        {
                            text: 'View Receipt',
                            onPress: () => router.replace({
                                pathname: '/(tabs)/receipt',
                                params: { collectionId: response.data.data.collection._id }
                            })
                        },
                        {
                            text: 'Done',
                            onPress: () => router.back(),
                            style: 'cancel'
                        }
                    ]
                );
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
            <View className="flex-1 bg-gray-50 items-center justify-center">
                <ActivityIndicator size="large" color="#1F8A70" />
                <Text className="mt-4 text-gray-600 text-base font-medium">Loading details...</Text>
            </View>
        );
    }

    return (
        <SafeAreaView className="flex-1 bg-gray-50" edges={['top']}>
            {/* Background Watermark */}
            <Image
                source={require('@/assets/ph-logo.png')}
                className="absolute bottom-20 right-8 w-32 h-32 opacity-5"
                style={{ zIndex: 0 }}
                resizeMode="contain"
            />

            <KeyboardAvoidingView
                behavior={Platform.OS === 'ios' ? 'padding' : undefined}
                className="flex-1"
                keyboardVerticalOffset={Platform.OS === 'ios' ? 0 : 20}
            >
                {/* Modern Header */}
                <View className="flex-row items-center px-6 py-4 bg-white shadow-sm">
                    <TouchableOpacity
                        className="w-10 h-10 rounded-full bg-gray-100 items-center justify-center mr-4"
                        onPress={() => router.back()}
                        disabled={submitting}
                        activeOpacity={0.7}
                    >
                        <Ionicons name="arrow-back" size={22} color="#1F2937" />
                    </TouchableOpacity>
                    <View className="flex-1">
                        <Text className="text-xl font-bold text-gray-900">
                            Record Payment
                        </Text>
                        <Text className="text-xs text-gray-500 mt-0.5">
                            Collect customer payment
                        </Text>
                    </View>
                </View>

                <ScrollView
                    showsVerticalScrollIndicator={false}
                    keyboardShouldPersistTaps="handled"
                    contentContainerStyle={{ paddingBottom: 100 }}
                >
                    {/* Customer Details Card with Gradient */}
                    <View className="mx-5 mt-5 rounded-3xl overflow-hidden shadow-2xl shadow-teal-600/20">
                        <Gradient type="teal">
                            <View className="p-6">
                                <View className="flex-row items-center mb-4">
                                    <View className="w-12 h-12 rounded-xl bg-white/20 items-center justify-center mr-3">
                                        <Ionicons name="person" size={24} color="#FFFFFF" />
                                    </View>
                                    <View className="flex-1">
                                        <Text className="text-lg font-bold text-white">
                                            {customer?.name}
                                        </Text>
                                        <Text className="text-xs text-white/80 mt-0.5">
                                            ID: {customer?.loanId}
                                        </Text>
                                    </View>
                                </View>

                                <View className="bg-white/10 rounded-xl p-4">
                                    <View className="flex-row justify-between mb-3">
                                        <Text className="text-xs text-white/80 font-medium">Outstanding</Text>
                                        <Text className="text-lg font-bold text-white">
                                            ₹{customer?.outstandingAmount?.toLocaleString('en-IN') || '0'}
                                        </Text>
                                    </View>
                                    <View className="h-px bg-white/20 my-2" />
                                    <View className="flex-row justify-between">
                                        <Text className="text-xs text-white/80 font-medium">EMI Amount</Text>
                                        <Text className="text-lg font-bold text-white">
                                            ₹{customer?.loanDetails?.emiAmount?.toLocaleString('en-IN') || '0'}
                                        </Text>
                                    </View>
                                </View>
                            </View>
                        </Gradient>
                    </View>

                    {/* Amount Input */}
                    <View className="px-5 mt-6 mb-5">
                        <View className="flex-row items-center mb-3">
                            <Ionicons name="cash-outline" size={20} color="#1F8A70" />
                            <Text className="text-sm font-semibold text-gray-700 ml-2">
                                Collection Amount <Text className="text-red-500">*</Text>
                            </Text>
                        </View>
                        <View className="flex-row items-center bg-white rounded-2xl border-2 border-teal-200 px-5 shadow-lg shadow-gray-200/50">
                            <Text className="text-3xl font-black text-teal-600">₹</Text>
                            <TextInput
                                className="flex-1 h-16 ml-3 text-gray-900 text-3xl font-black"
                                placeholder="0"
                                placeholderTextColor="#D1D5DB"
                                value={amount}
                                onChangeText={setAmount}
                                keyboardType="numeric"
                                editable={!submitting}
                            />
                        </View>
                    </View>

                    {/* Payment Mode Selection */}
                    <View className="px-5 mb-5">
                        <View className="flex-row items-center mb-3">
                            <Ionicons name="wallet-outline" size={20} color="#1F8A70" />
                            <Text className="text-sm font-semibold text-gray-700 ml-2">
                                Payment Mode <Text className="text-red-500">*</Text>
                            </Text>
                        </View>
                        <View className="flex-row flex-wrap -mx-1.5">
                            {paymentModes.map((mode) => (
                                <View key={mode.id} className="w-1/2 px-1.5 mb-3">
                                    <TouchableOpacity
                                        className={`flex-row items-center rounded-2xl p-4 border-2 ${paymentMode === mode.id
                                            ? 'bg-teal-600 border-teal-500 shadow-lg shadow-teal-600/30'
                                            : 'bg-white border-gray-200 shadow-sm'
                                            }`}
                                        onPress={() => setPaymentMode(mode.id)}
                                        disabled={submitting}
                                        activeOpacity={0.7}
                                    >
                                        <View className={`w-10 h-10 rounded-xl items-center justify-center ${paymentMode === mode.id ? 'bg-white/20' : 'bg-gray-100'
                                            }`}>
                                            <Ionicons
                                                name={mode.icon}
                                                size={22}
                                                color={paymentMode === mode.id ? '#FFFFFF' : '#6B7280'}
                                            />
                                        </View>
                                        <Text className={`text-sm font-bold ml-3 ${paymentMode === mode.id ? 'text-white' : 'text-gray-900'
                                            }`}>
                                            {mode.label}
                                        </Text>
                                    </TouchableOpacity>
                                </View>
                            ))}
                        </View>
                    </View>

                    {/* Remarks */}
                    <View className="px-5 mb-5">
                        <View className="flex-row items-center mb-3">
                            <Ionicons name="document-text-outline" size={20} color="#1F8A70" />
                            <Text className="text-sm font-semibold text-gray-700 ml-2">
                                Remarks (Optional)
                            </Text>
                        </View>
                        <View className="bg-white rounded-2xl border border-gray-200 shadow-sm">
                            <TextInput
                                className="p-4 text-gray-900 text-base min-h-[100px]"
                                style={{ textAlignVertical: 'top' }}
                                placeholder="Add any notes or comments..."
                                placeholderTextColor="#9CA3AF"
                                value={remarks}
                                onChangeText={setRemarks}
                                multiline
                                editable={!submitting}
                            />
                        </View>
                    </View>

                    {/* Submit Button */}
                    <View className="px-5 mt-2">
                        <TouchableOpacity
                            className="bg-teal-600 rounded-2xl h-16 items-center justify-center shadow-2xl shadow-teal-600/40"
                            onPress={handleSubmitPayment}
                            disabled={submitting}
                            activeOpacity={0.8}
                        >
                            {submitting ? (
                                <View className="flex-row items-center">
                                    <ActivityIndicator color="#FFFFFF" />
                                    <Text className="text-white text-base font-bold ml-3">Processing...</Text>
                                </View>
                            ) : (
                                <View className="flex-row items-center">
                                    <Ionicons name="checkmark-circle" size={28} color="#FFFFFF" />
                                    <Text className="text-white text-lg font-bold ml-2">
                                        Record Payment
                                    </Text>
                                </View>
                            )}
                        </TouchableOpacity>
                    </View>
                </ScrollView>
            </KeyboardAvoidingView>
        </SafeAreaView>
    );
}
