import React from 'react';
import { View, Text, StyleSheet, FlatList, TouchableOpacity } from 'react-native';
import Ionicons from 'react-native-vector-icons/Ionicons';
import { useNavigation } from '@react-navigation/native';
import { SafeAreaView } from 'react-native-safe-area-context';

const NOTIFICATIONS = [
  {
    id: '1',
    title: 'Welcome to Streamly!',
    body: 'Your all-in-one streaming hub is ready. Start exploring movies and TV shows across all platforms.',
    time: 'Just now',
    type: 'system',
    read: false
  },
  {
    id: '2',
    title: 'New Feature: Ad-Free Player',
    body: 'We have upgraded our native video player. Enjoy a seamless, ad-free streaming experience!',
    time: '2 hours ago',
    type: 'update',
    read: true
  },
  {
    id: '3',
    title: 'Watchlist Sync',
    body: 'Your watchlist is now saved locally to your device. Backend sync coming soon.',
    time: '1 day ago',
    type: 'info',
    read: true
  }
];

export default function NotificationScreen() {
  const navigation = useNavigation();

  const renderItem = ({ item }) => (
    <TouchableOpacity style={[styles.notificationCard, !item.read && styles.unreadCard]} activeOpacity={0.8}>
      <View style={styles.iconContainer}>
        <Ionicons 
          name={item.type === 'system' ? 'planet' : item.type === 'update' ? 'flash' : 'information-circle'} 
          size={24} 
          color={!item.read ? '#e50914' : '#a1a1aa'} 
        />
      </View>
      <View style={styles.textContainer}>
        <Text style={[styles.title, !item.read && styles.unreadText]}>{item.title}</Text>
        <Text style={styles.body}>{item.body}</Text>
        <Text style={styles.time}>{item.time}</Text>
      </View>
    </TouchableOpacity>
  );

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn}>
          <Ionicons name="arrow-back" size={24} color="white" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Notifications</Text>
        <View style={{ width: 24 }} />
      </View>
      
      <FlatList
        data={NOTIFICATIONS}
        keyExtractor={item => item.id}
        renderItem={renderItem}
        contentContainerStyle={{ padding: 16 }}
        showsVerticalScrollIndicator={false}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#000' },
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 16, paddingVertical: 12, borderBottomWidth: 1, borderBottomColor: '#27272a' },
  backBtn: { padding: 4 },
  headerTitle: { color: 'white', fontSize: 20, fontWeight: 'bold' },
  notificationCard: { flexDirection: 'row', padding: 16, backgroundColor: '#18181b', borderRadius: 12, marginBottom: 12 },
  unreadCard: { backgroundColor: 'rgba(229,9,20,0.1)', borderWidth: 1, borderColor: 'rgba(229,9,20,0.3)' },
  iconContainer: { marginRight: 16, justifyContent: 'center' },
  textContainer: { flex: 1 },
  title: { color: '#e4e4e7', fontSize: 16, fontWeight: '600', marginBottom: 4 },
  unreadText: { color: 'white', fontWeight: 'bold' },
  body: { color: '#a1a1aa', fontSize: 14, lineHeight: 20, marginBottom: 8 },
  time: { color: '#71717a', fontSize: 12 }
});
