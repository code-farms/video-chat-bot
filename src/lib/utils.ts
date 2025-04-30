import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

/**
 * Formats time in seconds to a mm:ss or hh:mm:ss string.
 * @param seconds - The time in seconds.
 * @returns Formatted time string.
 */
export function formatTime(seconds: number): string {
  if (isNaN(seconds) || seconds < 0) {
    return "00:00";
  }

  const totalSeconds = Math.floor(seconds);
  const hours = Math.floor(totalSeconds / 3600);
  const minutes = Math.floor((totalSeconds % 3600) / 60);
  const remainingSeconds = totalSeconds % 60;

  const minutesStr = String(minutes).padStart(2, "0");
  const secondsStr = String(remainingSeconds).padStart(2, "0");

  if (hours > 0) {
    const hoursStr = String(hours).padStart(2, "0");
    return `${hoursStr}:${minutesStr}:${secondsStr}`;
  } else {
    return `${minutesStr}:${secondsStr}`;
  }
}
