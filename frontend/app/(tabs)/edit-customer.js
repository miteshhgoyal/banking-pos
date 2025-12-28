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
import api from '@/services/api';

// InputField Component
const InputField = ({
    label,
    value,
    onChangeText,
    placeholder,
    keyboardType = 'default',
    required = false,
    maxLength,
    editable = true,
    saving = false,
    icon
}) => (
    <View className="mb-4">
        <Text className="text-sm font-semibold text-gray-700 mb-2">
            {label} {required && <Text className="text-red-500">*</Text>}
        </Text>
        <View className={`flex-row items-center rounded-2xl border ${editable ? 'border-gray-200 bg-gray-50' : 'border-gray-100 bg-gray-100'
            } px-4`}>
            {icon && (
                <View className="mr-3">
                    <Ionicons name={icon} size={20} color="#6B7280" />
                </View>
            )}
            <TextInput
                className={`flex-1 h-14 text-base ${editable ? 'text-gray-900' : 'text-gray-400'
                    }`}
                placeholder={placeholder}
                placeholderTextColor="#9CA3AF"
                value={value}
                onChangeText={onChangeText}
                keyboardType={keyboardType}
                editable={editable && !saving}
                maxLength={maxLength}
                returnKeyType="next"
            />
        </View>
    </View>
);

