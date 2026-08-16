import { useAuth } from '@clerk/clerk-expo';
import { useRouter, useSegments } from 'expo-router';
import { useEffect } from 'react';

export default function Index() {
  const { isLoaded, isSignedIn } = useAuth();
  const router = useRouter();
  const segments = useSegments();

  useEffect(() => {
    if (!isLoaded) return;
    
    if (isSignedIn) {
      router.replace('/(app)/home');
    } else {
      router.replace('/(auth)/onboarding');
    }
  }, [isLoaded, isSignedIn, router]);

  return null;
}