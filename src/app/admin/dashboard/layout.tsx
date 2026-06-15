"use client";
import Header from "@/components/Header";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
export default function DashboardLayout({ children }: { children: React.ReactNode }) {

    const [hide, setHide] = useState(true); //prevents users from seeing dashboard page before authentication check is done
    // if take admin back to home page if not authenticated
    const router = useRouter();
    useEffect(() => {
        if (!sessionStorage.getItem("admin_token")) {
            router.push("/admin");
        }else{
            setHide(false);
        }
    }, []);

    if (hide) return <></>;
    return   <div className="grid md:grid-cols-12 bg-[#fafafa]">

        <Header />
        <div className="md:col-span-11 min-h-screen z-10 md:p-10">
            {children}
        </div>
    </div>;
}