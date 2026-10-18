import type { ImageSourcePropType } from "react-native";

export const carImages: Record<string, ImageSourcePropType> = {

};

export const placeholderCarImage = require("@/../assets/images/cars/placeholder.webp");

export function getCarImage(
  imageKey?: string | null,
): ImageSourcePropType {
  if (!imageKey) return placeholderCarImage;

  return carImages[imageKey] ?? placeholderCarImage;
}