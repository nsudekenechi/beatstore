"use client";
import React, { useEffect, useId, useRef, useState } from "react";
import { IoChevronDown, IoCheckmark } from "react-icons/io5";

interface AvailabilitySelectProps {
    label?: string;
    value: boolean;
    onChange: (value: boolean) => void;
}

const OPTIONS = [
    { value: true, name: "Available", dot: "bg-green-500" },
    { value: false, name: "Unavailable", dot: "bg-[#bbb]" },
];

export default function AvailabilitySelect({ label = "Availability", value, onChange }: AvailabilitySelectProps) {
    const [isOpen, setIsOpen] = useState(false);
    const containerRef = useRef<HTMLDivElement>(null);
    const listboxId = useId();
    const current = OPTIONS.find((option) => option.value === value)!;

    useEffect(() => {
        const handleClickOutside = (e: MouseEvent) => {
            if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
                setIsOpen(false);
            }
        };
        document.addEventListener("mousedown", handleClickOutside);
        return () => document.removeEventListener("mousedown", handleClickOutside);
    }, []);

    return (
        <div className="grid gap-1 text-xs" ref={containerRef}>
            <span>{label}</span>
            <div className="relative">
                <button
                    type="button"
                    aria-haspopup="listbox"
                    aria-expanded={isOpen}
                    aria-controls={listboxId}
                    onClick={() => setIsOpen((prev) => !prev)}
                    onKeyDown={(e) => {
                        if (e.key === "Escape") setIsOpen(false);
                    }}
                    className={`border duration-300 ${isOpen ? "border-accent" : "border-[#999]"} px-3 h-10.5 rounded-xl w-full flex items-center justify-between gap-2 cursor-pointer outline-none focus-visible:border-accent`}
                >
                    <span className="flex items-center gap-2">
                        <span className={`w-2 h-2 rounded-full ${current.dot}`} />
                        {current.name}
                    </span>
                    <IoChevronDown size={14} className={`text-[#999] duration-300 ${isOpen ? "rotate-180" : ""}`} />
                </button>

                <ul
                    id={listboxId}
                    role="listbox"
                    aria-label={label}
                    className={`absolute z-30 top-full mt-2 w-full bg-white rounded-xl border border-black/10 shadow-2xl shadow-black/10 overflow-hidden origin-top duration-200 ${isOpen ? "opacity-100 scale-100" : "opacity-0 scale-95 pointer-events-none"}`}
                >
                    {OPTIONS.map((option) => (
                        <li
                            key={option.name}
                            role="option"
                            aria-selected={option.value === value}
                            className={`px-4 py-2.5 flex items-center justify-between cursor-pointer duration-150 hover:bg-accent/5 ${option.value === value ? "text-accent" : ""}`}
                            onClick={() => {
                                onChange(option.value);
                                setIsOpen(false);
                            }}
                        >
                            <span className="flex items-center gap-2">
                                <span className={`w-2 h-2 rounded-full ${option.dot}`} />
                                {option.name}
                            </span>
                            {option.value === value && <IoCheckmark size={14} />}
                        </li>
                    ))}
                </ul>
            </div>
        </div>
    );
}
