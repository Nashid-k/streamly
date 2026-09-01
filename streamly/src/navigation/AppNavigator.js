import React from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import Ionicons from 'react-native-vector-icons/Ionicons';
import { View, StyleSheet } from 'react-native';

// Screens
import HomeScreen from '../screens/HomeScreen';
import SearchScreen from '../screens/SearchScreen';
import WatchlistScreen from '../screens/WatchlistScreen';
import MovieDetailsScreen from '../screens/MovieDetailsScreen';
import PlayerScreen from '../screens/PlayerScreen';
import PersonDetailsScreen from '../screens/PersonDetailsScreen';
import NotificationScreen from '../screens/NotificationScreen';
import DiscoverScreen from '../screens/DiscoverScreen';
import TVShowsScreen from '../screens/TVShowsScreen';
import AnimeScreen from '../screens/AnimeScreen';
import HistoryScreen from '../screens/HistoryScreen';
import LiveTVScreen from '../screens/LiveTVScreen';
import ProfileScreen from '../screens/ProfileScreen';

const Tab = createBottomTabNavigator();
const Stack = createNativeStackNavigator();

export const APP_TABS = ['Home', 'Search', 'TV Shows', 'Anime', 'Discover', 'Watchlist', 'Profile'];

export function MainTabs() {
  return (
    <Tab.Navigator
      screenOptions={({ route }) => ({
        headerShown: false,
        tabBarShowLabel: true,
        tabBarStyle: {
          position: 'absolute',
          backgroundColor: 'rgba(250, 250, 252, 0.82)',
          borderTopWidth: 0,
          elevation: 0,
          height: 82,
          paddingBottom: 22,
          paddingTop: 10,
          shadowColor: '#000',
          shadowOffset: { width: 0, height: -6 },
          shadowOpacity: 0.06,
          shadowRadius: 12,
          borderTopLeftRadius: 20,
          borderTopRightRadius: 20,
          borderWidth: 1,
          borderColor: 'rgba(17,24,39,0.05)',
        },
        tabBarLabelStyle: { fontSize: 10, fontWeight: '700', letterSpacing: 0.2, color: '#1f2937' },
        tabBarIcon: ({ focused, color, size }) => {
          let iconName;
          if (route.name === 'Home') iconName = focused ? 'home' : 'home-outline';
          else if (route.name === 'Search') iconName = focused ? 'search' : 'search-outline';
          else if (route.name === 'TV Shows') iconName = focused ? 'tv' : 'tv-outline';
          else if (route.name === 'Anime') iconName = focused ? 'film' : 'film-outline';
          else if (route.name === 'Discover') iconName = focused ? 'compass' : 'compass-outline';
          else if (route.name === 'Watchlist') iconName = focused ? 'bookmark' : 'bookmark-outline';
          else if (route.name === 'Profile') iconName = focused ? 'person' : 'person-outline';
          return <Ionicons name={iconName} size={22} color={color} />;
        },
        tabBarActiveTintColor: '#111827',
        tabBarInactiveTintColor: '#8a8f98',
        tabBarHideOnKeyboard: true,
      })}
    >
      <Tab.Screen name="Home" component={HomeScreen} />
      <Tab.Screen name="Search" component={SearchScreen} />
      <Tab.Screen name="TV Shows" component={TVShowsScreen} />
      <Tab.Screen name="Anime" component={AnimeScreen} />
      <Tab.Screen name="Discover" component={DiscoverScreen} />
      <Tab.Screen name="Watchlist" component={WatchlistScreen} />
      <Tab.Screen name="Profile" component={ProfileScreen} />
    </Tab.Navigator>
  );
}

export default function AppNavigator() {
  return (
    <NavigationContainer>
      <Stack.Navigator
        screenOptions={{
          headerShown: false,
          contentStyle: { backgroundColor: '#000' },
          animation: 'slide_from_right',
        }}
      >
        <Stack.Screen name="MainTabs" component={MainTabs} />
        <Stack.Screen
          name="Notifications"
          component={NotificationScreen}
          options={{ headerShown: false }}
        />
        <Stack.Screen
          name="MovieDetails"
          component={MovieDetailsScreen}
          options={{ headerShown: false }}
        />
        <Stack.Screen
          name="Player"
          component={PlayerScreen}
          options={{ headerShown: false, presentation: 'fullScreenModal' }}
        />
        <Stack.Screen
          name="PersonDetails"
          component={PersonDetailsScreen}
          options={{
            headerShown: true,
            headerStyle: { backgroundColor: '#09090b' },
            headerTintColor: '#fff',
            headerTitle: 'Actor Profile',
          }}
        />
        <Stack.Screen name="History" component={HistoryScreen} />
        <Stack.Screen name="LiveTV" component={LiveTVScreen} />
      </Stack.Navigator>
    </NavigationContainer>
  );
}
