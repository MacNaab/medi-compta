<<<<<<< Updated upstream
import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"
=======
import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";
>>>>>>> Stashed changes

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}
