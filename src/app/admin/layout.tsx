import { DM_Sans } from "next/font/google";

const DM_SANS = DM_Sans({
  variable: "--font-dm-sans",
  subsets: ["latin"],
});

export default function AdminLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <div className={`${DM_SANS.variable}  h-screen bg-[#fafafa] text-primary`}>
         {children}
    </div>
  );
}