// src/assets/npcAvatars.ts

import { SellerArchetype } from "@/api/market";
import { ImageSourcePropType } from "react-native";


export const npcAvatars: Record<
  SellerArchetype,
  ImageSourcePropType
> = {
  merchant: require("./avatar_merchant_1.png"),
  enthusiast: require("./avatar_enthusiast_1.png"),
  old_man: require("./avatar_old_man_1.png"),
  private_owner: require("./avatar_private_owner_1.png"),
  shady_dealer: require("./avatar_shady_dealer_1.png"),
  urgent_sale: require("./avatar_urgent_sale_1.png"),
} as const;