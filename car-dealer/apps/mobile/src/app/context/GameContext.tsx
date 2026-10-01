// src/context/GameContext.tsx

import { ErrorModal } from "@/components/modal/ErrorModal";
import {
  createContext,
  useContext,
  useState,
  type ReactNode,
} from "react";

type GameState = {
};

type GameContextType = GameState & {
  showError: (message: string, title?: string) => void;
  hideError: () => void;
};

type GameError = {
  title?: string;
  message: string;
};

const GameContext = createContext<GameContextType | undefined>(
  undefined
);

export function GameProvider({
  children,
}: {
  children: ReactNode;
}) {
  const [gameError, setGameError] = useState<GameError | null>(null);

  function showError(message: string, title = "ОШИБКА") {
    setGameError({
      title,
      message,
    });
  }

  function hideError() {
    setGameError(null);
  }

  return (
    <GameContext.Provider
      value={{
        showError,
        hideError,
      }}
    >
      {children}
      {gameError && (
        <ErrorModal
          visible
          title={gameError.title}
          message={gameError.message}
          onClose={hideError}
        />
      )}
    </GameContext.Provider>
  );
}

export function useGame() {
  const context = useContext(GameContext);

  if (!context) {
    throw new Error(
      "useGame must be used inside GameProvider"
    );
  }

  return context;
}