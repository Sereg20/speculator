import type { QueryClient } from "@tanstack/react-query";
import type { Player, PlayerState } from "./player";

export function updatePlayerState(
  queryClient: QueryClient,
  playerState?: PlayerState
) {
  if (!playerState) {
    return;
  }

  queryClient.setQueryData<Player>(
    ["player", "me"],
    (currentPlayer) => {
      if (!currentPlayer) {
        return currentPlayer;
      }

      return {
        ...currentPlayer,
        cash: playerState.cash,
        xp: playerState.xp,
        level: playerState.level,
        energy_current: playerState.energy_current,
        energy_max: playerState.energy_max,
      };
    }
  );
}
