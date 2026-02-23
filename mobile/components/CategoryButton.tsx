import React from 'react';
import { TouchableOpacity, Text, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Colors } from '../constants/Colors';
import { Category } from '../types';

interface CategoryButtonProps {
  category: Category;
  onPress: (category: Category) => void;
}

export function CategoryButton({ category, onPress }: CategoryButtonProps) {
  return (
    <TouchableOpacity
      style={styles.button}
      onPress={() => onPress(category)}
      activeOpacity={0.7}
    >
      <Ionicons
        name={category.icon as any}
        size={28}
        color={Colors.primary}
        style={styles.icon}
      />
      <Text style={styles.label}>{category.label}</Text>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  button: {
    width: '48%',
    backgroundColor: Colors.surface,
    borderRadius: 14,
    padding: 16,
    alignItems: 'center',
    marginBottom: 12,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  icon: {
    marginBottom: 8,
  },
  label: {
    color: Colors.text,
    fontSize: 13,
    fontWeight: '600',
    textAlign: 'center',
  },
});
