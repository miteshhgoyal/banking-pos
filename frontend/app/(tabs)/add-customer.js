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
    Platform,
    Keyboard,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import api from '@/services/api';

export default function AddCustomerScreen() {
    const router = useRouter();
    const [loading, setLoading] = useState(false);
    const [keyboardVisible, setKeyboardVisible] = useState(false);

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

    useEffect(() => {
        const keyboardDidShowListener = Keyboard.addListener(
            'keyboardDidShow',
            () => setKeyboardVisible(true)
        );
        const keyboardDidHideListener = Keyboard.addListener(
            'keyboardDidHide',
            () => setKeyboardVisible(false)
        );

        return () => {
            keyboardDidShowListener.remove();
            keyboardDidHideListener.remove();
        };
    }, []);

    // Auto-calculate EMI when loan details change
    useEffect(() => {
        calculateEMI();
    }, [loanAmount, tenure, interestRate, emiFrequency]);

    const calculateEMI = () => {
        if (!loanAmount || !tenure || !interestRate) {
            setEmiAmount('');
            return;
        }

        const principal = parseFloat(loanAmount);
        const annualRate = parseFloat(interestRate);
        let months = parseInt(tenure);

        if (isNaN(principal) || isNaN(annualRate) || isNaN(months) || principal <= 0 || months <= 0) {
            setEmiAmount('');
            return;
        }

        // Adjust tenure based on frequency
        let periodsPerYear = 12;
        if (emiFrequency === 'daily') periodsPerYear = 365;
        else if (emiFrequency === 'weekly') periodsPerYear = 52;

        const totalPeriods = (months / 12) * periodsPerYear;
        const ratePerPeriod = annualRate / (100 * periodsPerYear);

        if (ratePerPeriod === 0) {
            const emi = principal / totalPeriods;
            setEmiAmount(emi.toFixed(2));
        } else {
            const emi = (principal * ratePerPeriod * Math.pow(1 + ratePerPeriod, totalPeriods)) /
                (Math.pow(1 + ratePerPeriod, totalPeriods) - 1);
            setEmiAmount(emi.toFixed(2));
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

        if (!loanAmount || !tenure || !interestRate || !emiAmount) {
            Alert.alert('Error', 'Please fill all loan details');
            return;
        }

        try {
            setLoading(true);

            const response = await api.post('/customers', {
                name,
                mobile,
                aadhaar,
                address: {
                    street,
                    city,
                    state,
                    pincode
                },
                loanAmount: parseFloat(loanAmount),
                disbursedDate: new Date().toISOString().split('T')[0],
                tenure: parseInt(tenure),
                interestRate: parseFloat(interestRate),
                emiAmount: parseFloat(emiAmount),
                emiFrequency
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
                behavior={Platform.OS === 'ios' ? 'padding' : undefined}
                className="flex-1"
                keyboardVerticalOffset={0}
            >
                {/* Header */}
                <View className="flex-row items-center px-5 py-4 bg-white border-b border-gray-200">
                    <TouchableOpacity
                        className="w-10 h-10 rounded-full bg-gray-100 items-center justify-center mr-3"
                        onPress={() => router.back()}
                        disabled={loading}
                    >
                        <Ionicons name="arrow-back" size={24} color="#1F2937" />
                    </TouchableOpacity>
                    <Text className="text-xl font-bold text-gray-900">
                        Add New Customer
                    </Text>
                </View>

                <ScrollView
                    contentContainerStyle={{
                        flexGrow: 1,
                        padding: 20,
                        paddingBottom: keyboardVisible ? 350 : 20
                    }}
                    keyboardShouldPersistTaps="handled"
                    showsVerticalScrollIndicator={false}
                    scrollEnabled={true}
                >
                    {/* Basic Information */}
                    <View className="mb-6">
                        <Text className="text-lg font-bold text-gray-900 mb-4">
                            Basic Information
                        </Text>

                        {/* Name Input */}
                        <View className="mb-4">
                            <Text className="text-sm font-semibold text-gray-700 mb-2">
                                Customer Name <Text className="text-red-500">*</Text>
                            </Text>
                            <View className="flex-row items-center bg-gray-50 rounded-xl border border-gray-200 px-4">
                                <Ionicons name="person-outline" size={20} color="#6B7280" />
                                <TextInput
                                    className="flex-1 h-14 ml-3 text-gray-900 text-base"
                                    placeholder="Enter full name"
                                    placeholderTextColor="#9CA3AF"
                                    value={name}
                                    onChangeText={setName}
                                    editable={!loading}
                                    returnKeyType="next"
                                />
                            </View>
                        </View>

                        {/* Mobile Input */}
                        <View className="mb-4">
                            <Text className="text-sm font-semibold text-gray-700 mb-2">
                                Mobile Number <Text className="text-red-500">*</Text>
                            </Text>
                            <View className="flex-row items-center bg-gray-50 rounded-xl border border-gray-200 px-4">
                                <Ionicons name="call-outline" size={20} color="#6B7280" />
                                <TextInput
                                    className="flex-1 h-14 ml-3 text-gray-900 text-base"
                                    placeholder="Enter 10-digit mobile"
                                    placeholderTextColor="#9CA3AF"
                                    value={mobile}
                                    onChangeText={setMobile}
                                    keyboardType="phone-pad"
                                    maxLength={10}
                                    editable={!loading}
                                    returnKeyType="next"
                                />
                            </View>
                        </View>

                        {/* Aadhaar Input */}
                        <View className="mb-0">
                            <Text className="text-sm font-semibold text-gray-700 mb-2">
                                Aadhaar Number <Text className="text-red-500">*</Text>
                            </Text>
                            <View className="flex-row items-center bg-gray-50 rounded-xl border border-gray-200 px-4">
                                <Ionicons name="card-outline" size={20} color="#6B7280" />
                                <TextInput
                                    className="flex-1 h-14 ml-3 text-gray-900 text-base"
                                    placeholder="Enter 12-digit aadhaar"
                                    placeholderTextColor="#9CA3AF"
                                    value={aadhaar}
                                    onChangeText={setAadhaar}
                                    keyboardType="number-pad"
                                    maxLength={12}
                                    editable={!loading}
                                    returnKeyType="next"
                                />
                            </View>
                        </View>
                    </View>

                    {/* Address Section */}
                    <View className="mb-6">
                        <Text className="text-lg font-bold text-gray-900 mb-4">
                            Address Details
                        </Text>

                        {/* Street Input */}
                        <View className="mb-4">
                            <Text className="text-sm font-semibold text-gray-700 mb-2">
                                Street Address
                            </Text>
                            <View className="flex-row items-center bg-gray-50 rounded-xl border border-gray-200 px-4">
                                <Ionicons name="location-outline" size={20} color="#6B7280" />
                                <TextInput
                                    className="flex-1 h-14 ml-3 text-gray-900 text-base"
                                    placeholder="Enter street address"
                                    placeholderTextColor="#9CA3AF"
                                    value={street}
                                    onChangeText={setStreet}
                                    editable={!loading}
                                    returnKeyType="next"
                                />
                            </View>
                        </View>

                        {/* City and State Row */}
                        <View className="flex-row mb-4">
                            <View className="flex-1 mr-2">
                                <Text className="text-sm font-semibold text-gray-700 mb-2">
                                    City
                                </Text>
                                <View className="flex-row items-center bg-gray-50 rounded-xl border border-gray-200 px-4">
                                    <TextInput
                                        className="flex-1 h-14 text-gray-900 text-base"
                                        placeholder="City"
                                        placeholderTextColor="#9CA3AF"
                                        value={city}
                                        onChangeText={setCity}
                                        editable={!loading}
                                        returnKeyType="next"
                                    />
                                </View>
                            </View>

                            <View className="flex-1 ml-2">
                                <Text className="text-sm font-semibold text-gray-700 mb-2">
                                    State
                                </Text>
                                <View className="flex-row items-center bg-gray-50 rounded-xl border border-gray-200 px-4">
                                    <TextInput
                                        className="flex-1 h-14 text-gray-900 text-base"
                                        placeholder="State"
                                        placeholderTextColor="#9CA3AF"
                                        value={state}
                                        onChangeText={setState}
                                        editable={!loading}
                                        returnKeyType="next"
                                    />
                                </View>
                            </View>
                        </View>

                        {/* Pincode Input */}
                        <View className="mb-0">
                            <Text className="text-sm font-semibold text-gray-700 mb-2">
                                Pincode
                            </Text>
                            <View className="flex-row items-center bg-gray-50 rounded-xl border border-gray-200 px-4">
                                <Ionicons name="pin-outline" size={20} color="#6B7280" />
                                <TextInput
                                    className="flex-1 h-14 ml-3 text-gray-900 text-base"
                                    placeholder="Enter 6-digit pincode"
                                    placeholderTextColor="#9CA3AF"
                                    value={pincode}
                                    onChangeText={setPincode}
                                    keyboardType="number-pad"
                                    maxLength={6}
                                    editable={!loading}
                                    returnKeyType="next"
                                />
                            </View>
                        </View>
                    </View>

                    {/* Loan Details Section */}
                    <View className="mb-6">
                        <Text className="text-lg font-bold text-gray-900 mb-4">
                            Loan Details
                        </Text>

                        {/* Loan Amount Input */}
                        <View className="mb-4">
                            <Text className="text-sm font-semibold text-gray-700 mb-2">
                                Loan Amount <Text className="text-red-500">*</Text>
                            </Text>
                            <View className="flex-row items-center bg-gray-50 rounded-xl border border-gray-200 px-4">
                                <Ionicons name="cash-outline" size={20} color="#6B7280" />
                                <TextInput
                                    className="flex-1 h-14 ml-3 text-gray-900 text-base"
                                    placeholder="Enter total loan amount"
                                    placeholderTextColor="#9CA3AF"
                                    value={loanAmount}
                                    onChangeText={setLoanAmount}
                                    keyboardType="numeric"
                                    editable={!loading}
                                    returnKeyType="next"
                                />
                            </View>
                        </View>

                        {/* Tenure and Interest Row */}
                        <View className="flex-row mb-4">
                            <View className="flex-1 mr-2">
                                <Text className="text-sm font-semibold text-gray-700 mb-2">
                                    Tenure (Months) <Text className="text-red-500">*</Text>
                                </Text>
                                <View className="flex-row items-center bg-gray-50 rounded-xl border border-gray-200 px-4">
                                    <Ionicons name="calendar-outline" size={20} color="#6B7280" />
                                    <TextInput
                                        className="flex-1 h-14 ml-3 text-gray-900 text-base"
                                        placeholder="Months"
                                        placeholderTextColor="#9CA3AF"
                                        value={tenure}
                                        onChangeText={setTenure}
                                        keyboardType="numeric"
                                        editable={!loading}
                                        returnKeyType="next"
                                    />
                                </View>
                            </View>

                            <View className="flex-1 ml-2">
                                <Text className="text-sm font-semibold text-gray-700 mb-2">
                                    Interest Rate (%) <Text className="text-red-500">*</Text>
                                </Text>
                                <View className="flex-row items-center bg-gray-50 rounded-xl border border-gray-200 px-4">
                                    <Ionicons name="trending-up-outline" size={20} color="#6B7280" />
                                    <TextInput
                                        className="flex-1 h-14 ml-3 text-gray-900 text-base"
                                        placeholder="Rate"
                                        placeholderTextColor="#9CA3AF"
                                        value={interestRate}
                                        onChangeText={setInterestRate}
                                        keyboardType="numeric"
                                        editable={!loading}
                                        returnKeyType="done"
                                    />
                                </View>
                            </View>
                        </View>

                        {/* EMI Frequency */}
                        <View className="mb-4">
                            <Text className="text-sm font-semibold text-gray-700 mb-2">
                                EMI Frequency <Text className="text-red-500">*</Text>
                            </Text>
                            <View className="flex-row">
                                <TouchableOpacity
                                    className={`flex-1 mr-2 py-3.5 rounded-xl items-center border-2 ${emiFrequency === 'daily'
                                            ? 'bg-[#1F8A70] border-[#1F8A70]'
                                            : 'bg-gray-50 border-gray-200'
                                        }`}
                                    onPress={() => setEmiFrequency('daily')}
                                    disabled={loading}
                                    activeOpacity={0.7}
                                >
                                    <Text className={`text-sm font-semibold ${emiFrequency === 'daily' ? 'text-white' : 'text-gray-600'
                                        }`}>
                                        Daily
                                    </Text>
                                </TouchableOpacity>

                                <TouchableOpacity
                                    className={`flex-1 mx-1 py-3.5 rounded-xl items-center border-2 ${emiFrequency === 'weekly'
                                            ? 'bg-[#1F8A70] border-[#1F8A70]'
                                            : 'bg-gray-50 border-gray-200'
                                        }`}
                                    onPress={() => setEmiFrequency('weekly')}
                                    disabled={loading}
                                    activeOpacity={0.7}
                                >
                                    <Text className={`text-sm font-semibold ${emiFrequency === 'weekly' ? 'text-white' : 'text-gray-600'
                                        }`}>
                                        Weekly
                                    </Text>
                                </TouchableOpacity>

                                <TouchableOpacity
                                    className={`flex-1 ml-2 py-3.5 rounded-xl items-center border-2 ${emiFrequency === 'monthly'
                                            ? 'bg-[#1F8A70] border-[#1F8A70]'
                                            : 'bg-gray-50 border-gray-200'
                                        }`}
                                    onPress={() => setEmiFrequency('monthly')}
                                    disabled={loading}
                                    activeOpacity={0.7}
                                >
                                    <Text className={`text-sm font-semibold ${emiFrequency === 'monthly' ? 'text-white' : 'text-gray-600'
                                        }`}>
                                        Monthly
                                    </Text>
                                </TouchableOpacity>
                            </View>
                        </View>

                        {/* Calculated EMI Display */}
                        <View className="mb-0">
                            <Text className="text-sm font-semibold text-gray-700 mb-2">
                                Calculated EMI Amount <Text className="text-red-500">*</Text>
                            </Text>
                            <View className="flex-row items-center bg-green-50 rounded-xl border-2 border-[#1F8A70] px-4 h-14">
                                <Ionicons name="calculator-outline" size={20} color="#1F8A70" />
                                <Text className="flex-1 ml-3 text-[#1F8A70] text-lg font-bold">
                                    {emiAmount ? `₹ ${emiAmount}` : 'Auto-calculated'}
                                </Text>
                            </View>
                            <Text className="text-xs text-gray-500 mt-1">
                                EMI is auto-calculated based on loan details
                            </Text>
                        </View>
                    </View>

                    {/* Submit Button */}
                    <TouchableOpacity
                        className="bg-[#1F8A70] rounded-xl h-14 items-center justify-center mb-5 shadow-2xl"
                        onPress={handleSubmit}
                        disabled={loading}
                        activeOpacity={0.8}
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
