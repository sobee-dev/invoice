import InstallBanner from "@/components/InstallBanner";
import Providers from "@/components/Providers";

export default function ProtectedPagesLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <>
      <InstallBanner />
      <Providers>{children}</Providers>
    </>
  );
}