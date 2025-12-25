import React, { useState } from 'react';
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
        <SafeAreaView style={{ flex: 1, backgroundColor: '#FFFFFF' }} edges={['top', 'bottom']}>
            <KeyboardAvoidingView
                behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
                style={{ flex: 1 }}
            >
                <ScrollView
                    contentContainerStyle={{ flexGrow: 1, padding: 24 }}
                    keyboardShouldPersistTaps="handled"
                    showsVerticalScrollIndicator={false}
                >
                    {/* Back Button */}
                    <TouchableOpacity
                        style={{
                            width: 40,
                            height: 40,
                            borderRadius: 20,
                            backgroundColor: '#F3F4F6',
                            alignItems: 'center',
                            justifyContent: 'center',
                            marginBottom: 20
                        }}
                        onPress={() => router.back()}
                    >
                        <Ionicons name="arrow-back" size={24} color="#1F2937" />
                    </TouchableOpacity>

                    {/* Title */}
                    <View style={{ marginBottom: 32 }}>
                        <Text style={{ fontSize: 32, fontWeight: 'bold', color: '#1F2937', marginBottom: 8 }}>
                            Create Account
                        </Text>
                        <Text style={{ fontSize: 16, color: '#6B7280' }}>
                            Register as a field agent
                        </Text>
                    </View>

                    {/* Name Input */}
                    <View style={{ marginBottom: 16 }}>
                        <Text style={{ fontSize: 14, fontWeight: '600', color: '#374151', marginBottom: 8 }}>
                            Full Name
                        </Text>
                        <View style={{
                            flexDirection: 'row',
                            alignItems: 'center',
                            backgroundColor: '#F9FAFB',
                            borderRadius: 12,
                            borderWidth: 1,
                            borderColor: '#E5E7EB',
                            paddingHorizontal: 16,
                        }}>
                            <Ionicons name="person-outline" size={20} color="#6B7280" />
                            <TextInput
                                style={{
                                    flex: 1,
                                    height: 56,
                                    marginLeft: 12,
                                    color: '#1F2937',
                                    fontSize: 16
                                }}
                                placeholder="Enter your full name"
                                placeholderTextColor="#9CA3AF"
                                value={name}
                                onChangeText={setName}
                                editable={!loading}
                            />
                        </View>
                    </View>

                    {/* Email Input */}
                    <View style={{ marginBottom: 16 }}>
                        <Text style={{ fontSize: 14, fontWeight: '600', color: '#374151', marginBottom: 8 }}>
                            Email Address
                        </Text>
                        <View style={{
                            flexDirection: 'row',
                            alignItems: 'center',
                            backgroundColor: '#F9FAFB',
                            borderRadius: 12,
                            borderWidth: 1,
                            borderColor: '#E5E7EB',
                            paddingHorizontal: 16,
                        }}>
                            <Ionicons name="mail-outline" size={20} color="#6B7280" />
                            <TextInput
                                style={{
                                    flex: 1,
                                    height: 56,
                                    marginLeft: 12,
                                    color: '#1F2937',
                                    fontSize: 16
                                }}
                                placeholder="Enter your email"
                                placeholderTextColor="#9CA3AF"
                                value={email}
                                onChangeText={setEmail}
                                keyboardType="email-address"
                                autoCapitalize="none"
                                autoCorrect={false}
                                editable={!loading}
                            />
                        </View>
                    </View>

                    {/* Mobile Input */}
                    <View style={{ marginBottom: 16 }}>
                        <Text style={{ fontSize: 14, fontWeight: '600', color: '#374151', marginBottom: 8 }}>
                            Mobile Number
                        </Text>
                        <View style={{
                            flexDirection: 'row',
                            alignItems: 'center',
                            backgroundColor: '#F9FAFB',
                            borderRadius: 12,
                            borderWidth: 1,
                            borderColor: '#E5E7EB',
                            paddingHorizontal: 16,
                        }}>
                            <Ionicons name="call-outline" size={20} color="#6B7280" />
                            <TextInput
                                style={{
                                    flex: 1,
                                    height: 56,
                                    marginLeft: 12,
                                    color: '#1F2937',
                                    fontSize: 16
                                }}
                                placeholder="Enter 10-digit mobile number"
                                placeholderTextColor="#9CA3AF"
                                value={mobile}
                                onChangeText={setMobile}
                                keyboardType="phone-pad"
                                maxLength={10}
                                editable={!loading}
                            />
                        </View>
                    </View>

                    {/* Branch Input */}
                    <View style={{ marginBottom: 16 }}>
                        <Text style={{ fontSize: 14, fontWeight: '600', color: '#374151', marginBottom: 8 }}>
                            Branch
                        </Text>
                        <View style={{
                            flexDirection: 'row',
                            alignItems: 'center',
                            backgroundColor: '#F9FAFB',
                            borderRadius: 12,
                            borderWidth: 1,
                            borderColor: '#E5E7EB',
                            paddingHorizontal: 16,
                        }}>
                            <Ionicons name="business-outline" size={20} color="#6B7280" />
                            <TextInput
                                style={{
                                    flex: 1,
                                    height: 56,
                                    marginLeft: 12,
                                    color: '#1F2937',
                                    fontSize: 16
                                }}
                                placeholder="Enter your branch name"
                                placeholderTextColor="#9CA3AF"
                                value={branch}
                                onChangeText={setBranch}
                                editable={!loading}
                            />
                        </View>
                    </View>

                    {/* Password Input */}
                    <View style={{ marginBottom: 16 }}>
                        <Text style={{ fontSize: 14, fontWeight: '600', color: '#374151', marginBottom: 8 }}>
                            Password
                        </Text>
                        <View style={{
                            flexDirection: 'row',
                            alignItems: 'center',
                            backgroundColor: '#F9FAFB',
                            borderRadius: 12,
                            borderWidth: 1,
                            borderColor: '#E5E7EB',
                            paddingHorizontal: 16,
                        }}>
                            <Ionicons name="lock-closed-outline" size={20} color="#6B7280" />
                            <TextInput
                                style={{
                                    flex: 1,
                                    height: 56,
                                    marginLeft: 12,
                                    color: '#1F2937',
                                    fontSize: 16
                                }}
                                placeholder="Create a password"
                                placeholderTextColor="#9CA3AF"
                                value={password}
                                onChangeText={setPassword}
                                secureTextEntry={!showPassword}
                                editable={!loading}
                            />
                            <TouchableOpacity onPress={() => setShowPassword(!showPassword)}>
                                <Ionicons
                                    name={showPassword ? "eye-outline" : "eye-off-outline"}
                                    size={20}
                                    color="#6B7280"
                                />
                            </TouchableOpacity>
                        </View>
                    </View>

                    {/* Confirm Password Input */}
                    <View style={{ marginBottom: 24 }}>
                        <Text style={{ fontSize: 14, fontWeight: '600', color: '#374151', marginBottom: 8 }}>
                            Confirm Password
                        </Text>
                        <View style={{
                            flexDirection: 'row',
                            alignItems: 'center',
                            backgroundColor: '#F9FAFB',
                            borderRadius: 12,
                            borderWidth: 1,
                            borderColor: '#E5E7EB',
                            paddingHorizontal: 16,
                        }}>
                            <Ionicons name="lock-closed-outline" size={20} color="#6B7280" />
                            <TextInput
                                style={{
                                    flex: 1,
                                    height: 56,
                                    marginLeft: 12,
                                    color: '#1F2937',
                                    fontSize: 16
                                }}
                                placeholder="Confirm your password"
                                placeholderTextColor="#9CA3AF"
                                value={confirmPassword}
                                onChangeText={setConfirmPassword}
                                secureTextEntry={!showConfirmPassword}
                                editable={!loading}
                            />
                            <TouchableOpacity onPress={() => setShowConfirmPassword(!showConfirmPassword)}>
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
                        style={{
                            backgroundColor: '#1F8A70',
                            borderRadius: 12,
                            height: 56,
                            alignItems: 'center',
                            justifyContent: 'center',
                            marginBottom: 20,
                            shadowColor: '#1F8A70',
                            shadowOffset: { width: 0, height: 4 },
                            shadowOpacity: 0.3,
                            shadowRadius: 8,
                            elevation: 8
                        }}
                        onPress={handleSignup}
                        disabled={loading}
                        activeOpacity={0.8}
                    >
                        {loading ? (
                            <ActivityIndicator color="#fff" />
                        ) : (
                            <Text style={{ color: '#fff', fontSize: 18, fontWeight: 'bold' }}>
                                Create Account
                            </Text>
                        )}
                    </TouchableOpacity>

                    {/* Login Link */}
                    <View style={{ flexDirection: 'row', justifyContent: 'center', alignItems: 'center', marginBottom: 20 }}>
                        <Text style={{ color: '#6B7280', fontSize: 16 }}>
                            Already have an account?{' '}
                        </Text>
                        <TouchableOpacity onPress={() => router.back()} disabled={loading}>
                            <Text style={{ color: '#1F8A70', fontSize: 16, fontWeight: 'bold' }}>
                                Sign In
                            </Text>
                        </TouchableOpacity>
                    </View>
                </ScrollView>
            </KeyboardAvoidingView>
        </SafeAreaView>
    );
}