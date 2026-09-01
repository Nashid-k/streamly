import React, { useState, useCallback } from 'react';
import { View, Text, StyleSheet, FlatList, TouchableOpacity, Dimensions } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useNavigation, useFocusEffect } from '@react-navigation/native';
import MovieCard from '../components/MovieCard';
import Ionicons from 'react-native-vector-icons/Ionicons';

const { width } = Dimensions.get('window');
const GRID_GAP = 12;
const GRID_CARD_WIDTH = (width - 32 - GRID_GAP) / 2;

export default function HistoryScreen() {
  const [history, setHistory] = useState([]);
  const navigation = useNavigation();

  const loadHistory = useCallback(async () => {
    try {
      const stored = await AsyncStorage.getItem('@history');
      setHistory(stored ? JSON.parse(stored) : []);
    } catch (e) {
      console.error(e);
    }
  }, []);

  useFocusEffect(
    useCallback(() => {
      loadHistory();
    }, [loadHistory])
  );

  const clearHistory = async () => {
    try {
      await AsyncStorage.removeItem('@history');
      setHistory([]);
    } catch (e) {
      console.error(e);
    }
  };

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <View>
          <Text style={styles.headerEyebrow}>Recent</Text>
          <Text style={styles.headerTitle}>Watch History</Text>
        </View>
        {history.length > 0 && (
          <TouchableOpacity onPress={clearHistory} style={styles.clearBtn}>
            <Ionicons name="trash-outline" size={18} color="#fff" />
          </TouchableOpacity>
        )}
      </View>

      <FlatList
        data={history}
        keyExtractor={(item, index) => (item.id ? item.id.toString() + index : index.toString())}
        numColumns={2}
        showsVerticalScrollIndicator={false}
        columnWrapperStyle={styles.columnWrapper}
        contentContainerStyle={styles.listContent}
        ListEmptyComponent={() => (
          <View style={styles.emptyContainer}>
            <View style={styles.emptyIconWrap}>
              <Ionicons name="time-outline" size={54} color="#e50914" />
            </View>
            <Text style={styles.emptyText}>No watch history yet.</Text>
            <Text style={styles.emptySubtext}>Movies and shows you watch will appear here for quick resuming.</Text>
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
  container: { flex: 1, backgroundColor: '#f5f5f7', paddingTop: 40, paddingHorizontal: 8 },
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
  clearBtn: {
    width: 38,
    height: 38,
    borderRadius: 19,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#edf1f5',
    borderWidth: 1,
    borderColor: 'rgba(17,24,39,0.06)',
  },
  emptyContainer: { flex: 1, justifyContent: 'center', alignItems: 'center', marginTop: 100, paddingHorizontal: 20 },
  emptyIconWrap: {
    width: 90,
    height: 90,
    borderRadius: 45,
    backgroundColor: '#edf1f5',
    borderWidth: 1,
    borderColor: 'rgba(17,24,39,0.06)',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 18,
  },
  emptyText: { color: '#111827', fontSize: 22, fontWeight: '800', marginBottom: 8 },
  emptySubtext: { color: '#667085', fontSize: 15, textAlign: 'center' },
});
