import { BlurView } from "expo-blur";
import {
  Modal,
  Pressable,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { colors } from "@/theme/colors";

interface GameModalProps {
  visible: boolean;
  title: string;
  children: React.ReactNode;
  onClose: () => void;
  onConfirm?: () => void;
  confirmText?: string;
  closeText?: string;
  confirmDisabled?: boolean;
  confirmHidden?: boolean;
}

export function GameModal({
  visible,
  title,
  children,
  onClose,
  onConfirm,
  confirmText = "ОК",
  closeText = "ЗАКРЫТЬ",
  confirmDisabled = false,
  confirmHidden = false,
}: GameModalProps) {
  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      onRequestClose={onClose}
    >
      <View style={styles.overlay}>
        <BlurView
          intensity={20}
          tint="dark"
          style={StyleSheet.absoluteFill}
        />

        <View style={styles.darkOverlay} />

        <View style={styles.modal}>
          {/* Header */}
          <View style={styles.header}>
            <Text style={styles.title}>{title}</Text>
          </View>

          {/* Content */}
          <View style={styles.content}>
            {children}
          </View>

          {/* Actions */}
          <View style={styles.actions}>
            <Pressable
              onPress={onClose}
              style={({ pressed }) => [
                styles.button,
                styles.closeButton,
                pressed && styles.pressed,
              ]}
            >
              <Text style={styles.buttonText}>
                {closeText}
              </Text>
            </Pressable>

            { !confirmHidden && 
              <Pressable
                disabled={confirmDisabled}
                onPress={onConfirm}
                style={({ pressed }) => [
                  styles.button,
                  styles.confirmButton,
                  pressed && !confirmDisabled && styles.pressed,
                  confirmDisabled && styles.disabled,
                ]}
              >
                <Text style={styles.buttonText}>
                  {confirmText}
                </Text>
              </Pressable>
            }
          </View>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
  },

  darkOverlay: {
    backgroundColor: "rgba(0, 0, 0, 0.45)",
  },

  modal: {
    width: "88%",
    maxWidth: 500,
    borderRadius: 12,
    overflow: "hidden",
    backgroundColor: colors.darkBackground,
    borderWidth: 2,
    borderColor: colors.lightBackground,
    boxShadow: "0px 4px 20px rgba(0, 0, 0, 0.5)",
  },

  header: {
    minHeight: 50,
    paddingHorizontal: 16,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: colors.mainBackground,
    borderBottomWidth: 1,
    borderBottomColor: colors.lightBackground,
  },

  title: {
    color: colors.textMain,
    fontSize: 18,
    fontWeight: "bold",
    textAlign: "center",
  },

  content: {
    padding: 20,
  },

  actions: {
    flexDirection: "row",
    gap: 10,
    padding: 16,
    borderTopWidth: 1,
    borderTopColor: colors.lightBackground,
  },

  button: {
    flex: 1,
    minHeight: 48,
    borderRadius: 8,
    alignItems: "center",
    justifyContent: "center",
  },

  closeButton: {
    backgroundColor: colors.redButtonColor,
  },

  confirmButton: {
    backgroundColor: colors.greenButton,
  },

  buttonText: {
    color: colors.textMain,
    fontSize: 14,
    fontWeight: "bold",
  },

  pressed: {
    opacity: 0.7,
  },

  disabled: {
    opacity: 0.5,
  },
});