export default function EditCustomerScreen() {
    const router = useRouter();
    const { customerId } = useLocalSearchParams();

    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);

    // Form state
    const [name, setName] = useState('');
    const [mobile, setMobile] = useState('');
    const [aadhaar, setAadhaar] = useState('');
    const [street, setStreet] = useState('');
    const [city, setCity] = useState('');
    const [state, setState] = useState('');
    const [pincode, setPincode] = useState('');
    const [loanAmount, setLoanAmount] = useState('');
    const [tenure, setTenure] = useState('');
    const [interestRate, setInterestRate] = useState('');
    const [emiAmount, setEmiAmount] = useState('');
    const [emiFrequency, setEmiFrequency] = useState('monthly');
    const [status, setStatus] = useState('active');

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
                const customer = response.data.data.customer;
                setName(customer.name || '');
                setMobile(customer.mobile || '');
                setAadhaar(customer.aadhaar || '');
                setStreet(customer.address?.street || '');
                setCity(customer.address?.city || '');
                setState(customer.address?.state || '');
                setPincode(customer.address?.pincode || '');
                setLoanAmount(customer.loanDetails?.loanAmount?.toString() || '');
                setTenure(customer.loanDetails?.tenure?.toString() || '');
                setInterestRate(customer.loanDetails?.interestRate?.toString() || '');
                setEmiAmount(customer.loanDetails?.emiAmount?.toString() || '');
                setEmiFrequency(customer.loanDetails?.emiFrequency || 'monthly');
                setStatus(customer.status || 'active');
            }
        } catch (error) {
            console.error('Fetch customer error:', error);
            Alert.alert('Error', 'Failed to load customer details');
        } finally {
            setLoading(false);
        }
    };

    const handleSubmit = async () => {
        // Validation
        if (!name || !mobile || !aadhaar) {
            Alert.alert('Validation Error', 'Please fill all required fields');
            return;
        }

        if (!/^[0-9]{10}$/.test(mobile)) {
            Alert.alert('Validation Error', 'Mobile must be exactly 10 digits');
            return;
        }

        if (!/^[0-9]{12}$/.test(aadhaar)) {
            Alert.alert('Validation Error', 'Aadhaar must be exactly 12 digits');
            return;
        }

        if (!loanAmount || parseFloat(loanAmount) <= 0) {
            Alert.alert('Validation Error', 'Please enter a valid loan amount');
            return;
        }

        if (!tenure || parseInt(tenure) <= 0) {
            Alert.alert('Validation Error', 'Please enter a valid tenure');
            return;
        }

        if (!emiAmount || parseFloat(emiAmount) <= 0) {
            Alert.alert('Validation Error', 'Please enter a valid EMI amount');
            return;
        }

        try {
            setSaving(true);

            const response = await api.put(`/customers/${customerId}`, {
                name: name.trim(),
                mobile: mobile.trim(),
                aadhaar: aadhaar.trim(),
                address: {
                    street: street.trim(),
                    city: city.trim(),
                    state: state.trim(),
                    pincode: pincode.trim()
                },
                loanAmount: parseFloat(loanAmount),
                tenure: parseInt(tenure),
                interestRate: parseFloat(interestRate),
                emiAmount: parseFloat(emiAmount),
                emiFrequency,
                status
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
                        disabled={saving}
                        activeOpacity={0.7}
                    >
                        <Ionicons name="arrow-back" size={22} color="#1F2937" />
                    </TouchableOpacity>
                    <View className="flex-1">
                        <Text className="text-xl font-bold text-gray-900">
                            Edit Customer
                        </Text>
                        <Text className="text-xs text-gray-500 mt-0.5">
                            Update customer information
                        </Text>
                    </View>
                </View>

                <ScrollView
                    showsVerticalScrollIndicator={false}
                    keyboardShouldPersistTaps="handled"
                    contentContainerStyle={{ padding: 20, paddingBottom: 100 }}
                >
                    {/* Basic Information */}
                    <View className="mb-6">
                        <View className="flex-row items-center mb-4">
                            <View className="w-10 h-10 rounded-xl bg-teal-50 items-center justify-center mr-3">
                                <Ionicons name="person-circle-outline" size={24} color="#1F8A70" />
                            </View>
                            <Text className="text-lg font-bold text-gray-900">
                                Basic Information
                            </Text>
                        </View>
                        <View className="bg-white rounded-2xl p-5 shadow-lg shadow-gray-200/50 border border-gray-100">
                            <InputField
                                label="Customer Name"
                                value={name}
                                onChangeText={setName}
                                placeholder="Enter full name"
                                icon="person-outline"
                                required
                                saving={saving}
                            />

                            <InputField
                                label="Mobile Number"
                                value={mobile}
                                onChangeText={setMobile}
                                placeholder="Enter 10-digit mobile"
                                icon="call-outline"
                                keyboardType="phone-pad"
                                maxLength={10}
                                required
                                saving={saving}
                            />

                            <View className="mb-0">
                                <InputField
                                    label="Aadhaar Number"
                                    value={aadhaar}
                                    onChangeText={setAadhaar}
                                    placeholder="Enter 12-digit aadhaar"
                                    icon="card-outline"
                                    keyboardType="number-pad"
                                    maxLength={12}
                                    required
                                    saving={saving}
                                />
                            </View>
                        </View>
                    </View>

                    {/* Address */}
                    <View className="mb-6">
                        <View className="flex-row items-center mb-4">
                            <View className="w-10 h-10 rounded-xl bg-blue-50 items-center justify-center mr-3">
                                <Ionicons name="location-outline" size={24} color="#2196F3" />
                            </View>
                            <Text className="text-lg font-bold text-gray-900">
                                Address Details
                            </Text>
                        </View>
                        <View className="bg-white rounded-2xl p-5 shadow-lg shadow-gray-200/50 border border-gray-100">
                            <InputField
                                label="Street Address"
                                value={street}
                                onChangeText={setStreet}
                                placeholder="Enter street address"
                                icon="home-outline"
                                saving={saving}
                            />

                            <View className="flex-row mb-4">
                                <View className="flex-1 mr-2">
                                    <Text className="text-sm font-semibold text-gray-700 mb-2">
                                        City
                                    </Text>
                                    <View className="flex-row items-center rounded-2xl border border-gray-200 px-4 bg-gray-50">
                                        <TextInput
                                            className="flex-1 h-14 text-base text-gray-900"
                                            placeholder="City"
                                            placeholderTextColor="#9CA3AF"
                                            value={city}
                                            onChangeText={setCity}
                                            editable={!saving}
                                            returnKeyType="next"
                                        />
                                    </View>
                                </View>

                                <View className="flex-1 ml-2">
                                    <Text className="text-sm font-semibold text-gray-700 mb-2">
                                        State
                                    </Text>
                                    <View className="flex-row items-center rounded-2xl border border-gray-200 px-4 bg-gray-50">
                                        <TextInput
                                            className="flex-1 h-14 text-base text-gray-900"
                                            placeholder="State"
                                            placeholderTextColor="#9CA3AF"
                                            value={state}
                                            onChangeText={setState}
                                            editable={!saving}
                                            returnKeyType="next"
                                        />
                                    </View>
                                </View>
                            </View>

                            <View className="mb-0">
                                <InputField
                                    label="Pincode"
                                    value={pincode}
                                    onChangeText={setPincode}
                                    placeholder="Enter 6-digit pincode"
                                    icon="pin-outline"
                                    keyboardType="number-pad"
                                    maxLength={6}
                                    saving={saving}
                                />
                            </View>
                        </View>
                    </View>

                    {/* Loan Details */}
                    <View className="mb-6">
                        <View className="flex-row items-center mb-4">
                            <View className="w-10 h-10 rounded-xl bg-amber-50 items-center justify-center mr-3">
                                <Ionicons name="cash-outline" size={24} color="#FF9800" />
                            </View>
                            <Text className="text-lg font-bold text-gray-900">
                                Loan Details
                            </Text>
                        </View>
                        <View className="bg-white rounded-2xl p-5 shadow-lg shadow-gray-200/50 border border-gray-100">
                            <InputField
                                label="Loan Amount"
                                value={loanAmount}
                                onChangeText={setLoanAmount}
                                placeholder="Enter total loan amount"
                                icon="wallet-outline"
                                keyboardType="numeric"
                                required
                                saving={saving}
                            />

                            <View className="flex-row mb-4">
                                <View className="flex-1 mr-2">
                                    <Text className="text-sm font-semibold text-gray-700 mb-2">
                                        Tenure (Months) <Text className="text-red-500">*</Text>
                                    </Text>
                                    <View className="flex-row items-center rounded-2xl border border-gray-200 px-4 bg-gray-50">
                                        <Ionicons name="calendar-outline" size={20} color="#6B7280" />
                                        <TextInput
                                            className="flex-1 h-14 ml-3 text-base text-gray-900"
                                            placeholder="Months"
                                            placeholderTextColor="#9CA3AF"
                                            value={tenure}
                                            onChangeText={setTenure}
                                            keyboardType="numeric"
                                            editable={!saving}
                                            returnKeyType="next"
                                        />
                                    </View>
                                </View>

                                <View className="flex-1 ml-2">
                                    <Text className="text-sm font-semibold text-gray-700 mb-2">
                                        Interest Rate (%) <Text className="text-red-500">*</Text>
                                    </Text>
                                    <View className="flex-row items-center rounded-2xl border border-gray-200 px-4 bg-gray-50">
                                        <Ionicons name="trending-up-outline" size={20} color="#6B7280" />
                                        <TextInput
                                            className="flex-1 h-14 ml-3 text-base text-gray-900"
                                            placeholder="Rate"
                                            placeholderTextColor="#9CA3AF"
                                            value={interestRate}
                                            onChangeText={setInterestRate}
                                            keyboardType="numeric"
                                            editable={!saving}
                                            returnKeyType="next"
                                        />
                                    </View>
                                </View>
                            </View>

                            <InputField
                                label="EMI Amount"
                                value={emiAmount}
                                onChangeText={setEmiAmount}
                                placeholder="Enter EMI amount"
                                icon="calculator-outline"
                                keyboardType="numeric"
                                required
                                saving={saving}
                            />

                            {/* EMI Frequency */}
                            <View className="mb-0">
                                <Text className="text-sm font-semibold text-gray-700 mb-3">
                                    EMI Frequency <Text className="text-red-500">*</Text>
                                </Text>
                                <View className="flex-row">
                                    {['daily', 'weekly', 'monthly'].map((freq) => (
                                        <TouchableOpacity
                                            key={freq}
                                            className={`flex-1 ${freq !== 'monthly' ? 'mr-2' : ''} py-3.5 rounded-xl items-center border-2 ${emiFrequency === freq
                                                ? 'bg-teal-600 border-teal-500'
                                                : 'bg-gray-50 border-gray-200'
                                                }`}
                                            onPress={() => setEmiFrequency(freq)}
                                            disabled={saving}
                                            activeOpacity={0.7}
                                        >
                                            <Text className={`text-sm font-bold capitalize ${emiFrequency === freq ? 'text-white' : 'text-gray-700'
                                                }`}>
                                                {freq}
                                            </Text>
                                        </TouchableOpacity>
                                    ))}
                                </View>
                            </View>
                        </View>
                    </View>

                    {/* Status */}
                    <View className="mb-6">
                        <View className="flex-row items-center mb-4">
                            <View className="w-10 h-10 rounded-xl bg-purple-50 items-center justify-center mr-3">
                                <Ionicons name="shield-checkmark-outline" size={24} color="#9C27B0" />
                            </View>
                            <Text className="text-lg font-bold text-gray-900">
                                Account Status
                            </Text>
                        </View>
                        <View className="bg-white rounded-2xl p-5 shadow-lg shadow-gray-200/50 border border-gray-100">
                            <View className="flex-row flex-wrap -mx-1">
                                {[
                                    { value: 'active', icon: 'checkmark-circle', color: 'green' },
                                    { value: 'closed', icon: 'close-circle', color: 'gray' },
                                    { value: 'defaulter', icon: 'warning', color: 'amber' },
                                    { value: 'npa', icon: 'alert-circle', color: 'red' }
                                ].map((stat) => (
                                    <TouchableOpacity
                                        key={stat.value}
                                        className={`w-[48%] mx-1 mb-2 py-4 rounded-xl flex-row items-center justify-center ${status === stat.value
                                            ? `bg-${stat.color}-500`
                                            : 'bg-gray-50 border border-gray-200'
                                            }`}
                                        onPress={() => setStatus(stat.value)}
                                        disabled={saving}
                                        activeOpacity={0.7}
                                    >
                                        <Ionicons
                                            name={stat.icon}
                                            size={18}
                                            color={status === stat.value ? '#FFFFFF' : '#6B7280'}
                                        />
                                        <Text className={`text-sm font-bold capitalize ml-2 ${status === stat.value ? 'text-white' : 'text-gray-700'
                                            }`}>
                                            {stat.value}
                                        </Text>
                                    </TouchableOpacity>
                                ))}
                            </View>
                        </View>
                    </View>

                    {/* Submit Button */}
                    <TouchableOpacity
                        className="bg-teal-600 rounded-2xl h-14 items-center justify-center shadow-2xl shadow-teal-600/30"
                        onPress={handleSubmit}
                        disabled={saving}
                        activeOpacity={0.8}
                    >
                        {saving ? (
                            <ActivityIndicator color="#FFFFFF" />
                        ) : (
                            <View className="flex-row items-center">
                                <Ionicons name="checkmark-circle-outline" size={24} color="#FFFFFF" />
                                <Text className="text-white text-lg font-bold ml-2">
                                    Save Changes
                                </Text>
                            </View>
                        )}
                    </TouchableOpacity>
                </ScrollView>
            </KeyboardAvoidingView>
        </SafeAreaView>
    );
}
