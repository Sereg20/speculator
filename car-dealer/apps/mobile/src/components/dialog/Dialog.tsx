import {
  View,
  StyleSheet,
  FlatList,
} from "react-native";

import {
  DialogMessage,
} from "./DialogMessage";
import { IDialogMessage } from "@/types/dialog";
import { Text } from "react-native";
import { colors } from "@/theme/colors";

interface DialogProps {
  messages: IDialogMessage[];
  isLoading: boolean;
}

export function Dialog({ messages, isLoading }: DialogProps) {
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
      {isLoading && <Text style={styles.loading}>... Думает что сказать</Text>}
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

  loading: {
    paddingLeft: 8,
    paddingBottom: 4,
    color: colors.textGray
  }
});