import {
  View,
  StyleSheet,
  FlatList,
} from "react-native";

import {
  DialogMessage,
} from "./DialogMessage";
import { IDialogMessage } from "@/types/dialog";

interface DialogProps {
  messages: IDialogMessage[];
}

export function Dialog({ messages }: DialogProps) {
  return (
    <View style={styles.container}>
      <FlatList
        data={messages}
        keyExtractor={(item) => item.id}
        renderItem={({ item }) => (
          <DialogMessage
            text={item.text}
            speaker={item.speaker}
          />
        )}
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    width: "100%",
    backgroundColor: "#fbf8f8",
  },

  content: {
    padding: 16,
    paddingBottom: 24,
  },
});