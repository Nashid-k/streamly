import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, FlatList, ActivityIndicator } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { movieService } from '../api/movieService';
import MovieCard from '../components/MovieCard';

export default function CategoryScreen() {
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const navigation = useNavigation();

  useEffect(() => {
    movieService.getCategories('all').then(data => {
      // Filter out empty categories
      const validCategories = data.filter(c => c.movies && c.movies.length > 0);
      setCategories(validCategories);
      setLoading(false);
    }).catch(err => {
      console.error(err);
      setLoading(false);
    });
  }, []);

  const renderCategoryRow = ({ item }) => (
    <View style={styles.categoryRow}>
      <Text style={styles.categoryTitle}>{item.name}</Text>
      <FlatList
        horizontal
        data={item.movies}
        keyExtractor={(movie, idx) => movie.id ? movie.id.toString() + idx : idx.toString()}
        showsHorizontalScrollIndicator={false}
        renderItem={({ item: movie }) => {
          const normalizedItem = {
            ...movie,
            posterUrl: movie.poster_path ? (movie.poster_path.startsWith('http') ? movie.poster_path : `https://image.tmdb.org/t/p/w500${movie.poster_path}`) : null
          };
          return (
            <MovieCard 
              item={normalizedItem}
              onPress={() => navigation.navigate('MovieDetails', { movieId: movie.id, platform: movie.source || 'netflix' })}
            />
          );
        }}
      />
    </View>
  );

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#e50914" />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <Text style={styles.headerTitle}>Categories</Text>
      <FlatList
        data={categories}
        keyExtractor={(item, idx) => item.name || idx.toString()}
        renderItem={renderCategoryRow}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ paddingBottom: 100 }}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#000', paddingTop: 40 },
  loadingContainer: { flex: 1, backgroundColor: '#000', justifyContent: 'center', alignItems: 'center' },
  headerTitle: { color: 'white', fontSize: 32, fontWeight: '900', marginBottom: 16, paddingHorizontal: 16, letterSpacing: -0.5 },
  categoryRow: { marginBottom: 24 },
  categoryTitle: { color: 'white', fontSize: 20, fontWeight: 'bold', marginBottom: 12, paddingHorizontal: 16 }
});
