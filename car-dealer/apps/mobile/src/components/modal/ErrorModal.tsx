
import {
  StyleSheet,
  Text,
  View,
} from "react-native";

import { colors } from "@/theme/colors";
import { GameModal } from "@/components/modal/GameModal";


interface ErrorModalProps {
  visible: boolean;
  onClose: () => void;
  title?: string;
  message: string;
}

export function ErrorModal({
  visible, onClose, title = "ОШИБКА", message
}: ErrorModalProps) {

  return (
    <GameModal
      visible={visible}
      onClose={onClose}
      title={title}
      closeText="ЗАКРЫТЬ"
      confirmHidden={true}
    >
      <View style={styles.container}>

       <Text style={styles.text}>{message}</Text>
        
      </View>
    </GameModal>
  );
}

const styles = StyleSheet.create({

  container: {
    width: '100%',
  },

  text: {
    color: colors.textMain
  }

 
});