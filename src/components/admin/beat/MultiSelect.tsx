"use client";
import React, { useEffect, useId, useMemo, useRef, useState } from "react";
import { IoClose, IoCheckmark, IoChevronDown } from "react-icons/io5";
import { IOption } from "./types";

interface MultiSelectProps {
    label: string;
    placeholder?: string;
    options: IOption[];
    selected: string[]; // selected _ids
    onChange: (ids: string[]) => void;
    error?: string;
    isLoading?: boolean;
}

export default function MultiSelect({ label, placeholder = "Search...", options, selected, onChange, error, isLoading }: MultiSelectProps) {
    const [isOpen, setIsOpen] = useState(false);
    const [isFocused, setIsFocused] = useState(false);
    const [query, setQuery] = useState("");
    const [activeIndex, setActiveIndex] = useState(0);
    const containerRef = useRef<HTMLDivElement>(null);
    const inputRef = useRef<HTMLInputElement>(null);
    const listboxId = useId();

    const selectedOptions = useMemo(() => options.filter((option) => selected.includes(option._id)), [options, selected]);
    const filtered = useMemo(
        () => options.filter((option) => option.name.toLowerCase().includes(query.trim().toLowerCase())),
        [options, query]
    );

    // close when clicking outside
    useEffect(() => {
        const handleClickOutside = (e: MouseEvent) => {
            if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
                setIsOpen(false);
            }
        };
        document.addEventListener("mousedown", handleClickOutside);
        return () => document.removeEventListener("mousedown", handleClickOutside);
    }, []);

    useEffect(() => {
        if (activeIndex >= filtered.length) setActiveIndex(0);
    }, [filtered.length, activeIndex]);

    const toggleOption = (id: string) => {
        onChange(selected.includes(id) ? selected.filter((item) => item !== id) : [...selected, id]);
    };

    const handleKeyDown = (e: React.KeyboardEvent) => {
        if (e.key === "ArrowDown") {
            e.preventDefault();
            setIsOpen(true);
            setActiveIndex((prev) => Math.min(prev + 1, filtered.length - 1));
        } else if (e.key === "ArrowUp") {
            e.preventDefault();
            setActiveIndex((prev) => Math.max(prev - 1, 0));
        } else if (e.key === "Enter") {
            e.preventDefault();
            if (isOpen && filtered[activeIndex]) toggleOption(filtered[activeIndex]._id);
        } else if (e.key === "Escape") {
            setIsOpen(false);
        } else if (e.key === "Backspace" && !query && selected.length) {
            onChange(selected.slice(0, -1));
        }
    };

    return (
        <div className="grid gap-1 text-xs" ref={containerRef}>
            <span>{label}</span>
            <div className="relative">
                <div
                    className={`border duration-300 ${error ? "border-red-400 " : isFocused || isOpen ? "border-accent " : "border-[#999] "} px-3 py-2 rounded-xl flex flex-wrap items-center gap-1.5 cursor-text min-h-10.5`}
                    onClick={() => {
                        setIsOpen(true);
                        inputRef.current?.focus();
                    }}
                >
                    {selectedOptions.map((option) => (
                        <span
                            key={option._id}
                            className="bg-accent/10 text-accent capitalize flex items-center gap-1 pl-2.5 pr-1.5 py-1 rounded-full duration-200"
                        >
                            {option.name}
                            <button
                                type="button"
                                aria-label={`Remove ${option.name}`}
                                className="hover:bg-accent/20 rounded-full p-0.5 duration-200 cursor-pointer"
                                onClick={(e) => {
                                    e.stopPropagation();
                                    toggleOption(option._id);
                                }}
                            >
                                <IoClose size={12} />
                            </button>
                        </span>
                    ))}
                    <input
                        ref={inputRef}
                        role="combobox"
                        aria-expanded={isOpen}
                        aria-controls={listboxId}
                        aria-label={label}
                        className="outline-none flex-1 min-w-20 py-0.5 bg-transparent"
                        placeholder={selectedOptions.length ? "" : placeholder}
                        value={query}
                        onChange={(e) => {
                            setQuery(e.target.value);
                            setIsOpen(true);
                        }}
                        onFocus={() => {
                            setIsFocused(true);
                            setIsOpen(true);
                        }}
                        onBlur={() => setIsFocused(false)}
                        onKeyDown={handleKeyDown}
                    />
                    <IoChevronDown
                        size={14}
                        className={`text-[#999] shrink-0 duration-300 ${isOpen ? "rotate-180" : ""}`}
                    />
                </div>

                <ul
                    id={listboxId}
                    role="listbox"
                    aria-multiselectable
                    className={`absolute z-30 top-full mt-2 w-full bg-white rounded-xl border border-black/10 shadow-2xl shadow-black/10 max-h-48 overflow-auto origin-top duration-200 ${isOpen ? "opacity-100 scale-100" : "opacity-0 scale-95 pointer-events-none"}`}
                >
                    {isLoading ? (
                        <li className="px-4 py-3 text-[#999]">Loading...</li>
                    ) : filtered.length ? (
                        filtered.map((option, index) => {
                            const isSelected = selected.includes(option._id);
                            return (
                                <li
                                    key={option._id}
                                    role="option"
                                    aria-selected={isSelected}
                                    className={`px-4 py-2.5 capitalize flex items-center justify-between cursor-pointer duration-150 ${index === activeIndex ? "bg-accent/5" : ""} ${isSelected ? "text-accent" : ""}`}
                                    onMouseEnter={() => setActiveIndex(index)}
                                    onMouseDown={(e) => e.preventDefault() /* keep input focused */}
                                    onClick={() => toggleOption(option._id)}
                                >
                                    {option.name}
                                    {isSelected && <IoCheckmark size={14} />}
                                </li>
                            );
                        })
                    ) : (
                        <li className="px-4 py-3 text-[#999]">No matches found</li>
                    )}
                </ul>
            </div>
            {error && <span className="text-red-500">{error}</span>}
        </div>
    );
}
