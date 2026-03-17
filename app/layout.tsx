import { IBM_Plex_Mono } from "next/font/google";
import "./globals.css";
import { CursorProvider } from "./components/cursor-provider";

const mono = IBM_Plex_Mono({
  subsets: ["latin"],
  weight: ["400"],
});

export const metadata = {
  title: "thought tiles",
  description: "thoughts are like tiles. each one fits somewhere. together, they make a wall.",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body className={mono.className}>
        {children}
        <CursorProvider />
      </body>
    </html>
  );
}