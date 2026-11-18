import type { Metadata } from "next";
import { Plus_Jakarta_Sans } from "next/font/google";
import "./globals.css";

const sans = Plus_Jakarta_Sans({
  subsets: ["latin"],
  variable: "--font-body",
  display: "swap",
});

export const metadata: Metadata = {
  title: {
    default: "WasteLess",
    template: "%s | WasteLess",
  },
  description:
    "WasteLess mencatat makanan berlebih, mengelola reservasi, dan melacak pengambilan sampai diterima.",
};

const themeScript = `
try {
  const saved = localStorage.getItem('wasteless-theme');
  const theme = saved === 'dark' || saved === 'light'
    ? saved
    : (window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light');
  document.documentElement.dataset.theme = theme;
} catch {
  document.documentElement.dataset.theme = 'light';
}
`;

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html
      lang="id"
      suppressHydrationWarning
      className={sans.variable}
    >
      <head>
        <script dangerouslySetInnerHTML={{ __html: themeScript }} />
      </head>
      <body>{children}</body>
    </html>
  );
}
