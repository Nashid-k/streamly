import React from 'react';
import { View, Text, StyleSheet, FlatList, TouchableOpacity, Image } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import Ionicons from 'react-native-vector-icons/Ionicons';

const CHANNELS = [
  { id: '1', name: 'Sports Network', category: 'Sports', nowPlaying: 'Live Premier League', viewers: '12.4k' },
  { id: '2', name: 'News 24/7', category: 'News', nowPlaying: 'Global Update', viewers: '8.1k' },
  { id: '3', name: 'Movie Central', category: 'Movies', nowPlaying: 'Inception (2010)', viewers: '15.2k' },
  { id: '4', name: 'Kids Zone', category: 'Kids', nowPlaying: 'SpongeBob Marathon', viewers: '5.6k' },
  { id: '5', name: 'Music Hits', category: 'Music', nowPlaying: 'Top 50 Pop Hits', viewers: '2.3k' },
];

export default function LiveTVScreen() {
  const navigation = useNavigation();

  const handlePlay = (channel) => {
    // In a real app, this would route to PlayerScreen with the live m3u8 stream URL
    // For now we'll just go to the native player with a dummy TMDB id that fails gracefully or plays a random movie
    navigation.navigate('Player', { movieId: '872585', platform: 'netflix' }); // Oppenheimer dummy
  };

  const renderItem = ({ item }) => (
    <TouchableOpacity style={styles.card} onPress={() => handlePlay(item)} activeOpacity={0.8}>
      <View style={styles.thumbnailContainer}>
        <View style={styles.thumbnailPlaceholder}>
          <Ionicons name="tv-outline" size={40} color="#71717a" />
        </View>
        <View style={styles.liveBadge}>
          <Text style={styles.liveText}>LIVE</Text>
        </View>
      </View>
      <View style={styles.infoContainer}>
        <Text style={styles.channelName}>{item.name}</Text>
        <Text style={styles.nowPlaying} numberOfLines={1}>{item.nowPlaying}</Text>
        <View style={styles.metaRow}>
          <Text style={styles.category}>{item.category}</Text>
          <View style={styles.viewersContainer}>
            <Ionicons name="eye" size={14} color="#a1a1aa" />
            <Text style={styles.viewersText}>{item.viewers}</Text>
          </View>
        </View>
      </View>
    </TouchableOpacity>
  );

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Live TV</Text>
      </View>
      <FlatList
        data={CHANNELS}
        keyExtractor={item => item.id}
        renderItem={renderItem}
        contentContainerStyle={styles.listContent}
        showsVerticalScrollIndicator={false}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#09090b' },
  header: { paddingHorizontal: 16, paddingVertical: 12, borderBottomWidth: 1, borderBottomColor: '#27272a' },
  headerTitle: { color: 'white', fontSize: 32, fontWeight: '900' },
  listContent: { padding: 16, paddingBottom: 100 },
  card: { backgroundColor: '#18181b', borderRadius: 16, overflow: 'hidden', marginBottom: 16, flexDirection: 'row' },
  thumbnailContainer: { width: 140, height: 100, backgroundColor: '#27272a' },
  thumbnailPlaceholder: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  liveBadge: { position: 'absolute', top: 8, left: 8, backgroundColor: '#e50914', paddingHorizontal: 6, paddingVertical: 2, borderRadius: 4 },
  liveText: { color: 'white', fontSize: 10, fontWeight: 'bold', letterSpacing: 0.5 },
  infoContainer: { flex: 1, padding: 12, justifyContent: 'center' },
  channelName: { color: 'white', fontSize: 16, fontWeight: 'bold', marginBottom: 4 },
  nowPlaying: { color: '#e4e4e7', fontSize: 14, marginBottom: 8 },
  metaRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  category: { color: '#e50914', fontSize: 12, fontWeight: '600' },
  viewersContainer: { flexDirection: 'row', alignItems: 'center' },
  viewersText: { color: '#a1a1aa', fontSize: 12, marginLeft: 4 }
});
