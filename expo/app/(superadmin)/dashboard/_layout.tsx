import { Stack } from 'expo-router';
import React from 'react';

export default function DashboardLayout() {
  return (
    <Stack screenOptions={{ headerStyle: { backgroundColor: '#1A1A2E' }, headerTintColor: '#FFFFFF', headerShadowVisible: false }} />
  );
}
