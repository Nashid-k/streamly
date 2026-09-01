import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, FlatList, TouchableOpacity, ScrollView, TextInput, ActivityIndicator, Dimensions } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import Ionicons from 'react-native-vector-icons/Ionicons';
import { movieService } from '../api/movieService';
import MovieCard from '../components/MovieCard';

const { width } = Dimensions.get('window');

const GENRES = [
  { id: 'all', name: 'All' },
  { id: 'action', name: 'Action' },
  { id: 'comedy', name: 'Comedy' },
  { id: 'drama', name: 'Drama' },
  { id: 'horror', name: 'Horror' },
  { id: 'scifi', name: 'Sci-Fi' },
  { id: 'thriller', name: 'Thriller' },
];

const PLATFORMS = ['all', 'netflix', 'prime', 'hotstar', 'appletv', 'jio'];

export default function DiscoverScreen() {
  const navigation = useNavigation();
  const [selectedGenre, setSelectedGenre] = useState('all');
  const [selectedPlatform, setSelectedPlatform] = useState('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [movies, setMovies] = useState([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    fetchDiscover();
  }, [selectedGenre, selectedPlatform, searchQuery]);

  const fetchDiscover = async () => {
    setLoading(true);
    try {
      let results = [];
      if (searchQuery.trim().length > 0) {
        const data = await movieService.searchMovies(searchQuery);
        results = data.movies || data || [];
      } else {
        const data = await movieService.getFeaturedMovies();
        if (Array.isArray(data)) {
          results = data;
        } else if (data && typeof data === 'object') {
          Object.values(data).forEach((arr) => {
            if (Array.isArray(arr)) {
              results = [...results, ...arr];
            }
          });
        }
      }

      if (selectedPlatform !== 'all' && selectedPlatform) {
        results = results.filter((m) => {
          const plat = (m.platform || m.source || '').toLowerCase();
          return plat.includes(selectedPlatform.toLowerCase()) || plat === 'all';
        });
      }

      if (selectedGenre !== 'all') {
        results = results.filter((m) => {
          if (!m.genres) return false;
          return m.genres.some((g) => g.toLowerCase().includes(selectedGenre));
        });
      }

      const uniqueResults = Array.from(new Map(results.map((item) => [item.id || item.tmdbId, item])).values());
      setMovies(uniqueResults);
    } catch (err) {
      console.error(err);
    }
    setLoading(false);
  };

  const renderHeader = () => (
    <View style={styles.header}>
      <View style={styles.headerTopRow}>
        <Text style={styles.headerTitle}>Discover</Text>
        <TouchableOpacity
          style={styles.clearFilterBtn}
          activeOpacity={0.8}
          onPress={() => {
            setSelectedGenre('all');
            setSelectedPlatform('all');
            setSearchQuery('');
          }}
        >
          <Text style={styles.clearFilterText}>Reset</Text>
        </TouchableOpacity>
      </View>

      <View style={styles.searchBar}>
        <Ionicons name="search" size={20} color="#a1a1aa" />
        <TextInput
          style={styles.searchInput}
          placeholder="Search movies, shows, genres..."
          placeholderTextColor="#71717a"
          value={searchQuery}
          onChangeText={setSearchQuery}
        />
        {searchQuery.length > 0 && (
          <TouchableOpacity onPress={() => setSearchQuery('')} activeOpacity={0.8}>
            <Ionicons name="close-circle" size={18} color="#a1a1aa" />
          </TouchableOpacity>
        )}
      </View>

      <Text style={styles.sectionTitle}>Platform</Text>
      <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.filterRow} contentContainerStyle={styles.filterRowContent}>
        {PLATFORMS.map((p) => (
          <TouchableOpacity
            key={p}
            style={[styles.filterPill, selectedPlatform === p && styles.filterPillActive]}
            onPress={() => setSelectedPlatform(p)}
          >
            <Text style={[styles.filterText, selectedPlatform === p && styles.filterTextActive]}>
              {p === 'all' ? 'All' : p.toUpperCase()}
            </Text>
          </TouchableOpacity>
        ))}
      </ScrollView>

      <Text style={styles.sectionTitle}>Genres</Text>
      <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.filterRow} contentContainerStyle={styles.filterRowContent}>
        {GENRES.map((g) => (
          <TouchableOpacity
            key={g.id}
            style={[styles.filterPill, selectedGenre === g.id && styles.filterPillActive]}
            onPress={() => setSelectedGenre(g.id)}
          >
            <Text style={[styles.filterText, selectedGenre === g.id && styles.filterTextActive]}>
              {g.name}
            </Text>
          </TouchableOpacity>
        ))}
      </ScrollView>
    </View>
  );

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <FlatList
        ListHeaderComponent={renderHeader}
        data={movies}
        keyExtractor={(item, index) => `${item.id}-${index}`}
        numColumns={2}
        contentContainerStyle={styles.listContent}
        columnWrapperStyle={styles.columnWrapper}
        renderItem={({ item }) => (
          <View style={{ width: (width - 48) / 2, marginBottom: 16 }}>
            <MovieCard
              item={item}
              onPress={() => navigation.navigate('MovieDetails', { movieId: item.id || item.tmdbId, platform: item.platform || selectedPlatform })}
            />
          </View>
        )}
        ListEmptyComponent={() => (
          <View style={styles.emptyContainer}>
            {loading ? (
              <ActivityIndicator color="#e50914" size="large" />
            ) : (
              <>
                <Ionicons name="sparkles-outline" size={32} color="#e50914" />
                <Text style={styles.emptyText}>No results found.</Text>
                <Text style={styles.emptyHint}>Refine your filters or try a broader search.</Text>
              </>
            )}
          </View>
        )}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f5f5f7' },
  listContent: { padding: 16, paddingBottom: 100 },
  header: { marginBottom: 24 },
  headerTopRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
    paddingTop: 10,
  },
  headerTitle: { color: '#111827', fontSize: 34, fontWeight: '900', letterSpacing: -0.8 },
  clearFilterBtn: {
    backgroundColor: '#ffffff',
    borderRadius: 999,
    borderWidth: 1,
    borderColor: 'rgba(17,24,39,0.08)',
    paddingHorizontal: 12,
    paddingVertical: 7,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.04,
    shadowRadius: 10,
  },
  clearFilterText: { color: '#1f2937', fontSize: 12, fontWeight: '700' },
  searchBar: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#ffffff',
    borderRadius: 20,
    paddingHorizontal: 12,
    height: 54,
    marginBottom: 22,
    borderWidth: 1,
    borderColor: 'rgba(17,24,39,0.06)',
  },
  searchInput: { flex: 1, color: '#111827', marginLeft: 8, fontSize: 16 },
  sectionTitle: { color: '#111827', fontSize: 16, fontWeight: '800', marginBottom: 12, letterSpacing: 0.2 },
  filterRow: { flexDirection: 'row', marginBottom: 24 },
  filterRowContent: { paddingRight: 18 },
  filterPill: {
    paddingHorizontal: 16,
    paddingVertical: 9,
    borderRadius: 20,
    backgroundColor: '#ffffff',
    borderWidth: 1,
    borderColor: 'rgba(17,24,39,0.06)',
    marginRight: 10,
  },
  filterPillActive: { backgroundColor: '#111827', borderColor: '#111827' },
  filterText: { color: '#4b5563', fontWeight: '700' },
  filterTextActive: { color: '#ffffff' },
  columnWrapper: { justifyContent: 'space-between' },
  emptyContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: 220,
    paddingHorizontal: 24,
    paddingVertical: 36,
    backgroundColor: '#ffffff',
    borderRadius: 18,
    borderWidth: 1,
    borderColor: 'rgba(17,24,39,0.05)',
    marginTop: 10,
  },
  emptyText: { color: '#111827', fontSize: 18, fontWeight: '800', marginTop: 12 },
  emptyHint: { color: '#6b7280', fontSize: 13, marginTop: 8, textAlign: 'center' },
});
