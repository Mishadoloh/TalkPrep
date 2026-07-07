import type { Metadata } from "next";
import "./globals.css";
import LayoutWrapper from "@/components/LayoutWrapper";

export const metadata: Metadata = {
  title: "TalkPrep — AI Technical Interview Trainer",
  description: "Practice technical interviews with AI-powered speech recognition and Google Gemini grading.",
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="uk">
      <meta name="viewport" content="width=device-width, initial-scale=1" />
      <body>
        <LayoutWrapper>
          {children}
        </LayoutWrapper>
      </body>
    </html>
  );
}
