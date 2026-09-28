// src/assets/npcAvatars.ts

import { ImageSourcePropType } from "react-native";

export type GarageLevel = 1 | 2 | 3 | 4 | 5;


export const garageBackgrounds: Record<GarageLevel, ImageSourcePropType> = {
  1: require("./background_garage1.png"),
  2: require("./background_garage2.png"),
  3: require("./background_garage3.png"),
  4: require("./background_garage4.png"),
  5: require("./background_garage5.png"),
} as const;

export function getGarageBackground( level: number ): ImageSourcePropType { 
  const normalizedLevel = Math.min( 5, Math.max(1, Math.floor(level)) ) as GarageLevel; 
  return garageBackgrounds[normalizedLevel]; 
}