import { Stack } from 'expo-router';
import { StatusBar } from 'react-native';

export default function AuthLayout() {
    return (
        <>
            <StatusBar barStyle="dark-content" backgroundColor="#FFFFFF" />
            <Stack
                screenOptions={{
                    headerShown: false,
                    contentStyle: { backgroundColor: '#FFFFFF' },
                    animation: 'slide_from_right'
                }}
            >
                <Stack.Screen name="login" />
                <Stack.Screen name="signup" />
            </Stack>
        </>
    );
}