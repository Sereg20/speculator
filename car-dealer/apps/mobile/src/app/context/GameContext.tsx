// src/context/GameContext.tsx

import {
  createContext,
  useContext,
  useState,
  type ReactNode,
} from "react";

type GameState = {
  level: number;
  xp: number;
  xpToNextLevel: number;
  money: number;
  energy: number;
  maxEnergy: number;
};

type GameContextType = GameState & {
  addXp: (amount: number) => void;
  addMoney: (amount: number) => void;
  spendMoney: (amount: number) => boolean;
  useEnergy: (amount: number) => boolean;
  restoreEnergy: (amount: number) => void;
};

const GameContext = createContext<GameContextType | undefined>(
  undefined
);

export function GameProvider({
  children,
}: {
  children: ReactNode;
}) {
  const [level, setLevel] = useState(12);
  const [xp, setXp] = useState(750);
  const [xpToNextLevel, setXpToNextLevel] = useState(1000);

  const [money, setMoney] = useState(125450);

  const [energy, setEnergy] = useState(72);
  const [maxEnergy] = useState(100);

  const addXp = (amount: number) => {
    setXp((currentXp) => {
      const newXp = currentXp + amount;

      if (newXp >= xpToNextLevel) {
        setLevel((currentLevel) => currentLevel + 1);
        return newXp - xpToNextLevel;
      }

      return newXp;
    });
  };

  const addMoney = (amount: number) => {
    setMoney((currentMoney) => currentMoney + amount);
  };

  const spendMoney = (amount: number) => {
    if (money < amount) {
      return false;
    }

    setMoney((currentMoney) => currentMoney - amount);

    return true;
  };

  const useEnergy = (amount: number) => {
    if (energy < amount) {
      return false;
    }

    setEnergy((currentEnergy) => currentEnergy - amount);

    return true;
  };

  const restoreEnergy = (amount: number) => {
    setEnergy((currentEnergy) =>
      Math.min(currentEnergy + amount, maxEnergy)
    );
  };

  return (
    <GameContext.Provider
      value={{
        level,
        xp,
        xpToNextLevel,
        money,
        energy,
        maxEnergy,
        addXp,
        addMoney,
        spendMoney,
        useEnergy,
        restoreEnergy,
      }}
    >
      {children}
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