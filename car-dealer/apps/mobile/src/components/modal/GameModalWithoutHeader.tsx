import { BlurView } from "expo-blur";
import {
  Modal,
  Pressable,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { colors } from "@/theme/colors";

interface GameModalWithoutHeaderProps {
  visible: boolean;
  children: React.ReactNode;
  onClose: () => void;
  onConfirm?: () => void;
  confirmText?: string;
  confirmColor?: string;
  closeText?: string;
  closeColor?: string;
  confirmDisabled?: boolean;
  confirmHidden?: boolean;
}

export function GameModalWithoutHeader({
  visible,
  children,
  onClose,
  onConfirm,
  confirmText,
  confirmColor = colors.greenButton,
  closeText,
  closeColor = colors.redButtonColor,
  confirmDisabled,
  confirmHidden
}: GameModalWithoutHeaderProps) {
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
                {backgroundColor: closeColor},
                pressed && styles.pressed,
              ]}
            >
              <Text style={styles.buttonText}>
                {closeText}
              </Text>
            </Pressable>

            {!confirmHidden &&
              <Pressable
                disabled={confirmDisabled}
                onPress={onConfirm}
                style={({ pressed }) => [
                  styles.button,
                  {backgroundColor: confirmColor},
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
    backgroundColor: colors.mainBackground,
    borderWidth: 2,
    borderColor: colors.lightBackground,
    boxShadow: "0px 4px 20px rgba(0, 0, 0, 0.5)",
  },

  content: {
    padding: 14,
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