// src/assets/npcAvatars.ts

import { SellerArchetype } from "@/api/market";
import { ImageSourcePropType } from "react-native";


export const npcAvatars: Record<
  SellerArchetype,
  ImageSourcePropType
> = {
  merchant: require("./avatar_merchant.png"),
  enthusiast: require("./avatar_enthusiast.png"),
  old_man: require("./avatar_old_man.png"),
  private_owner: require("./avatar_private_owner.png"),
  shady_dealer: require("./avatar_shady_dealer.png"),
  urgent_sale: require("./avatar_urgent_sale.png"),
} as const;