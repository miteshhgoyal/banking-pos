import React from 'react';
import {
    View,
    Text,
    ScrollView,
    TouchableOpacity,
    Alert,
    Image
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { useAuth } from '@/contexts/AuthContext';
import Gradient from '@/components/Gradient';

export default function ProfileScreen() {
    const router = useRouter();
    const { user, logout } = useAuth();

    const handleLogout = () => {
        Alert.alert(
            'Logout',
            'Are you sure you want to logout?',
            [
                { text: 'Cancel', style: 'cancel' },
                {
                    text: 'Logout',
                    style: 'destructive',
                    onPress: async () => {
                        await logout();
                        router.replace('/(auth)/login');
                    }
                }
            ]
        );
    };

    const ProfileRow = ({ icon, label, value, iconBg = 'bg-teal-50', iconColor = '#1F8A70' }) => (
        <View className="bg-white p-4 border-b border-gray-100">
            <View className="flex-row items-center">
                <View className={`w-11 h-11 rounded-xl ${iconBg} items-center justify-center`}>
                    <Ionicons name={icon} size={22} color={iconColor} />
                </View>
                <View className="flex-1 ml-4">
                    <Text className="text-xs text-gray-500 mb-1 font-medium">{label}</Text>
                    <Text className="text-base font-bold text-gray-900" numberOfLines={1}>
                        {value || 'Not set'}
                    </Text>
                </View>
            </View>
        </View>
    );

    const getRoleBadgeColor = (role) => {
        switch (role?.toLowerCase()) {
            case 'admin': return 'bg-red-500';
            case 'supervisor': return 'bg-blue-500';
            case 'agent': return 'bg-teal-500';
            default: return 'bg-gray-500';
        }
    };

    return (
        <SafeAreaView className="flex-1 bg-gray-50" edges={['top']}>
            {/* Background Watermark */}
            <Image
                source={require('@/assets/ph-logo.png')}
                className="absolute bottom-20 right-8 w-32 h-32 opacity-5"
                style={{ zIndex: 0 }}
                resizeMode="contain"
            />

            <ScrollView
                showsVerticalScrollIndicator={false}
                contentContainerStyle={{ paddingBottom: 100 }}
            >
                {/* Header with Gradient */}
                <View className="rounded-b-3xl overflow-hidden shadow-2xl shadow-teal-500/20">
                    <Gradient type="teal">
                        <View className="px-6 py-12 items-center">
                            {/* Card Watermark */}
                            <Image
                                source={require('@/assets/ph-logo.png')}
                                className="absolute -top-8 -right-8 w-40 h-40 opacity-10"
                                style={{ transform: [{ rotate: '-12deg' }] }}
                                resizeMode="contain"
                            />

                            {/* Profile Avatar */}
                            <View className="w-24 h-24 rounded-full bg-white items-center justify-center mb-4 shadow-2xl border-4 border-white/20">
                                <Ionicons name="person" size={48} color="#1F8A70" />
                            </View>

                            {/* User Name */}
                            <Text className="text-2xl font-black text-white mb-2 tracking-tight">
                                {user?.name || 'User'}
                            </Text>

                            {/* Role Badge */}
                            <View className={`px-5 py-2 rounded-full ${getRoleBadgeColor(user?.role)} shadow-lg`}>
                                <View className="flex-row items-center">
                                    <Ionicons name="shield-checkmark" size={16} color="#FFFFFF" />
                                    <Text className="text-sm font-bold text-white uppercase ml-1.5 tracking-wider">
                                        {user?.role || 'Agent'}
                                    </Text>
                                </View>
                            </View>

                            {/* Stats Row */}
                            {user?.email && (
                                <View className="mt-4 bg-white/20 rounded-xl px-4 py-2">
                                    <Text className="text-xs text-white/80 text-center font-medium">
                                        {user.email}
                                    </Text>
                                </View>
                            )}
                        </View>
                    </Gradient>
                </View>

                {/* Account Information */}
                <View className="mt-6 mx-5">
                    <View className="flex-row items-center mb-4">
                        <View className="w-10 h-10 rounded-xl bg-teal-50 items-center justify-center mr-3">
                            <Ionicons name="person-circle-outline" size={24} color="#1F8A70" />
                        </View>
                        <Text className="text-lg font-bold text-gray-900">
                            Account Information
                        </Text>
                    </View>

                    <View className="bg-white rounded-2xl shadow-lg shadow-gray-200/50 overflow-hidden border border-gray-100">
                        <ProfileRow
                            icon="person-outline"
                            label="Full Name"
                            value={user?.name}
                            iconBg="bg-teal-50"
                            iconColor="#1F8A70"
                        />
                        <ProfileRow
                            icon="mail-outline"
                            label="Email Address"
                            value={user?.email}
                            iconBg="bg-blue-50"
                            iconColor="#3B82F6"
                        />
                        <ProfileRow
                            icon="call-outline"
                            label="Mobile Number"
                            value={user?.mobile}
                            iconBg="bg-green-50"
                            iconColor="#10B981"
                        />
                        <ProfileRow
                            icon="business-outline"
                            label="Branch"
                            value={user?.branch}
                            iconBg="bg-purple-50"
                            iconColor="#9C27B0"
                        />
                        <ProfileRow
                            icon="location-outline"
                            label="Assigned Area"
                            value={user?.assignedArea}
                            iconBg="bg-amber-50"
                            iconColor="#FF9800"
                        />
                        <View className="bg-white p-4">
                            <View className="flex-row items-center">
                                <View className="w-11 h-11 rounded-xl bg-red-50 items-center justify-center">
                                    <Ionicons name="phone-portrait-outline" size={22} color="#EF4444" />
                                </View>
                                <View className="flex-1 ml-4">
                                    <Text className="text-xs text-gray-500 mb-1 font-medium">Device ID</Text>
                                    <Text className="text-xs font-semibold text-gray-700" numberOfLines={1}>
                                        {user?.deviceId || 'Not set'}
                                    </Text>
                                </View>
                            </View>
                        </View>
                    </View>
                </View>

                {/* App Information */}
                <View className="mt-6 mx-5">
                    <View className="flex-row items-center mb-4">
                        <View className="w-10 h-10 rounded-xl bg-blue-50 items-center justify-center mr-3">
                            <Ionicons name="apps-outline" size={24} color="#3B82F6" />
                        </View>
                        <Text className="text-lg font-bold text-gray-900">
                            App Information
                        </Text>
                    </View>

                    <View className="bg-white rounded-2xl shadow-lg shadow-gray-200/50 overflow-hidden border border-gray-100">
                        <View className="bg-white p-4 border-b border-gray-100">
                            <View className="flex-row items-center">
                                <View className="w-11 h-11 rounded-xl bg-blue-50 items-center justify-center">
                                    <Ionicons name="information-circle-outline" size={22} color="#3B82F6" />
                                </View>
                                <View className="flex-1 ml-4">
                                    <Text className="text-xs text-gray-500 mb-1 font-medium">Version</Text>
                                    <Text className="text-base font-bold text-gray-900">1.0.0</Text>
                                </View>
                            </View>
                        </View>

                        <View className="bg-white p-4">
                            <View className="flex-row items-center">
                                <View className="w-11 h-11 rounded-xl bg-purple-50 items-center justify-center">
                                    <Ionicons name="code-slash-outline" size={22} color="#9C27B0" />
                                </View>
                                <View className="flex-1 ml-4">
                                    <Text className="text-xs text-gray-500 mb-1 font-medium">Developer</Text>
                                    <Text className="text-base font-bold text-gray-900">miteshhgoyal@gmail.com</Text>
                                </View>
                            </View>
                        </View>
                    </View>
                </View>

                {/* Action Buttons */}
                <View className="px-5 mt-8">
                    {/* Change Password Button */}
                    {/* <TouchableOpacity
                        className="bg-white rounded-2xl h-14 flex-row items-center justify-center mb-3 shadow-lg shadow-gray-200/50 border-2 border-gray-200"
                        onPress={() => Alert.alert('Change Password', 'This feature will be available soon')}
                        activeOpacity={0.7}
                    >
                        <View className="w-9 h-9 rounded-full bg-gray-100 items-center justify-center mr-2">
                            <Ionicons name="key-outline" size={20} color="#6B7280" />
                        </View>
                        <Text className="text-gray-700 text-base font-bold">
                            Change Password
                        </Text>
                    </TouchableOpacity> */}

                    {/* Logout Button */}
                    <TouchableOpacity
                        className="bg-red-500 rounded-2xl h-14 flex-row items-center justify-center shadow-2xl shadow-red-500/30"
                        onPress={handleLogout}
                        activeOpacity={0.8}
                    >
                        <View className="w-9 h-9 rounded-full bg-white/20 items-center justify-center mr-2">
                            <Ionicons name="log-out-outline" size={20} color="#FFFFFF" />
                        </View>
                        <Text className="text-white text-lg font-bold">
                            Logout
                        </Text>
                    </TouchableOpacity>
                </View>
            </ScrollView>
        </SafeAreaView>
    );
}
