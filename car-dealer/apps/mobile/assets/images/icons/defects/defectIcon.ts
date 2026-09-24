import type { ImageSourcePropType } from "react-native";
import type { CategoryId } from "@/api/market";

export type DefectSeverity = "major" | "minor";

export const defectIcons: Record<
  CategoryId,
  Record<DefectSeverity, ImageSourcePropType>
> = {
  engine: {
    major: require("./defect_engine_major.png"),
    minor: require("./defect_engine_minor.png"),
  },

  transmission: {
    major: require("./defect_transmission_major.png"),
    minor: require("./defect_transmission_minor.png"),
  },

  suspension: {
    major: require("./defect_suspension_major.png"),
    minor: require("./defect_suspension_minor.png"),
  },

  body: {
    major: require("./defect_body_major.png"),
    minor: require("./defect_body_minor.png"),
  },

  electrical: {
    major: require("./defect_electrical_major.png"),
    minor: require("./defect_electrical_minor.png"),
  },

  interior: {
    major: require("./defect_interior_major.png"),
    minor: require("./defect_interior_minor.png"),
  },
};