export const fonts = {
  regular: "Inter-Regular",
  medium: "Inter-Medium",
  bold: "Inter-Bold",
} as const;

export const typography = {
  body: {
    fontFamily: fonts.regular,
    fontSize: 16,
  },

  bodyMedium: {
    fontFamily: fonts.medium,
    fontSize: 16,
  },

  title: {
    fontFamily: fonts.bold,
    fontSize: 24,
  },

  heading: {
    fontFamily: fonts.bold,
    fontSize: 32,
  },

  button: {
    fontFamily: fonts.bold,
    fontSize: 14,
  },
} as const;