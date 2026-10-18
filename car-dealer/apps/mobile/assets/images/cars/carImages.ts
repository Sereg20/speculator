import type { ImageSourcePropType } from "react-native";

export const carImages: Record<string, ImageSourcePropType> = {
  volkswagen_polo_iii: require("@/../assets/images/cars/volkswagen_polo_iii.jpeg"),
  volkswagen_tiguan_i: require("@/../assets/images/cars/volkswagen_tiguan_i.jpeg"),

};

export const placeholderCarImage = require("@/../assets/images/cars/placeholder.webp");

export function getCarImage(
  imageKey?: string | null,
): ImageSourcePropType {
  if (!imageKey) return placeholderCarImage;

  return carImages[imageKey] ?? placeholderCarImage;
}