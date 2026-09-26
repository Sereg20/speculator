import { useEffect, useState } from "react";
import { Text, type StyleProp, type TextStyle } from "react-native";

interface CountdownTimerProps {
  endsAt: string | Date;
  onComplete?: () => void;
  style?: StyleProp<TextStyle>;
}

function getRemainingSeconds(endsAt: string | Date): number {
  const endTime =
    endsAt instanceof Date
      ? endsAt.getTime()
      : new Date(endsAt).getTime();

  return Math.max(0, Math.ceil((endTime - Date.now()) / 1000));
}

function formatTime(totalSeconds: number): string {
  const hours = Math.floor(totalSeconds / 3600);
  const minutes = Math.floor((totalSeconds % 3600) / 60);
  const seconds = totalSeconds % 60;

  return [
    hours.toString().padStart(2, "0"),
    minutes.toString().padStart(2, "0"),
    seconds.toString().padStart(2, "0"),
  ].join(":");
}

export function CountdownTimer({
  endsAt,
  onComplete,
  style,
}: CountdownTimerProps) {
  const [remainingSeconds, setRemainingSeconds] = useState(() =>
    getRemainingSeconds(endsAt)
  );

  useEffect(() => {
    const updateTimer = () => {
      const remaining = getRemainingSeconds(endsAt);

      setRemainingSeconds(remaining);

      if (remaining === 0) {
        onComplete?.();
      }
    };

    updateTimer();

    const interval = setInterval(updateTimer, 1000);

    return () => {
      clearInterval(interval);
    };
  }, [endsAt, onComplete]);

  return (
    <Text style={style}>
      {formatTime(remainingSeconds)}
    </Text>
  );
}