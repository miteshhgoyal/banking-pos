import React, { useEffect, useState } from 'react';
import { Stack, useSegments, useRouter, useRootNavigationState } from 'expo-router';
import { StatusBar, View, ActivityIndicator, Text } from 'react-native';
import { AuthProvider, useAuth } from '@/contexts/AuthContext';
import './globals.css';

function NavigationContent() {
    const { isAuthenticated, loading } = useAuth();
    const segments = useSegments();
    const router = useRouter();
    const navigationState = useRootNavigationState();
    const [isNavigationReady, setIsNavigationReady] = useState(false);

    useEffect(() => {
        if (navigationState?.key) {
            setIsNavigationReady(true);
        }
    }, [navigationState]);

    useEffect(() => {
        if (!isNavigationReady || loading) return;

        const inAuthGroup = segments[0] === '(auth)';

        if (!isAuthenticated && !inAuthGroup) {
            router.replace('/(auth)/login');
        } else if (isAuthenticated && inAuthGroup) {
            router.replace('/(tabs)');
        }
    }, [isAuthenticated, segments, isNavigationReady, loading]);

    if (!isNavigationReady || loading) {
        return (
            <View className="flex-1 bg-[#1F8A70] items-center justify-center font-primary">
                <ActivityIndicator size="large" color="#FFFFFF" />
                <Text className="text-white mt-4 text-base font-semibold">
                    {loading ? 'Loading...' : 'Initializing...'}
                </Text>
            </View>
        );
    }

    return (
        <View className="flex-1 font-primary">
            <StatusBar barStyle="dark-content" backgroundColor="#1F8A70" />
            <Stack screenOptions={{ headerShown: false }}>
                <Stack.Screen
                    name="(auth)"
                    options={{
                        headerShown: false,
                        animation: 'fade',
                    }}
                />
                <Stack.Screen
                    name="(tabs)"
                    options={{
                        headerShown: false,
                        animation: 'fade',
                    }}
                />
                <Stack.Screen
                    name="index"
                    options={{
                        headerShown: false,
                    }}
                />
            </Stack>
        </View>
    );
}

export default function RootLayout() {
    return (
        <AuthProvider>
            <NavigationContent />
        </AuthProvider>
    );
}
