import { View, Text, StyleSheet } from "react-native";
import { colors } from "@/theme/colors";
import { DialogSpeakerType } from "@/types/dialog";

interface DialogMessageProps {
  text: string;
  speaker: DialogSpeakerType;
}

export function DialogMessage({
  text,
  speaker,
}: DialogMessageProps) {
  const isPlayer = speaker === "player";

  return (
    <View
      style={[
        styles.messageContainer,
        isPlayer
          ? styles.playerContainer
          : styles.npcContainer,
      ]}
    >
      <View
        style={[
          styles.message,
          isPlayer ? styles.playerMessage : styles.npcMessage,
        ]}
      >
        <Text style={styles.text}>{text}</Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  messageContainer: {
    width: "100%",
    marginBottom: 10,
  },

  playerContainer: {
    alignItems: "flex-end",
  },

  npcContainer: {
    alignItems: "flex-start",
  },

  message: {
    maxWidth: "80%",
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderRadius: 14,
  },

  playerMessage: {
    backgroundColor: colors.playerMessageColor,
    borderBottomRightRadius: 4,
  },

  npcMessage: {
    backgroundColor: colors.npcMessageColor,
    borderBottomLeftRadius: 4,
  },

  text: {
    color: colors.textMain,
    fontSize: 15,
    lineHeight: 20,
  },
});