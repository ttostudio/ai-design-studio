import type { Metadata } from "next";
import "./globals.css";
import { Navbar } from "@/components/Navbar";

export const metadata: Metadata = {
  title: "AI Design Studio",
  description: "ComfyUI を使った汎用デザイン生成ツール",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="ja">
      <body>
        <Navbar />
        <main className="pt-14">{children}</main>
      </body>
    </html>
  );
}
