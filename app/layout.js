import "./globals.css";

export const metadata = {
  title: "Pricing Power Calculator",
  description: "Analyze operating leverage and price/volume trade-offs."
};

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
