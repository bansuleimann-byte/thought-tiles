import { IBM_Plex_Mono } from "next/font/google";
import "./globals.css";
import { CustomCursor } from "./components/custom-cursor";

const mono = IBM_Plex_Mono({
  subsets: ["latin"],
  weight: ["400"],
});

export const metadata = {
  title: "Thought Tiles",
  description: "A quiet place for thoughts.",
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
        <CustomCursor />
      </body>
    </html>
  );
}