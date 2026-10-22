import { FlatList, StyleSheet, View } from 'react-native';

import type { BasketStyle, BasketStyleId } from '../src/features/styles';
import { StyleCard } from './style-card';

export function StyleCarousel({ designs, selectedId, onSelect }: {
  designs: readonly BasketStyle[]; selectedId: BasketStyleId; onSelect: (id: BasketStyleId) => void;
}) {
  return (
    <FlatList horizontal data={designs} extraData={selectedId} keyExtractor={(item) => item.id}
      accessibilityLabel="Basket designs" accessibilityRole="radiogroup" showsHorizontalScrollIndicator={false}
      snapToInterval={116} decelerationRate="fast" contentContainerStyle={styles.content}
      ItemSeparatorComponent={Separator}
      renderItem={({ item }) => <StyleCard design={item} selected={item.id === selectedId}
        onPress={() => onSelect(item.id)} />} />
  );
}

function Separator() { return <View style={styles.separator} />; }
const styles = StyleSheet.create({ content: { paddingHorizontal: 24, paddingBottom: 4 }, separator: { width: 12 } });
