import { createContext, useContext, useState } from "react";

const ThemeContext = createContext();

// Define preset color schemes
const presetThemes = {
  light: {
    theme: "light",
    primaryColor: "#282469", // Dark Blue
    backgroundColor: "#ffffff",
    layoutType: "full",
    contentBgColor: "#F3F4F6", // Gray-100
    headerBgColor: "#ffffff",
    headerGradient: "",
    sidebarBgColor: "#ffffff",
    footerBgColor: "#F3F4F6",
  },
  blue: {
    theme: "light",
    primaryColor: "#0ea5e9", // Sky-500
    backgroundColor: "#f0f9ff",
    layoutType: "full",
    contentBgColor: "#f8fafc",
    headerBgColor: "#ffffff",
    headerGradient: "linear-gradient(to right, #0ea5e9, #2563eb)", // Sky to Blue
    sidebarBgColor: "#ffffff",
    footerBgColor: "#f0f9ff",
  },
  purple: {
    theme: "light",
    primaryColor: "#8b5cf6", // Violet-500
    backgroundColor: "#f5f3ff",
    layoutType: "full",
    contentBgColor: "#faf5ff",
    headerBgColor: "#ffffff",
    headerGradient: "linear-gradient(to right, #8b5cf6, #d946ef)",
    sidebarBgColor: "#ffffff",
    footerBgColor: "#f5f3ff",
  },
  green: {
    theme: "light",
    primaryColor: "#10b981", // Emerald-500
    backgroundColor: "#ecfdf5",
    layoutType: "full",
    contentBgColor: "#f0fdf4",
    headerBgColor: "#ffffff",
    headerGradient: "linear-gradient(to right, #10b981, #059669)",
    sidebarBgColor: "#ffffff",
    footerBgColor: "#ecfdf5",
  },
  dark: {
    theme: "dark",
    primaryColor: "#6366f1", // Indigo-500
    backgroundColor: "#111827", // Gray-900
    layoutType: "full",
    contentBgColor: "#1f2937", // Gray-800
    headerBgColor: "#111827",
    headerGradient: "",
    sidebarBgColor: "#111827",
    footerBgColor: "#111827",
  },
};

const defaultTheme = presetThemes.light;

// Helper to get stored theme or default
const getStoredTheme = (key, defaultValue) => {
  try {
    const storedValue = localStorage.getItem(`theme_${key}`);
    return storedValue ? JSON.parse(storedValue) : defaultValue;
  } catch (error) {
    console.error(`Error retrieving theme setting ${key}:`, error);
    return defaultValue;
  }
};

const createMildColor = (hexColor) => {
  if (!hexColor) return "#f3f4f6";
  // If it's already a mild color, return it, logic implies mixing with white
  // Convert hex to RGB
  const r = parseInt(hexColor.slice(1, 3), 16);
  const g = parseInt(hexColor.slice(3, 5), 16);
  const b = parseInt(hexColor.slice(5, 7), 16);

  // Make it milder by mixing with white (255,255,255)
  const mildFactor = 0.95; // Increased factor for very subtle tint
  const mildR = Math.round(r * mildFactor + 255 * (1 - mildFactor));
  const mildG = Math.round(g * mildFactor + 255 * (1 - mildFactor));
  const mildB = Math.round(b * mildFactor + 255 * (1 - mildFactor));

  // Convert back to hex
  return `#${mildR.toString(16).padStart(2, "0")}${mildG
    .toString(16)
    .padStart(2, "0")}${mildB.toString(16).padStart(2, "0")}`;
};

// Define common color schemes
const commonColorSchemes = [
  {
    name: "Modern Clean",
    headerBgColor: "#ffffff",
    sidebarBgColor: "#ffffff",
    contentBgColor: "#F3F4F6",
    footerBgColor: "#ffffff",
    primaryColor: "#4F46E5",
    headerGradient: "",
  },
  {
    name: "Midnight Blue",
    headerBgColor: "#1e293b",
    sidebarBgColor: "#0f172a",
    contentBgColor: "#f1f5f9",
    footerBgColor: "#f8fafc",
    primaryColor: "#3b82f6",
    headerGradient: "",
  },
  {
    name: "Royal Purple",
    headerBgColor: "#ffffff",
    sidebarBgColor: "#ffffff",
    contentBgColor: "#faf5ff",
    footerBgColor: "#ffffff",
    primaryColor: "#7c3aed",
    headerGradient: "linear-gradient(to right, #7c3aed, #a855f7)",
  },
];

// Helper to create a gradient from a color
const createGradientFromColor = (
  hexColor,
  direction = "to right",
  intensity = 20
) => {
  if (!hexColor || typeof hexColor !== "string" || !hexColor.startsWith("#")) {
    return "linear-gradient(to right, #cccccc, #999999)";
  }
  // Convert hex to RGB
  let r = parseInt(hexColor.slice(1, 3), 16);
  let g = parseInt(hexColor.slice(3, 5), 16);
  let b = parseInt(hexColor.slice(5, 7), 16);

  // Create a darker shade for the gradient
  const darkR = Math.max(0, r - 30);
  const darkG = Math.max(0, g - 30);
  const darkB = Math.max(0, b - 30);

  const darkHexColor = `#${darkR.toString(16).padStart(2, "0")}${darkG
    .toString(16)
    .padStart(2, "0")}${darkB.toString(16).padStart(2, "0")}`;

  return `linear-gradient(${direction}, ${hexColor}, ${darkHexColor})`;
};

