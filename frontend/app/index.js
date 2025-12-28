import React, { useEffect } from 'react';
import { View, ActivityIndicator } from 'react-native';
import { Redirect, useRouter } from 'expo-router';
import { useAuth } from '@/contexts/AuthContext';
import './globals.css';

function Index() {
    const { isAuthenticated, loading } = useAuth();
    const router = useRouter();

    useEffect(() => {
        if (!loading) {
            if (isAuthenticated) {
                router.replace('/(tabs)');
            } else {
                router.replace('/(auth)/login');
            }
        }
    }, [isAuthenticated, loading]);

    // Show loading while checking auth state
    if (loading) {
        return (
            <View className="flex-1 bg-[#1F8A70] items-center justify-center">
                <ActivityIndicator size="large" color="#FFFFFF" />
            </View>
        );
    }

    // Redirect based on auth state
    return isAuthenticated ? (
        <Redirect href="/(tabs)" />
    ) : (
        <Redirect href="/(auth)/login" />
    );
}

export default Index;
