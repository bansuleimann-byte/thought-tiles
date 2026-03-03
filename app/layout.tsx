import { IBM_Plex_Mono } from "next/font/google";
import "./globals.css";
import { CursorProvider } from "./components/cursor-provider";

const mono = IBM_Plex_Mono({
  subsets: ["latin"],
  weight: ["400"],
});

export const metadata = {
  title: "thought tiles",
  description: "A quiet place for thoughts.",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <head>
        <link rel="preload" href="/walls/wall1.jpg" as="image" />
      </head>
      <body className={mono.className}>
        {children}
        <CursorProvider />
      </body>
    </html>
  );
}