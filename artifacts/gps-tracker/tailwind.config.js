/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./app/**/*.{js,jsx,ts,tsx}",
    "./components/**/*.{js,jsx,ts,tsx}",
  ],
  presets: [require("nativewind/preset")],
  theme: {
    extend: {
      colors: {
        primary: "#6D9E51",
        background: "#EAEFEF",
        foreground: "#262626",
        card: "#FFFFFF",
        muted: "#E2EAEA",
        "muted-fg": "#8A9A9A",
        accent: "#088395",
        trace: "#982598",
        destructive: "#FF4444",
        border: "#D8E2E2",
      },
      fontFamily: {
        "inter-regular": ["Inter_400Regular"],
        "inter-medium": ["Inter_500Medium"],
        "inter-semibold": ["Inter_600SemiBold"],
        "inter-bold": ["Inter_700Bold"],
      },
    },
  },
  plugins: [],
};
