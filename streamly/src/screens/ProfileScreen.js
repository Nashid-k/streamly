import React, { useCallback, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  Dimensions,
} from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useFocusEffect, useNavigation } from '@react-navigation/native';
import Ionicons from 'react-native-vector-icons/Ionicons';
import MovieCard from '../components/MovieCard';

const { width } = Dimensions.get('window');

export default function ProfileScreen() {
  const navigation = useNavigation();
  const [watchlist, setWatchlist] = useState([]);
  const [history, setHistory] = useState([]);

  const loadLists = useCallback(async () => {
    try {
      const [watchlistItem, historyItem] = await Promise.all([
        AsyncStorage.getItem('@watchlist'),
        AsyncStorage.getItem('@history'),
      ]);

      setWatchlist(watchlistItem ? JSON.parse(watchlistItem) : []);
      setHistory(historyItem ? JSON.parse(historyItem) : []);
    } catch (err) {
      console.error(err);
    }
  }, []);

  useFocusEffect(
    useCallback(() => {
      loadLists();
    }, [loadLists])
  );

  const normalizeForCard = (item) => ({
    ...item,
    posterUrl: item.poster_path
      ? item.poster_path.startsWith('http')
        ? item.poster_path
        : `https://image.tmdb.org/t/p/w500${item.poster_path}`
      : item.poster || '',
  });

  const quickStats = [
    { label: 'Watchlist', value: String(watchlist.length), icon: 'bookmark' },
    { label: 'History', value: String(history.length), icon: 'time' },
    { label: 'Binge', value: '12h', icon: 'flame' },
  ];

  const featuredItems = [...watchlist, ...history].slice(0, 4);

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
      <View style={styles.headerWrap}>
        <View style={styles.avatarRing}>
          <Text style={styles.avatarText}>S</Text>
        </View>

        <View style={styles.headerDetails}>
          <Text style={styles.eyebrow}>Premium account</Text>
          <Text style={styles.name}>Streamly User</Text>
          <Text style={styles.subText}>Curated for your evening picks</Text>
        </View>

        <TouchableOpacity style={styles.actionBtn} activeOpacity={0.8} onPress={() => navigation.navigate('Home')}>
          <Ionicons name="sparkles" size={18} color="#fff" />
        </TouchableOpacity>
      </View>

      <View style={styles.statsGrid}>
        {quickStats.map((stat) => (
          <View key={stat.label} style={styles.statCard}>
            <Ionicons name={stat.icon} size={18} color="#fff" />
            <Text style={styles.statValue}>{stat.value}</Text>
            <Text style={styles.statLabel}>{stat.label}</Text>
          </View>
        ))}
      </View>

      <View style={styles.sectionHeader}>
        <Text style={styles.sectionTitle}>My Space</Text>
        <Text style={styles.sectionLink}>Edit</Text>
      </View>

      <View style={styles.quickRow}>
        {['My List', 'Continue', 'Downloads', 'Settings'].map((item, idx) => (
          <TouchableOpacity key={item} style={styles.quickTile} activeOpacity={0.85}>
            <Ionicons
              name={['bookmark', 'time', 'download', 'settings'][idx]}
              size={18}
              color="#fff"
            />
            <Text style={styles.quickText}>{item}</Text>
          </TouchableOpacity>
        ))}
      </View>

      <View style={styles.sectionHeader}>
        <Text style={styles.sectionTitle}>Your picks</Text>
        <Text style={styles.sectionLink}>View all</Text>
      </View>

      <View style={styles.cardsRow}>
        {featuredItems.length > 0 ? (
          featuredItems.map((item, index) => (
            <View key={`${item.id || index}-profile`} style={styles.cardWrap}>
              <MovieCard
                item={normalizeForCard(item)}
                onPress={() => navigation.navigate('MovieDetails', { movieId: item.id, platform: item.source || 'netflix' })}
              />
            </View>
          ))
        ) : (
          <Text style={styles.emptyText}>Add titles to your watchlist to build a personal lineup.</Text>
        )}
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f5f5f7' },
  content: { paddingHorizontal: 18, paddingTop: 50, paddingBottom: 120 },
  headerWrap: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 20,
  },
  avatarRing: {
    width: 74,
    height: 74,
    borderRadius: 37,
    backgroundColor: '#111827',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 3,
    borderColor: '#ffffff',
  },
  avatarText: { color: '#fff', fontSize: 30, fontWeight: '900' },
  headerDetails: { flex: 1, marginLeft: 14 },
  eyebrow: { color: '#6b7280', fontSize: 11, fontWeight: '700', letterSpacing: 1.2, textTransform: 'uppercase' },
  name: { color: '#111827', fontSize: 28, fontWeight: '900', letterSpacing: -0.6 },
  subText: { color: '#4b5563', fontSize: 13, marginTop: 4 },
  actionBtn: {
    width: 42,
    height: 42,
    borderRadius: 21,
    backgroundColor: '#ffffff',
    borderWidth: 1,
    borderColor: 'rgba(17,24,39,0.06)',
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.06,
    shadowRadius: 12,
  },
  statsGrid: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 24,
  },
  statCard: {
    flex: 1,
    backgroundColor: '#ffffff',
    borderRadius: 18,
    paddingVertical: 16,
    paddingHorizontal: 12,
    borderWidth: 1,
    borderColor: 'rgba(17,24,39,0.06)',
    alignItems: 'center',
    marginHorizontal: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.04,
    shadowRadius: 10,
  },
  statValue: { color: '#111827', fontSize: 20, fontWeight: '900', marginTop: 10 },
  statLabel: { color: '#6b7280', fontSize: 12, marginTop: 4 },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  sectionTitle: { color: '#111827', fontSize: 20, fontWeight: '900' },
  sectionLink: { color: '#6b7280', fontSize: 12, fontWeight: '700' },
  quickRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 26,
  },
  quickTile: {
    flex: 1,
    backgroundColor: '#ffffff',
    borderRadius: 18,
    paddingVertical: 14,
    paddingHorizontal: 10,
    marginHorizontal: 4,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: 'rgba(17,24,39,0.06)',
  },
  quickText: { color: '#111827', fontSize: 11, marginTop: 8, fontWeight: '700' },
  cardsRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
  },
  cardWrap: {
    width: (width - 54) / 2,
    marginBottom: 16,
  },
  emptyText: {
    color: '#667085',
    fontSize: 15,
    marginTop: 10,
    textAlign: 'center',
    width: '100%',
  },
});
