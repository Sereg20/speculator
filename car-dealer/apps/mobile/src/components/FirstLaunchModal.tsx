
import { useState } from "react";
import {
  ActivityIndicator,
  Modal,
  Pressable,
  StyleSheet,
  Text,
  TextInput,
  View,
} from "react-native";

import { colors } from "@/theme/colors";
import { spacing } from "@/theme/spacing";
import { typography } from "@/theme/typography";

type FirstLaunchModalProps = {
  visible: boolean;
  isSubmitting: boolean;
  error: string | null;
  onConfirm: (displayName: string) => void;
};

export function FirstLaunchModal({
  visible,
  isSubmitting,
  error,
  onConfirm,
}: FirstLaunchModalProps) {
  const [displayName, setDisplayName] = useState("");

  const trimmedName = displayName.trim();
  const canSubmit = trimmedName.length > 0 && !isSubmitting;

  const handleConfirm = () => {
    if (!canSubmit) return;
    onConfirm(trimmedName);
  };

  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      statusBarTranslucent
      onRequestClose={() => {
        // Регистрация необходима для входа в игру.
      }}
    >
      <View style={styles.overlay}>
        <View style={styles.modal}>
          <View style={styles.header}>
            <View style={styles.iconContainer}>
              <Text style={styles.icon}>🚘</Text>
            </View>

            <Text style={styles.title}>Добро пожаловать!</Text>

            <Text style={styles.subtitle}>
              Твоя автомобильная империя начинается здесь.
              Придумай имя для своего дилера.
            </Text>
          </View>

          <View style={styles.form}>
            <Text style={styles.label}>ИМЯ ДИЛЕРА</Text>

            <TextInput
              value={displayName}
              onChangeText={setDisplayName}
              placeholder="Например, Алекс"
              placeholderTextColor={colors.greyColor}
              maxLength={24}
              autoCapitalize="words"
              autoCorrect={false}
              autoFocus
              editable={!isSubmitting}
              returnKeyType="done"
              onSubmitEditing={handleConfirm}
              selectionColor={colors.accentBlueColor}
              style={styles.input}
            />

            <Text style={styles.hint}>
              До 24 символов
            </Text>

            {error ? (
              <View style={styles.errorContainer}>
                <Text style={styles.errorText}>{error}</Text>
              </View>
            ) : null}

            <Pressable
              onPress={handleConfirm}
              disabled={!canSubmit}
              style={({ pressed }) => [
                styles.button,
                !canSubmit && styles.buttonDisabled,
                pressed && canSubmit && styles.buttonPressed,
              ]}
            >
              {isSubmitting ? (
                <ActivityIndicator color="#FFFFFF" />
              ) : (
                <Text style={styles.buttonText}>
                  НАЧАТЬ ИГРУ
                </Text>
              )}
            </Pressable>

            <Text style={styles.footer}>
              Покупай, ремонтируй и продавай автомобили
            </Text>
          </View>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    paddingHorizontal: spacing.lg,
    backgroundColor: "rgba(0, 0, 0, 0.82)",
  },

  modal: {
    width: "100%",
    maxWidth: 420,
    padding: spacing.xl,
    borderRadius: 24,
    backgroundColor: colors.darkBackground,
    borderWidth: 1,
    borderColor: "rgba(255, 255, 255, 0.08)",
    gap: spacing.xl,
    boxShadow: "0px 8px 0px rgba(0, 0, 0, 0.3)",
  },

  header: {
    alignItems: "center",
    gap: spacing.md,
  },

  iconContainer: {
    width: 76,
    height: 76,
    alignItems: "center",
    justifyContent: "center",
    borderRadius: 22,
    backgroundColor: colors.lightBackground,
    borderWidth: 1,
    borderColor: "rgba(255, 255, 255, 0.08)",
  },

  icon: {
    fontSize: 38,
  },

  title: {
    ...typography.title,
    color: colors.textMain,
    textAlign: "center",
  },

  subtitle: {
    ...typography.body,
    color: colors.greyColor,
    textAlign: "center",
    lineHeight: 23,
  },

  form: {
    gap: spacing.sm,
  },

  label: {
    ...typography.button,
    color: colors.greyColor,
    letterSpacing: 1,
  },

  input: {
    minHeight: 54,
    paddingHorizontal: spacing.lg,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: colors.greyColor,
    backgroundColor: colors.mainBackground,
    color: colors.textMain,
    fontSize: 16,
  },

  hint: {
    ...typography.body,
    fontSize: 12,
    color: colors.greyColor,
    textAlign: "right",
  },

  errorContainer: {
    padding: spacing.md,
    borderRadius: 10,
    backgroundColor: "rgba(255, 80, 80, 0.12)",
    borderWidth: 1,
    borderColor: "rgba(255, 80, 80, 0.3)",
  },

  errorText: {
    color: "#FF7777",
    fontSize: 13,
    lineHeight: 19,
  },

  button: {
    minHeight: 56,
    marginTop: spacing.sm,
    alignItems: "center",
    justifyContent: "center",
    borderRadius: 14,
    backgroundColor: colors.blueButtonColor,
    borderBottomWidth: 4,
    borderBottomColor: "rgba(0, 0, 0, 0.25)",
  },

  buttonDisabled: {
    opacity: 0.45,
  },

  buttonPressed: {
    transform: [{ translateY: 2 }],
    borderBottomWidth: 2,
  },

  buttonText: {
    ...typography.button,
    color: "#FFFFFF",
    fontSize: 15,
    letterSpacing: 1,
  },

  footer: {
    marginTop: spacing.xs,
    color: colors.greyColor,
    fontSize: 12,
    textAlign: "center",
  },
});
