
import { useState } from "react";
import {
  ActivityIndicator,
  Image,
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
              <Image
                source={require('@/assets/images/icon_formatter.webp')}
                style={styles.icon}
                resizeMode="cover"/>
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
    backgroundColor: colors.darkBackground,
  },

  modal: {
    width: "100%",
    maxWidth: 420,
    padding: spacing.xl,
    borderRadius: 16,
    backgroundColor: colors.mainBackground,
    borderWidth: 2,
    gap: spacing.xl,
    borderColor: 'rgba(73, 225, 255, 0.8)',
    boxShadow: "0px 0px 10px rgba(73, 225, 255, 0.6)",
  },

  header: {
    alignItems: "center",
    gap: spacing.md,
  },

  iconContainer: {
    overflow: 'hidden',
    width: 80,
    height: 80,
    alignItems: "center",
    justifyContent: "center",
    borderRadius: 10,
    backgroundColor: colors.lightBackground,
    borderWidth: 1.5,
    borderColor: 'rgba(73, 225, 255, 0.3)',
    boxShadow: "0px 0px 10px rgba(73, 225, 255, 0.6)",
  },

  icon: {
    width: '100%',
    height: '100%'
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
    lineHeight: 20,
  },

  form: {
    gap: spacing.sm,
  },

  label: {
    ...typography.button,
    color: colors.greyColor,
  },

  input: {
    minHeight: 54,
    paddingHorizontal: spacing.lg,
    borderRadius: 8,
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
    borderRadius: 8,
    backgroundColor: "rgba(255, 80, 80, 0.12)",
  },

  errorText: {
    color: colors.textRed,
    fontSize: 13,
    lineHeight: 19,
    textShadowColor: "rgba(0, 0, 0, 0.3)",
    textShadowOffset: {
      width: 1,
      height: 1,
    },
    textShadowRadius: 4,
  },

  button: {
    minHeight: 56,
    marginTop: spacing.sm,
    alignItems: "center",
    justifyContent: "center",
    borderRadius: 8,
    backgroundColor: colors.blueButtonColor,
  },

  buttonDisabled: {
    opacity: 0.45,
  },

  buttonPressed: {
    opacity: 0.8
  },

  buttonText: {
    ...typography.button,
    color: colors.textMain,
    fontWeight: 'bold',
    fontSize: 15,
    textShadowColor: "rgba(0, 0, 0, 0.3)",
    textShadowOffset: {
      width: 1,
      height: 1,
    },
    textShadowRadius: 4,
  },

  footer: {
    marginTop: spacing.xs,
    color: colors.greyColor,
    fontSize: 12,
    textAlign: "center",
  },
});
