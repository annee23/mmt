import { Cormorant_Garamond } from "next/font/google";
import localFont from "next/font/local";

export const display = Cormorant_Garamond({
  subsets: ["latin"],
  weight: ["400", "500", "600"],
  style: ["normal", "italic"],
  variable: "--font-cormorant",
  display: "swap",
});

/** Korean text: NanumSquare (self-hosted). */
export const nanum = localFont({
  src: [
    { path: "./fonts/NanumSquareL.woff2", weight: "300", style: "normal" },
    { path: "./fonts/NanumSquareR.woff2", weight: "400", style: "normal" },
    { path: "./fonts/NanumSquareB.woff2", weight: "700", style: "normal" },
    { path: "./fonts/NanumSquareEB.woff2", weight: "800", style: "normal" },
  ],
  variable: "--font-nanum",
  display: "swap",
});

export const fontVars = `${display.variable} ${nanum.variable}`;
