import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useState,
  type ReactNode,
} from "react";
import {
  ActivityIndicator,
  Pressable,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { useQueryClient } from "@tanstack/react-query";

import { getPlayer } from "@/api/player";
import { registerPlayer } from "@/api/auth";
import { ApiError } from "@/api/client";
import { getDeviceId } from "@/auth/deviceId";
import {
  getToken,
  setToken,
  removeToken,
} from "@/auth/tokenStorage";
import { FirstLaunchModal } from "@/components/FirstLaunchModal";
import { colors } from "@/theme/colors";

type AuthStatus = "checking" | "registration" | "ready" | "error";

const AuthContext = createContext({
  isAuthenticated: false,
});

export function useAuth() {
  return useContext(AuthContext);
}

type AuthGateProps = {
  children: ReactNode;
};

export function AuthGate({ children }: AuthGateProps) {
  const queryClient = useQueryClient();

  const [status, setStatus] = useState<AuthStatus>("checking");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const checkSession = useCallback(async () => {
    setStatus("checking");
    setErrorMessage(null);

    try {
      const token = await getToken();

      if (!token) {
        setStatus("registration");
        return;
      }

      try {
        const player = await getPlayer();

        queryClient.setQueryData(["player", "me"], player);
        setStatus("ready");
      } catch (error) {
        if (
          error instanceof ApiError &&
          (error.status === 401 || error.status === 403)
        ) {
          await removeToken();
          queryClient.removeQueries({ queryKey: ["player"] });
          setStatus("registration");
          return;
        }

        // Например, при сетевой ошибке не отправляем
        // игрока на повторную регистрацию.
        throw error;
      }
    } catch (error) {
      setErrorMessage("Что-то пошло не так");
      setStatus("error");
    }
  }, [queryClient]);

  useEffect(() => {
    void checkSession();
  }, [checkSession]);

  const handleRegister = async (displayName: string) => {
    if (isSubmitting) return;

    setIsSubmitting(true);
    setErrorMessage(null);

    try {
      const deviceId = await getDeviceId();

      const result = await registerPlayer({
        deviceId,
        displayName: displayName.trim(),
      });

      // Сохраняем токен до открытия игры.
      await setToken(result.token);

      // Сразу обновляем кеш игрока.
      queryClient.setQueryData(["player", "me"], result.player);

      setStatus("ready");
    } catch (error) {
      setErrorMessage("Что-то пошло не так");
    } finally {
      setIsSubmitting(false);
    }
  };

  if (status === "checking") {
    return (
      <View style={styles.fullScreen}>
        <ActivityIndicator
          size="large"
          color={colors.blueButtonColor}
        />
      </View>
    );
  }

  if (status === "error") {
    return (
      <View style={styles.fullScreen}>
        <Text style={styles.title}>Не удалось подключиться</Text>

        <Text style={styles.message}>
          {errorMessage ?? "Попробуй ещё раз."}
        </Text>

        <Pressable style={styles.button} onPress={() => void checkSession()}>
          <Text style={styles.buttonText}>Повторить</Text>
        </Pressable>
      </View>
    );
  }

  return (
    <AuthContext.Provider
      value={{ isAuthenticated: status === "ready" }}
    >
      {children}

      <FirstLaunchModal
        visible={status === "registration"}
        isSubmitting={isSubmitting}
        error={errorMessage}
        onConfirm={handleRegister}
      />
    </AuthContext.Provider>
  );
}

const styles = StyleSheet.create({
  fullScreen: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    padding: 24,
    gap: 16,
    backgroundColor: colors.mainBackground,
  },
  title: {
    color: colors.textMain,
    fontSize: 22,
    fontWeight: "700",
  },
  message: {
    color: colors.greyColor,
    textAlign: "center",
  },
  button: {
    paddingHorizontal: 24,
    paddingVertical: 14,
    borderRadius: 12,
    backgroundColor: colors.blueButtonColor,
  },
  buttonText: {
    color: "#FFFFFF",
    fontWeight: "700",
  },
});