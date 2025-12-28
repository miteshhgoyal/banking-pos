import React, { useState, useEffect } from 'react';
import {
    View,
    Text,
    TextInput,
    TouchableOpacity,
    ActivityIndicator,
    Alert,
    KeyboardAvoidingView,
    Platform,
    ScrollView,
    Keyboard,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import * as Device from 'expo-device';
import { useAuth } from '@/contexts/AuthContext';

export default function SignupScreen() {
    const router = useRouter();
    const { signup } = useAuth();

    const [name, setName] = useState('');
    const [email, setEmail] = useState('');
    const [mobile, setMobile] = useState('');
    const [branch, setBranch] = useState('');
    const [password, setPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [showPassword, setShowPassword] = useState(false);
    const [showConfirmPassword, setShowConfirmPassword] = useState(false);
    const [loading, setLoading] = useState(false);
    const [keyboardVisible, setKeyboardVisible] = useState(false);

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

    const handleSignup = async () => {
        // Validation
        if (!name.trim() || !email.trim() || !mobile.trim() || !branch.trim() || !password.trim() || !confirmPassword.trim()) {
            Alert.alert('Error', 'Please fill in all fields');
            return;
        }

        if (name.trim().length < 2) {
            Alert.alert('Error', 'Name must be at least 2 characters long');
            return;
        }

        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!emailRegex.test(email)) {
            Alert.alert('Error', 'Please enter a valid email address');
            return;
        }

        const mobileRegex = /^[0-9]{10}$/;
        if (!mobileRegex.test(mobile)) {
            Alert.alert('Error', 'Please enter a valid 10-digit mobile number');
            return;
        }

        if (password.length < 6) {
            Alert.alert('Error', 'Password must be at least 6 characters long');
            return;
        }

        if (password !== confirmPassword) {
            Alert.alert('Error', 'Passwords do not match');
            return;
        }

        try {
            setLoading(true);
            const deviceId = Device.osInternalBuildId || Device.modelId || 'unknown_device';

            const result = await signup(name, email, mobile, password, branch, deviceId);

            if (result.success) {
                Alert.alert('Success', 'Account created successfully!', [
                    { text: 'OK', onPress: () => router.replace('/(tabs)') }
                ]);
            } else {
                Alert.alert('Signup Failed', result.message || 'Could not create account');
            }
        } catch (error) {
            Alert.alert('Error', 'Something went wrong. Please try again.');
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
                <ScrollView
                    contentContainerStyle={{
                        flexGrow: 1,
                        padding: 24,
                        paddingBottom: keyboardVisible ? 350 : 24
                    }}
                    keyboardShouldPersistTaps="handled"
                    showsVerticalScrollIndicator={false}
                    scrollEnabled={true}
                >
                    {/* Back Button */}
                    <TouchableOpacity
                        className="w-10 h-10 rounded-full bg-gray-100 items-center justify-center mb-5"
                        onPress={() => router.back()}
                        disabled={loading}
                    >
                        <Ionicons name="arrow-back" size={24} color="#1F2937" />
                    </TouchableOpacity>

                    {/* Title */}
                    <View className="mb-8">
                        <Text className="text-3xl font-bold text-gray-900 mb-2">
                            Create Account
                        </Text>
                        <Text className="text-base text-gray-500">
                            Register as a field agent
                        </Text>
                    </View>

                    {/* Name Input */}
                    <View className="mb-4">
                        <Text className="text-sm font-semibold text-gray-700 mb-2">
                            Full Name
                        </Text>
                        <View className="flex-row items-center bg-gray-50 rounded-xl border border-gray-200 px-4">
                            <Ionicons name="person-outline" size={20} color="#6B7280" />
                            <TextInput
                                className="flex-1 h-14 ml-3 text-gray-900 text-base"
                                placeholder="Enter your full name"
                                placeholderTextColor="#9CA3AF"
                                value={name}
                                onChangeText={setName}
                                editable={!loading}
                                returnKeyType="next"
                            />
                        </View>
                    </View>

                    {/* Email Input */}
                    <View className="mb-4">
                        <Text className="text-sm font-semibold text-gray-700 mb-2">
                            Email Address
                        </Text>
                        <View className="flex-row items-center bg-gray-50 rounded-xl border border-gray-200 px-4">
                            <Ionicons name="mail-outline" size={20} color="#6B7280" />
                            <TextInput
                                className="flex-1 h-14 ml-3 text-gray-900 text-base"
                                placeholder="Enter your email"
                                placeholderTextColor="#9CA3AF"
                                value={email}
                                onChangeText={setEmail}
                                keyboardType="email-address"
                                autoCapitalize="none"
                                autoCorrect={false}
                                editable={!loading}
                                returnKeyType="next"
                            />
                        </View>
                    </View>

                    {/* Mobile Input */}
                    <View className="mb-4">
                        <Text className="text-sm font-semibold text-gray-700 mb-2">
                            Mobile Number
                        </Text>
                        <View className="flex-row items-center bg-gray-50 rounded-xl border border-gray-200 px-4">
                            <Ionicons name="call-outline" size={20} color="#6B7280" />
                            <TextInput
                                className="flex-1 h-14 ml-3 text-gray-900 text-base"
                                placeholder="Enter 10-digit mobile number"
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

                    {/* Branch Input */}
                    <View className="mb-4">
                        <Text className="text-sm font-semibold text-gray-700 mb-2">
                            Branch
                        </Text>
                        <View className="flex-row items-center bg-gray-50 rounded-xl border border-gray-200 px-4">
                            <Ionicons name="business-outline" size={20} color="#6B7280" />
                            <TextInput
                                className="flex-1 h-14 ml-3 text-gray-900 text-base"
                                placeholder="Enter your branch name"
                                placeholderTextColor="#9CA3AF"
                                value={branch}
                                onChangeText={setBranch}
                                editable={!loading}
                                returnKeyType="next"
                            />
                        </View>
                    </View>

                    {/* Password Input */}
                    <View className="mb-4">
                        <Text className="text-sm font-semibold text-gray-700 mb-2">
                            Password
                        </Text>
                        <View className="flex-row items-center bg-gray-50 rounded-xl border border-gray-200 px-4">
                            <Ionicons name="lock-closed-outline" size={20} color="#6B7280" />
                            <TextInput
                                className="flex-1 h-14 ml-3 text-gray-900 text-base"
                                placeholder="Create a password"
                                placeholderTextColor="#9CA3AF"
                                value={password}
                                onChangeText={setPassword}
                                secureTextEntry={!showPassword}
                                editable={!loading}
                                returnKeyType="next"
                            />
                            <TouchableOpacity
                                onPress={() => setShowPassword(!showPassword)}
                                disabled={loading}
                            >
                                <Ionicons
                                    name={showPassword ? "eye-outline" : "eye-off-outline"}
                                    size={20}
                                    color="#6B7280"
                                />
                            </TouchableOpacity>
                        </View>
                    </View>

                    {/* Confirm Password Input */}
                    <View className="mb-6">
                        <Text className="text-sm font-semibold text-gray-700 mb-2">
                            Confirm Password
                        </Text>
                        <View className="flex-row items-center bg-gray-50 rounded-xl border border-gray-200 px-4">
                            <Ionicons name="lock-closed-outline" size={20} color="#6B7280" />
                            <TextInput
                                className="flex-1 h-14 ml-3 text-gray-900 text-base"
                                placeholder="Confirm your password"
                                placeholderTextColor="#9CA3AF"
                                value={confirmPassword}
                                onChangeText={setConfirmPassword}
                                secureTextEntry={!showConfirmPassword}
                                editable={!loading}
                                returnKeyType="done"
                                onSubmitEditing={handleSignup}
                            />
                            <TouchableOpacity
                                onPress={() => setShowConfirmPassword(!showConfirmPassword)}
                                disabled={loading}
                            >
                                <Ionicons
                                    name={showConfirmPassword ? "eye-outline" : "eye-off-outline"}
                                    size={20}
                                    color="#6B7280"
                                />
                            </TouchableOpacity>
                        </View>
                    </View>

                    {/* Signup Button */}
                    <TouchableOpacity
                        className="bg-[#1F8A70] rounded-xl h-14 items-center justify-center mb-5 shadow-2xl"
                        onPress={handleSignup}
                        disabled={loading}
                        activeOpacity={0.8}
                    >
                        {loading ? (
                            <ActivityIndicator color="#FFFFFF" />
                        ) : (
                            <Text className="text-white text-lg font-bold">
                                Create Account
                            </Text>
                        )}
                    </TouchableOpacity>

                    {/* Login Link */}
                    <View className="flex-row justify-center items-center mb-5">
                        <Text className="text-gray-500 text-base">
                            Already have an account?{' '}
                        </Text>
                        <TouchableOpacity
                            onPress={() => router.back()}
                            disabled={loading}
                        >
                            <Text className="text-[#1F8A70] text-base font-bold">
                                Sign In
                            </Text>
                        </TouchableOpacity>
                    </View>
                </ScrollView>
            </KeyboardAvoidingView>
        </SafeAreaView>
    );
}
