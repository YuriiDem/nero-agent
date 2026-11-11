import { createContext, useContext } from "react";
import { createTheme, type Theme } from "./theme.js";

export const ThemeContext = createContext<Theme>(createTheme());

export const useTheme = (): Theme => useContext(ThemeContext);
