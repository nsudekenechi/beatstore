"use client";
import React from "react";
import { RiDeleteBinLine } from "react-icons/ri";
import LoadingSpinner from "@/components/admin//LoadingSpinner";

interface DeleteModalProps {
    isOpen: boolean;
    itemName?: string;
    isDeleting: boolean;
    onConfirm: () => void;
    onCancel: () => void;
}

export default function DeleteModal({ isOpen, itemName, isDeleting, onConfirm, onCancel }: DeleteModalProps) {
    return (
        <div
            className={`fixed bg-black/20 backdrop-blur-[2px] w-full h-full z-50 top-0 left-0 flex justify-center items-center ${!isOpen ? "scale-0 delay-300" : "scale-100"}`}
            onClick={onCancel}
        >
            <div
                className={`${!isOpen ? "scale-0 translate-y-full" : "scale-100 translate-y-0"} duration-300 w-[85%] md:w-[26rem] bg-white rounded-4xl flex items-center justify-center flex-col shadow-2xl shadow-black/5 py-10 px-8 text-center`}
                onClick={(e) => e.stopPropagation()}
                role="alertdialog"
                aria-modal="true"
                aria-label={`Delete ${itemName || "beat"}`}
            >
                <div className="mb-5 flex items-center justify-center flex-col font-primary">
                    <span className="bg-red-50 text-red-500 rounded-full p-3 mb-2">
                        <RiDeleteBinLine size={24} />
                    </span>
                    <h1 className="text-[#777]">Delete Beat</h1>
                </div>

                <p className="text-sm font-display text-[#555] mb-8">
                    Are you sure you want to delete <span className="capitalize text-primary">&ldquo;{itemName}&rdquo;</span>?
                    <br />
                    This will permanently remove the beat and all its files.
                </p>

                <div className="flex flex-col items-center gap-5 font-secondary w-full">
                    <button
                        onClick={onConfirm}
                        disabled={isDeleting}
                        className="bg-red-500 hover:bg-red-600 duration-300 w-50 px-10 h-10 flex items-center justify-center text-sm text-white rounded-full cursor-pointer disabled:opacity-70"
                    >
                        {isDeleting ? <LoadingSpinner color="white" /> : "Delete"}
                    </button>
                    <span className="text-sm cursor-pointer" onClick={onCancel}>
                        Cancel
                    </span>
                </div>
            </div>
        </div>
    );
}
