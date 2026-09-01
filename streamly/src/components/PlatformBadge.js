import React from 'react';
import { View, Text, StyleSheet } from 'react-native';

export default function PlatformBadge({ platform, style }) {
  if (!platform) return null;
  const plat = platform.toLowerCase();
  
  let backgroundColor = '#000';
  let label = 'VOD';
  
  if (plat === 'netflix') {
    backgroundColor = '#E50914';
    label = 'N';
  } else if (plat === 'hulu') {
    backgroundColor = '#1CE783';
    label = 'hulu';
  } else if (plat === 'disney' || plat === 'disneyplus') {
    backgroundColor = '#113CCF';
    label = 'D+';
  } else if (plat === 'amazon' || plat === 'prime') {
    backgroundColor = '#00A8E1';
    label = 'prime';
  } else if (plat === 'hbo' || plat === 'max') {
    backgroundColor = '#5822B4';
    label = 'MAX';
  } else if (plat === 'apple') {
    backgroundColor = '#333333';
    label = 'tv+';
  }

  return (
    <View style={[styles.badge, { backgroundColor }, style]}>
      <Text style={styles.text}>{label}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  badge: {
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
    justifyContent: 'center',
    alignItems: 'center',
  },
  text: {
    color: 'white',
    fontSize: 10,
    fontWeight: 'bold',
  }
});
