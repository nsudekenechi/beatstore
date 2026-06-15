"use client";
import { MdOutlineMailOutline } from "react-icons/md";
import { CgLockUnlock } from "react-icons/cg";
import { HiOutlineEye } from "react-icons/hi2";
import { HiOutlineEyeSlash } from "react-icons/hi2";
import { useState } from "react";

import LoadingSpinner from "@/components/LoadingSpinner";
import axios from "axios";
import { toast } from "sonner";
import { useRouter } from "next/navigation";

export default function Login() {
    //   const { login, loading } = useAuth();
    const  router = useRouter();
    const [loading, setLoading] = useState<boolean>(false);
    const [inputs, setInputs] = useState<{
        email: { value: string; isFocused: boolean };
        password: { value: string; isFocused: boolean; showPassword: boolean };
    }>({
        email: {
            value: "",
            isFocused: false,
        },
        password: {
            value: "",
            isFocused: false,
            showPassword: false,
        },
    });

    // handles showing or masking password
    const handleShowPassword = () => {
        setInputs((prev) => ({
            ...prev,
            password: { ...prev.password, showPassword: !prev.password.showPassword },
        }));
    };

    // handles changes that happens on user's input
    const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>, type: string) => {
        const fieldName = e.target.name as keyof typeof inputs;
        switch (type) {
            case "onchange":
                setInputs((prev) => ({
                    ...prev,
                    [fieldName]: { ...prev[fieldName], value: e.target.value },
                }));
                break;
            case "onfocus":
                setInputs((prev) => ({
                    ...prev,
                    [fieldName]: { ...prev[fieldName], isFocused: true },
                }));
                break;

            case "onblur":
                setInputs((prev) => ({
                    ...prev,
                    [fieldName]: { ...prev[fieldName], isFocused: false },
                }));
                break;
        }
    };
    const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
        e.preventDefault();
        setLoading(true);

        try {
            const req = await axios.post("/api/auth/login", {
                email: inputs.email.value,
                password: inputs.password.value,
            });
            // setting admin token in session storage to be used for authentication in other admin pages
            sessionStorage.setItem("admin_token", req.data.message);
            toast.success("Login successful!", { dismissible: true, position: 'top-right' });
            router.push("/admin/dashboard");

        } catch (err: any) {
            toast(err.response?.data?.message || "An error occurred", { dismissible: true, position: 'top-right' });
            console.log("Error:", err);

        } finally {
            setLoading(false);
        }


    };

    return (
        <div className="bg-white  min-h-screen flex items-center justify-center">
            <div className="min-h-100 md:w-[40%] shadow-lg shadow-[rgba(0,0,0,.03)] border border-black/20 rounded-2xl p-5 md:p-7 ">
                {/* <Logo /> */}
                <div className="">
                    <h1 className="text-black mt-3 font-primary text-lg flex items-center gap-1">

                        <span> Welcome Back To</span>{" "}
                        <span className="outline text-accent py-1 px-2 rounded-full">
                            {" "}
                            Alabah Beatstore
                        </span>
                    </h1>
                    <p className="text-sm text-black/40 font-display">
                        We are glad to see you again
                    </p>
                </div>
                <hr className="my-5 border-accent/20" />
                <form action="" className="grid gap-3" onSubmit={handleSubmit}>
                    <div>
                        <label htmlFor="email" className="text-xs flex mb-2 text-primary">
                            Email
                        </label>
                        <div
                            className={`py-4 flex items-center  duration-300 outline px-5 rounded-full ${inputs.email.isFocused
                                ? "outline-accent text-accent gap-3 accpu"
                                : "outline-black/10 text-black/40 gap-2"
                                }`}
                        >
                            <MdOutlineMailOutline size={15} className="" />
                            <input
                                type="email"
                                className={
                                    "outline-0  text-sm font-display w-full text-black"
                                }
                                placeholder="Enter Your Email"
                                name="email"
                                autoComplete="off"
                                required
                                onChange={(e) => handleInputChange(e, "onchange")}
                                onFocus={(e) => handleInputChange(e, "onfocus")}
                                onBlur={(e) => handleInputChange(e, "onblur")}
                            />
                        </div>
                    </div>

                    <div>
                        <label htmlFor="email" className="text-xs flex mb-2 text-primary">
                            Password
                        </label>
                        <div
                            className={`py-4 flex items-center  duration-300 outline px-5 rounded-full ${inputs.password.isFocused
                                ? "outline-accent text-accent gap-3"
                                : "outline-black/10 text-black/40 gap-2"
                                }`}
                        >
                            <CgLockUnlock size={15} />
                            <input
                                type={!inputs.password.showPassword ? "password" : "text"}
                                className="outline-0 text-sm text-black   font-display w-full"
                                placeholder="Enter Your Password"
                                name="password"
                                required
                                value={inputs.password.value}
                                onChange={(e) => handleInputChange(e, "onchange")}
                                onFocus={(e) => handleInputChange(e, "onfocus")}
                                onBlur={(e) => handleInputChange(e, "onblur")}
                            />
                            <span onClick={handleShowPassword} className="cursor-pointer">
                                {!inputs.password.showPassword ? (
                                    <HiOutlineEye size={15} className="text-black/40" />
                                ) : (
                                    <HiOutlineEyeSlash size={15} className="text-black/40" />
                                )}
                            </span>
                        </div>
                    </div>

                    <button className="mt-5 text-xs bg-accent p-3 text-white font-display font-semibold flex items-center justify-center h-12">
                        {loading ? <LoadingSpinner color={"white"} size={20} /> : <span>Login</span>}
                    </button>
                </form>
            </div>
        </div>
    )
}
