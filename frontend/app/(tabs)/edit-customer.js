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

// ✅ FIXED: Move InputField OUTSIDE the main component
const InputField = ({
    label,
    value,
    onChangeText,
    placeholder,
    keyboardType = 'default',
    required = false,
    maxLength,
    editable = true,
    saving = false
}) => (
    <View className="mb-4">
        <Text className="text-sm font-semibold text-gray-700 mb-2">
            {label} {required && <Text className="text-red-500">*</Text>}
        </Text>
        <TextInput
            className={`rounded-xl border border-gray-200 px-4 h-12 text-base ${editable ? 'bg-gray-50 text-gray-800' : 'bg-gray-100 text-gray-400'
                }`}
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

export default function EditCustomerScreen() {
    const router = useRouter();
    const { customerId } = useLocalSearchParams();

    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);

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
    const [status, setStatus] = useState('active');

    useEffect(() => {
        fetchCustomer();
    }, []);

    const fetchCustomer = async () => {
        try {
            const response = await api.get(`/customers/${customerId}`);
            if (response.data.success) {
                const customer = response.data.data.customer;
                setName(customer.name);
                setMobile(customer.mobile);
                setAadhaar(customer.aadhaar);
                setStreet(customer.address?.street || '');
                setCity(customer.address?.city || '');
                setState(customer.address?.state || '');
                setPincode(customer.address?.pincode || '');
                setLoanAmount(customer.loanDetails?.loanAmount?.toString() || '');
                setTenure(customer.loanDetails?.tenure?.toString() || '');
                setInterestRate(customer.loanDetails?.interestRate?.toString() || '');
                setEmiAmount(customer.loanDetails?.emiAmount?.toString() || '');
                setEmiFrequency(customer.loanDetails?.emiFrequency || 'monthly');
                setStatus(customer.status);
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

        try {
            setSaving(true);

            const response = await api.put(`/customers/${customerId}`, {
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
                tenure: parseInt(tenure),
                interestRate: parseFloat(interestRate),
                emiAmount: parseFloat(emiAmount),
                emiFrequency: emiFrequency,
                status: status
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
            <View className="flex-1 bg-white items-center justify-center">
                <ActivityIndicator size="large" color="#1F8A70" />
            </View>
        );
    }

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
                        Edit Customer
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
                        saving={saving}
                    />

                    <InputField
                        label="Mobile Number"
                        value={mobile}
                        onChangeText={setMobile}
                        placeholder="10-digit mobile"
                        keyboardType="phone-pad"
                        maxLength={10}
                        required
                        saving={saving}
                    />

                    <InputField
                        label="Aadhaar Number"
                        value={aadhaar}
                        onChangeText={setAadhaar}
                        placeholder="12-digit aadhaar"
                        keyboardType="number-pad"
                        maxLength={12}
                        required
                        saving={saving}
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
                        saving={saving}
                    />

                    <View className="flex-row gap-3">
                        <View className="flex-1">
                            <InputField
                                label="City"
                                value={city}
                                onChangeText={setCity}
                                placeholder="City"
                                saving={saving}
                            />
                        </View>
                        <View className="flex-1">
                            <InputField
                                label="State"
                                value={state}
                                onChangeText={setState}
                                placeholder="State"
                                saving={saving}
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
                        saving={saving}
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
                        saving={saving}
                    />

                    <InputField
                        label="Tenure (Months)"
                        value={tenure}
                        onChangeText={setTenure}
                        placeholder="Number of months"
                        keyboardType="numeric"
                        required
                        saving={saving}
                    />

                    <InputField
                        label="Interest Rate (%)"
                        value={interestRate}
                        onChangeText={setInterestRate}
                        placeholder="Annual interest rate"
                        keyboardType="numeric"
                        required
                        saving={saving}
                    />

                    <InputField
                        label="EMI Amount"
                        value={emiAmount}
                        onChangeText={setEmiAmount}
                        placeholder="Monthly EMI amount"
                        keyboardType="numeric"
                        required
                        saving={saving}
                    />

                    {/* EMI Frequency */}
                    <Text className="text-sm font-semibold text-gray-700 mb-2">
                        EMI Frequency <Text className="text-red-500">*</Text>
                    </Text>
                    <View className="flex-row gap-2 mb-4">
                        {['daily', 'weekly', 'monthly'].map((freq) => (
                            <TouchableOpacity
                                key={freq}
                                className={`flex-1 py-3 rounded-xl items-center ${emiFrequency === freq ? 'bg-[#1F8A70]' : 'bg-gray-100'
                                    }`}
                                onPress={() => setEmiFrequency(freq)}
                                disabled={saving}
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

                    {/* Status */}
                    <Text className="text-sm font-semibold text-gray-700 mb-2 mt-2">
                        Status
                    </Text>
                    <View className="flex-row flex-wrap gap-2 mb-6">
                        {['active', 'closed', 'defaulter', 'npa'].map((stat) => (
                            <TouchableOpacity
                                key={stat}
                                className={`px-4 py-3 rounded-xl ${status === stat ? 'bg-[#1F8A70]' : 'bg-gray-100'
                                    }`}
                                onPress={() => setStatus(stat)}
                                disabled={saving}
                            >
                                <Text
                                    className={`text-sm font-semibold capitalize ${status === stat ? 'text-white' : 'text-gray-500'
                                        }`}
                                >
                                    {stat}
                                </Text>
                            </TouchableOpacity>
                        ))}
                    </View>

                    {/* Submit Button */}
                    <TouchableOpacity
                        className="bg-[#1F8A70] rounded-xl h-14 items-center justify-center mt-2 mb-5"
                        onPress={handleSubmit}
                        disabled={saving}
                    >
                        {saving ? (
                            <ActivityIndicator color="#FFFFFF" />
                        ) : (
                            <Text className="text-white text-lg font-bold">
                                Save Changes
                            </Text>
                        )}
                    </TouchableOpacity>
                </ScrollView>
            </KeyboardAvoidingView>
        </SafeAreaView>
    );
}