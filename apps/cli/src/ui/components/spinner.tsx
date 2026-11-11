import { Text, useAnimation } from "ink";
import { useTheme } from "../theme/theme-context.js";

const FRAMES = ["⠋", "⠙", "⠹", "⠸", "⠼", "⠴", "⠦", "⠧", "⠇", "⠏"];

export const Spinner = () => {
  const { accent } = useTheme();
  const { frame } = useAnimation({ interval: 80 });
  return <Text {...(accent ? { color: accent } : {})}>{FRAMES[frame % FRAMES.length]}</Text>;
};
