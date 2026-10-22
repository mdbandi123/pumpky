import { Image } from 'expo-image';
import type { StyleProp, ImageStyle } from 'react-native';

import type { BasketStyleId } from '../src/features/styles';

const artwork = {
  pumpkin: require('../assets/creatures/pumpkin.png'),
  ghost: require('../assets/creatures/ghost.png'),
  monster: require('../assets/creatures/monster.png'),
};

export function CreatureArt({ design, style }: { design: BasketStyleId; style?: StyleProp<ImageStyle> }) {
  return <Image source={artwork[design]} contentFit="contain" style={style}
    accessible={false} transition={150} />;
}
