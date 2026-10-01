// src/assets/npcAvatars.ts

import { ImageSourcePropType } from "react-native";
import { GarageLevel } from "../backgrounds/garage/garageBackground";


export const garageImgs: Record<GarageLevel, ImageSourcePropType> = {
  1: require("./garage_1.png"),
  2: require("./garage_2.png"),
  3: require("./garage_3.png"),
  4: require("./garage_4.png"),
  5: require("./garage_5.png"),
} as const;

export function getGarageImage( level: number ): ImageSourcePropType { 
  const normalizedLevel = Math.min( 5, Math.max(1, Math.floor(level)) ) as GarageLevel; 
  return garageImgs[normalizedLevel]; 
}