import type { Metadata } from "next"
import localFont from "next/font/local"

import "./globals.css"
import { ThemeProvider } from "@/components/theme-provider"
import NextTopLoader from "nextjs-toploader"
import { cn } from "@/lib/utils"

export const metadata: Metadata = {
  icons: {
    icon: [
      { url: "/favicon.ico", sizes: "any" },
      { url: "/favicon/favicon-16x16.png", sizes: "16x16", type: "image/png" },
      { url: "/favicon/favicon-32x32.png", sizes: "32x32", type: "image/png" },
      { url: "/favicon/favicon-96x96.png", sizes: "96x96", type: "image/png" },
    ],
    apple: [{ url: "/favicon/apple-touch-icon.png", sizes: "180x180", type: "image/png" }],
  },
  manifest: "/favicon/site.webmanifest",
}

const fontSans = localFont({
  src: "../assets/fonts/Google_Sans_Flex/GoogleSansFlex-VariableFont_GRAD,ROND,opsz,slnt,wdth,wght.ttf",
  variable: "--font-sans",
})

const fontMono = localFont({
  src: "../assets/fonts/Fira_Code/FiraCode-VariableFont_wght.ttf",
  variable: "--font-mono",
})

const fontHeading = localFont({
  src: "../assets/fonts/Oxanium/Oxanium-VariableFont_wght.ttf",
  variable: "--font-heading",
})

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html
      lang="en"
      suppressHydrationWarning
      className={cn(
        "antialiased",
        fontSans.variable,
        fontMono.variable,
        fontHeading.variable
      )}
    >
      <body>
        <NextTopLoader color="var(--primary)" showSpinner={false} height={3} />
        <ThemeProvider>{children}</ThemeProvider>
      </body>
    </html>
  )
}
