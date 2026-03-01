import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "SprintFlow — Ship Faster, Together",
  description:
    "SprintFlow brings your team's work into focus — from backlog to done, without the noise. Purpose-built for agile teams who ship fast.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className="antialiased">{children}</body>
    </html>
  );
}
