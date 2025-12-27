import React, { useState } from 'react';
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
import { useRouter } from 'expo-router';
import api from '@/services/api';

const InputField = ({
    label,
    value,
    onChangeText,
    placeholder,
    keyboardType = 'default',
    required = false,
    maxLength,
    loading = false
}) => (
    <View className="mb-4">
        <Text className="text-sm font-semibold text-gray-700 mb-2">
            {label} {required && <Text className="text-red-500">*</Text>}
        </Text>
        <TextInput
            className="bg-gray-50 rounded-xl border border-gray-200 px-4 h-12 text-gray-800 text-base"
            placeholder={placeholder}
            placeholderTextColor="#9CA3AF"
            value={value}
            onChangeText={onChangeText}
            keyboardType={keyboardType}
            editable={!loading}
            maxLength={maxLength}
        />
    </View>
);

export default function AddCustomerScreen() {
    const router = useRouter();

    const [loading, setLoading] = useState(false);

    // Separate state for each field
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

    const handleSubmit = async () => {
        // Validation
        if (!name || !mobile || !aadhaar) {
            Alert.alert('Error', 'Please fill all required fields');
            return;
        }

        if (!/^[0-9]{10}$/.test(mobile)) {
            Alert.alert('Error', 'Mobile must be 10 digits');
            return;
        }

        if (!/^[0-9]{12}$/.test(aadhaar)) {
            Alert.alert('Error', 'Aadhaar must be 12 digits');
            return;
        }

        if (!loanAmount || !tenure || !interestRate || !emiAmount) {
            Alert.alert('Error', 'Please fill all loan details');
            return;
        }

        try {
            setLoading(true);

            const response = await api.post('/customers', {
                name: name,
                mobile: mobile,
                aadhaar: aadhaar,
                address: {
                    street: street,
                    city: city,
                    state: state,
                    pincode: pincode
                },
                loanAmount: parseFloat(loanAmount),
                disbursedDate: new Date().toISOString().split('T')[0],
                tenure: parseInt(tenure),
                interestRate: parseFloat(interestRate),
                emiAmount: parseFloat(emiAmount),
                emiFrequency: emiFrequency
            });

            if (response.data.success) {
                Alert.alert('Success', 'Customer added successfully!', [
                    { text: 'OK', onPress: () => router.back() }
                ]);
            }
        } catch (error) {
            console.error('Add customer error:', error);
            Alert.alert('Error', error.response?.data?.message || 'Failed to add customer');
        } finally {
            setLoading(false);
        }
    };

    return (
        <SafeAreaView className="flex-1 bg-white" edges={['top']}>
            <KeyboardAvoidingView
                behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
                className="flex-1"
            >
                {/* Header */}
                <View className="flex-row items-center px-5 py-4 border-b border-gray-200">
                    <TouchableOpacity onPress={() => router.back()}>
                        <Ionicons name="arrow-back" size={24} color="#1F2937" />
                    </TouchableOpacity>
                    <Text className="text-xl font-bold text-gray-800 ml-4">
                        Add New Customer
                    </Text>
                </View>

                <ScrollView
                    showsVerticalScrollIndicator={false}
                    contentContainerStyle={{ padding: 20 }}
                    keyboardShouldPersistTaps="handled"
                >
                    {/* Basic Information */}
                    <Text className="text-base font-bold text-gray-800 mb-4">
                        Basic Information
                    </Text>

                    <InputField
                        label="Customer Name"
                        value={name}
                        onChangeText={setName}
                        placeholder="Full name"
                        required
                        loading={loading}
                    />

                    <InputField
                        label="Mobile Number"
                        value={mobile}
                        onChangeText={setMobile}
                        placeholder="10-digit mobile"
                        keyboardType="phone-pad"
                        maxLength={10}
                        required
                        loading={loading}
                    />

                    <InputField
                        label="Aadhaar Number"
                        value={aadhaar}
                        onChangeText={setAadhaar}
                        placeholder="12-digit aadhaar"
                        keyboardType="number-pad"
                        maxLength={12}
                        required
                        loading={loading}
                    />

                    {/* Address */}
                    <Text className="text-base font-bold text-gray-800 mt-4 mb-4">
                        Address
                    </Text>

                    <InputField
                        label="Street"
                        value={street}
                        onChangeText={setStreet}
                        placeholder="Street address"
                        loading={loading}
                    />

                    <View className="flex-row gap-3">
                        <View className="flex-1">
                            <InputField
                                label="City"
                                value={city}
                                onChangeText={setCity}
                                placeholder="City"
                                loading={loading}
                            />
                        </View>
                        <View className="flex-1">
                            <InputField
                                label="State"
                                value={state}
                                onChangeText={setState}
                                placeholder="State"
                                loading={loading}
                            />
                        </View>
                    </View>

                    <InputField
                        label="Pincode"
                        value={pincode}
                        onChangeText={setPincode}
                        placeholder="6-digit pincode"
                        keyboardType="number-pad"
                        maxLength={6}
                        loading={loading}
                    />

                    {/* Loan Details */}
                    <Text className="text-base font-bold text-gray-800 mt-4 mb-4">
                        Loan Details
                    </Text>

                    <InputField
                        label="Loan Amount"
                        value={loanAmount}
                        onChangeText={setLoanAmount}
                        placeholder="Total loan amount"
                        keyboardType="numeric"
                        required
                        loading={loading}
                    />

                    <InputField
                        label="Tenure (Months)"
                        value={tenure}
                        onChangeText={setTenure}
                        placeholder="Number of months"
                        keyboardType="numeric"
                        required
                        loading={loading}
                    />

                    <InputField
                        label="Interest Rate (%)"
                        value={interestRate}
                        onChangeText={setInterestRate}
                        placeholder="Annual interest rate"
                        keyboardType="numeric"
                        required
                        loading={loading}
                    />

                    <InputField
                        label="EMI Amount"
                        value={emiAmount}
                        onChangeText={setEmiAmount}
                        placeholder="Monthly EMI amount"
                        keyboardType="numeric"
                        required
                        loading={loading}
                    />

                    {/* EMI Frequency */}
                    <Text className="text-sm font-semibold text-gray-700 mb-2">
                        EMI Frequency <Text className="text-red-500">*</Text>
                    </Text>
                    <View className="flex-row gap-2 mb-6">
                        {['daily', 'weekly', 'monthly'].map((freq) => (
                            <TouchableOpacity
                                key={freq}
                                className={`flex-1 py-3 rounded-xl items-center ${emiFrequency === freq ? 'bg-[#1F8A70]' : 'bg-gray-100'
                                    }`}
                                onPress={() => setEmiFrequency(freq)}
                                disabled={loading}
                            >
                                <Text
                                    className={`text-sm font-semibold capitalize ${emiFrequency === freq ? 'text-white' : 'text-gray-500'
                                        }`}
                                >
                                    {freq}
                                </Text>
                            </TouchableOpacity>
                        ))}
                    </View>

                    {/* Submit Button */}
                    <TouchableOpacity
                        className="bg-[#1F8A70] rounded-xl h-14 items-center justify-center mt-2 mb-5"
                        onPress={handleSubmit}
                        disabled={loading}
                    >
                        {loading ? (
                            <ActivityIndicator color="#FFFFFF" />
                        ) : (
                            <Text className="text-white text-lg font-bold">
                                Add Customer
                            </Text>
                        )}
                    </TouchableOpacity>
                </ScrollView>
            </KeyboardAvoidingView>
        </SafeAreaView>
    );
}