import type { ImageSourcePropType } from "react-native";
import type { CategoryId } from "@/api/market";


export const defectCategoryIcons: Record<CategoryId, ImageSourcePropType>
 = {
  engine: require("./engine.png"),
  transmission: require("./transmission.png"),
  suspension: require("./suspension.png"),
  body: require("./body.png"),
  electrical: require("./electrical.png"),
  interior: require("./interior.png"),
};