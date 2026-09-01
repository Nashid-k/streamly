import React, { useState, useCallback } from 'react';
import { View, Text, StyleSheet, FlatList, TouchableOpacity, Dimensions } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useNavigation, useFocusEffect } from '@react-navigation/native';
import Ionicons from 'react-native-vector-icons/Ionicons';
import MovieCard from '../components/MovieCard';

const { width } = Dimensions.get('window');
const GRID_GAP = 12;
const GRID_CARD_WIDTH = (width - 32 - GRID_GAP) / 2;

export default function WatchlistScreen() {
  const [watchlist, setWatchlist] = useState([]);
  const navigation = useNavigation();

  const loadWatchlist = useCallback(async () => {
    try {
      const stored = await AsyncStorage.getItem('@watchlist');
      setWatchlist(stored ? JSON.parse(stored) : []);
    } catch (e) {
      console.error(e);
    }
  }, []);

  useFocusEffect(
    useCallback(() => {
      loadWatchlist();
    }, [loadWatchlist])
  );

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <View>
          <Text style={styles.headerEyebrow}>My list</Text>
          <Text style={styles.headerTitle}>Watchlist</Text>
        </View>
        {watchlist.length > 0 && (
          <View style={styles.countBadge}>
            <Text style={styles.countText}>{watchlist.length}</Text>
          </View>
        )}
      </View>

      <FlatList
        data={watchlist}
        keyExtractor={(item, index) => (item.id ? item.id.toString() : index.toString())}
        numColumns={2}
        showsVerticalScrollIndicator={false}
        columnWrapperStyle={styles.columnWrapper}
        contentContainerStyle={styles.listContent}
        ListEmptyComponent={() => (
          <View style={styles.emptyContainer}>
            <View style={styles.emptyIconWrap}>
              <Ionicons name="bookmark-outline" size={52} color="#e50914" />
            </View>
            <Text style={styles.emptyText}>Your watchlist is empty.</Text>
            <Text style={styles.emptySubtext}>Save titles you want to keep close and they will appear here.</Text>
          </View>
        )}
        renderItem={({ item }) => {
          const normalizedItem = {
            ...item,
            posterUrl: item.poster_path
              ? item.poster_path.startsWith('http')
                ? item.poster_path
                : `https://image.tmdb.org/t/p/w500${item.poster_path}`
              : null,
          };
          return (
            <View style={[styles.gridItem, { width: GRID_CARD_WIDTH }]}>
              <MovieCard
                item={normalizedItem}
                onPress={() => navigation.navigate('MovieDetails', { movieId: item.id, platform: item.source || 'netflix' })}
              />
            </View>
          );
        }}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f5f5f7', paddingTop: 42, paddingHorizontal: 8 },
  listContent: { paddingHorizontal: 8, paddingBottom: 100 },
  columnWrapper: { justifyContent: 'space-between', marginBottom: 12 },
  gridItem: { marginBottom: 6 },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
    paddingHorizontal: 8,
  },
  headerEyebrow: { color: '#6b7280', fontSize: 12, fontWeight: '700', letterSpacing: 1.2, textTransform: 'uppercase' },
  headerTitle: { color: '#111827', fontSize: 32, fontWeight: '900', letterSpacing: -0.5 },
  countBadge: {
    minWidth: 34,
    height: 34,
    borderRadius: 17,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#e7edf5',
    borderWidth: 1,
    borderColor: 'rgba(17,24,39,0.06)',
    paddingHorizontal: 8,
  },
  countText: { color: '#111827', fontWeight: '800', fontSize: 13 },
  emptyContainer: { flex: 1, justifyContent: 'center', alignItems: 'center', marginTop: 100, paddingHorizontal: 20 },
  emptyIconWrap: {
    width: 90,
    height: 90,
    borderRadius: 45,
    backgroundColor: '#eef2f6',
    borderWidth: 1,
    borderColor: 'rgba(17,24,39,0.06)',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 18,
  },
  emptyText: { color: '#111827', fontSize: 22, fontWeight: '800', marginBottom: 8 },
  emptySubtext: { color: '#667085', fontSize: 15, textAlign: 'center' },
});
