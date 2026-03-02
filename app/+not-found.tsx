import { Link, Stack } from 'expo-router';
import { StyleSheet, Text, View } from 'react-native';
import { Colors } from '@/constants/colors';

export default function NotFoundScreen() {
  return (
    <>
      <Stack.Screen options={{ title: 'Page introuvable' }} />
      <View style={styles.container}>
        <Text style={styles.emoji}>🏨</Text>
        <Text style={styles.title}>Page introuvable</Text>
        <Link href="/" style={styles.link}>
          <Text style={styles.linkText}>Retour à la réception</Text>
        </Link>
      </View>
    </>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 20,
    backgroundColor: Colors.background,
    gap: 12,
  },
  emoji: {
    fontSize: 48,
  },
  title: {
    fontSize: 18,
    fontWeight: '700',
    color: Colors.text,
  },
  link: {
    marginTop: 12,
    paddingVertical: 10,
    paddingHorizontal: 20,
    backgroundColor: Colors.accent,
    borderRadius: 10,
  },
  linkText: {
    fontSize: 14,
    color: Colors.white,
    fontWeight: '600',
  },
});