export const ThemeProvider = ({ children }) => {
  const [theme, setTheme] = useState(() =>
    getStoredTheme("theme", defaultTheme.theme)
  );
  const [primaryColor, setPrimaryColor] = useState(() =>
    getStoredTheme("primaryColor", defaultTheme.primaryColor)
  );
  const [backgroundColor, setBackgroundColor] = useState(() =>
    getStoredTheme("backgroundColor", defaultTheme.backgroundColor)
  );
  const [layoutType, setLayoutType] = useState(() =>
    getStoredTheme("layoutType", defaultTheme.layoutType)
  );
  const [contentBgColor, setContentBgColor] = useState(() =>
    getStoredTheme("contentBgColor", defaultTheme.contentBgColor)
  );
  const [headerBgColor, setHeaderBgColor] = useState(() =>
    getStoredTheme("headerBgColor", defaultTheme.headerBgColor)
  );
  const [headerGradient, setHeaderGradient] = useState(() =>
    getStoredTheme("headerGradient", defaultTheme.headerGradient)
  );
  const [sidebarBgColor, setSidebarBgColor] = useState(() =>
    getStoredTheme("sidebarBgColor", defaultTheme.sidebarBgColor)
  );
  const [footerBgColor, setFooterBgColor] = useState(() =>
    getStoredTheme("footerBgColor", defaultTheme.footerBgColor)
  );
  const [currentPreset, setCurrentPreset] = useState(() =>
    getStoredTheme("currentPreset", "light")
  );

  // Custom setters that update localStorage
  const updateTheme = (value) => {
    setTheme(value);
    localStorage.setItem("theme_theme", JSON.stringify(value));

    if (value === "dark") {
      updateHeaderBgColor("#001529");
      updateHeaderGradient(null);
    } else {
      updateHeaderBgColor(defaultTheme.headerBgColor);
      updateHeaderGradient(defaultTheme.headerGradient);
    }
  };

  const updatePrimaryColor = (value) => {
    setPrimaryColor(value);
    localStorage.setItem("theme_primaryColor", JSON.stringify(value));
  };

  const updateBackgroundColor = (value) => {
    setBackgroundColor(value);
    localStorage.setItem("theme_backgroundColor", JSON.stringify(value));
  };

  const updateLayoutType = (value) => {
    setLayoutType(value);
    localStorage.setItem("theme_layoutType", JSON.stringify(value));
  };

  const updateContentBgColor = (value) => {
    const mildColor = createMildColor(value);
    setContentBgColor(mildColor);
    localStorage.setItem("theme_contentBgColor", JSON.stringify(mildColor));
  };

  const updateHeaderBgColor = (value) => {
    setHeaderBgColor(value);
    localStorage.setItem("theme_headerBgColor", JSON.stringify(value));
  };

  const updateHeaderGradient = (value) => {
    setHeaderGradient(value);
    localStorage.setItem("theme_headerGradient", JSON.stringify(value));
  };

  const updateSidebarBgColor = (value) => {
    setSidebarBgColor(value);
    localStorage.setItem("theme_sidebarBgColor", JSON.stringify(value));
  };

  const updateFooterBgColor = (value) => {
    setFooterBgColor(value);
    localStorage.setItem("theme_footerBgColor", JSON.stringify(value));
  };

  const updateCurrentPreset = (value) => {
    setCurrentPreset(value);
    localStorage.setItem("theme_currentPreset", JSON.stringify(value));
  };

  // Apply a preset theme
  const applyPresetTheme = (presetName) => {
    if (!presetThemes[presetName]) return;

    const preset = presetThemes[presetName];
    updateTheme(preset.theme);
    updatePrimaryColor(preset.primaryColor);
    updateBackgroundColor(preset.backgroundColor);
    updateLayoutType(preset.layoutType);
    updateContentBgColor(preset.contentBgColor);
    updateHeaderBgColor(preset.headerBgColor);
    updateHeaderGradient(preset.headerGradient);
    updateSidebarBgColor(preset.sidebarBgColor);
    updateFooterBgColor(preset.footerBgColor);
    updateCurrentPreset(presetName);
  };

  // Apply a common color scheme
  const applyCommonColorScheme = (schemeIndex) => {
    if (schemeIndex < 0 || schemeIndex >= commonColorSchemes.length) return;

    const scheme = commonColorSchemes[schemeIndex];
    updateHeaderBgColor(scheme.headerBgColor);
    updateSidebarBgColor(scheme.sidebarBgColor);
    updateContentBgColor(scheme.contentBgColor);
    updateFooterBgColor(scheme.footerBgColor);
    if (scheme.primaryColor) {
      updatePrimaryColor(scheme.primaryColor);
    }
    if (scheme.headerGradient) {
      updateHeaderGradient(scheme.headerGradient);
    }
  };

  const resetTheme = () => {
    applyPresetTheme("light");
  };

  return (
    <ThemeContext.Provider
      value={{
        theme,
        setTheme: updateTheme,
        primaryColor,
        setPrimaryColor: updatePrimaryColor,
        backgroundColor,
        setBackgroundColor: updateBackgroundColor,
        layoutType,
        setLayoutType: updateLayoutType,
        contentBgColor,
        setContentBgColor: updateContentBgColor,
        headerBgColor,
        setHeaderBgColor: updateHeaderBgColor,
        headerGradient,
        setHeaderGradient: updateHeaderGradient,
        sidebarBgColor,
        setSidebarBgColor: updateSidebarBgColor,
        footerBgColor,
        setFooterBgColor: updateFooterBgColor,
        resetTheme,
        createMildColor,
        presetThemes,
        currentPreset,
        applyPresetTheme,
        commonColorSchemes,
        applyCommonColorScheme,
        createGradientFromColor,
      }}
    >
      {children}
    </ThemeContext.Provider>
  );
};

export const useTheme = () => useContext(ThemeContext);
