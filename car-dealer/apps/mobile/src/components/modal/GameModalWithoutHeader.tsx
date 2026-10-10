import { BlurView } from "expo-blur";
import {
  Modal,
  Pressable,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { colors } from "@/theme/colors";
import AntDesign from '@expo/vector-icons/AntDesign';

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
  energyCost?: number;
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
  confirmHidden,
  energyCost
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
                {energyCost && (
                  <View style={styles.energyCostContainer}>
                    <Text style={styles.energyCost}>{energyCost}</Text>
                    <AntDesign name="thunderbolt" size={15} color={colors.textGold} style={styles.energyIcon}/>
                  </View>
                )}
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
    flexDirection: 'row',
    gap: 8
  },

  buttonText: {
    color: colors.textMain,
    fontSize: 14,
    fontWeight: "bold",
    textShadowColor: "rgba(0, 0, 0, 0.2)",
    textShadowOffset: {
      width: 1,
      height: 1,
    },
    textShadowRadius: 4,
  },

  pressed: {
    opacity: 0.7,
  },

  disabled: {
    opacity: 0.5,
  },

  energyCostContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 2
  },

  energyCost: {
    color: colors.textMain,
    fontWeight: 'bold',
    textShadowColor: "rgba(0, 0, 0, 0.2)",
    textShadowOffset: {
      width: 1,
      height: 1,
    },
    textShadowRadius: 4,
  },

  energyIcon: {
    textShadowColor: "rgba(0, 0, 0, 0.2)",
    textShadowOffset: {
      width: 1,
      height: 1,
    },
    textShadowRadius: 4,
  }
});