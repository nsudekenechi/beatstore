"use client";
import { FormEvent, useEffect, useState } from "react";
import { TbEdit } from "react-icons/tb";
import { RiDeleteBinLine } from "react-icons/ri";
import { RiApps2AddLine } from "react-icons/ri";
import LoadingSpinner from "@/components/admin//LoadingSpinner";
import { ILicense } from "@/lib/types";
import { toast } from "sonner";
import axios from "axios";
import { getToken } from "@/lib/util";

export default function License() {
    const [showModal, setShowModal] = useState(false);
    const [data, setData] = useState<(ILicense & { _id: string; })[]>([]);
    const [selectedLicense, setSelectedLicense] = useState<(ILicense & { _id: string }) | null>(null);
    const [selectedDeleteLicense, setSelectedDeleteLicense] = useState<string | null>(null);
    const [isLoading, setIsLoading] = useState<{ get: boolean; post: boolean; }>({ get: false, post: false })
    let headerToken = getToken()
    const [inputs, setInputs] = useState<
        {
            name: {
                value: string;
                isFocused: boolean
            },
            description: {
                value: string;
                isFocused: boolean
            },
            format: {
                value: { name: "mp3" | "wav" | "trackout"; isChecked: boolean }[]
            },
            price: { value: number; isFocused: boolean },
            termsOfYears: { value: number, isFocused: boolean },
            distributionCopies: {
                value: number, isFocused: boolean
            },
            audioStreams: {
                value: number, isFocused: boolean
            },
            freeDownloads: {
                value: string,
                isFocused: boolean
            }
        }
    >({
        name: {
            value: "",
            isFocused: false,
        },
        description: {
            value: "",
            isFocused: false,
        },
        format: {
            value: [
                {
                    name: "mp3",
                    isChecked: true,
                },
                {
                    name: "wav",
                    isChecked: false,
                },
                {
                    name: "trackout",
                    isChecked: false,
                },
            ],
        },
        price: {
            value: 0,
            isFocused: false,
        },
        termsOfYears: {
            value: 1,
            isFocused: false,
        },
        distributionCopies: {
            value: 5000,
            isFocused: false,
        },
        audioStreams: {
            value: 1000000,
            isFocused: false,
        },
        freeDownloads: {
            value: "unlimited",
            isFocused: false,
        },
    });
    const handleShowModal = () => {
        setShowModal(true);
    };

    const handleHideModal = () => {
        setShowModal(false);
        // hiding modal for editing
        if (selectedLicense) {
            setSelectedLicense(null);
        }
        resetInputs();
    };

    const handlecreateLicense = async (e: FormEvent) => {
        e.preventDefault();
        setIsLoading(prev => ({ ...prev, post: true }))
        let data: Record<string, any> = {};
        Object.entries(inputs).forEach((item) => {
            if (item[0] != "format") {
                data[item[0]] = item[1].value;
            } else {
                data[item[0]] = inputs.format.value
                    .filter((format) => format.isChecked)
                    .map((format) => format.name);
            }
        });

        try {
            let req = await axios.post("/api/admin/license", data, headerToken);
            setData(prev => [...prev, req.data.message]);
            handleHideModal();
        } catch (err: any) {
            toast.error(err.response.data.message);
        } finally {
            setIsLoading(prev => ({ ...prev, post: false }))

        }


    };

    const handlegetLicenses = async () => {
        setIsLoading(prev => ({ ...prev, get: true }))

        try {
            let req = await axios.get("/api/admin/license", headerToken);
            setData(req.data.message);
        } catch (err: any) {
            toast.error(err.response.data.message);
        } finally {
            setIsLoading(prev => ({ ...prev, get: false }))

        }

    };

    const handleEditLicense = (e: FormEvent) => {
        e.preventDefault();
        let data: any = {};
        Object.entries(inputs).forEach((item) => {
            if (item[0] != "format") {
                data[item[0]] = item[1].value;
            } else {
                data[item[0]] = inputs.format.value
                    .filter((format) => format.isChecked)
                    .map((format) => format.name);
            }
        });


        // updateLicense(data, selectedLicense._id).then(
        //   (resp) => {
        //     if (resp) {
        //       setTimeout(() => {
        //         handlegetLicenses();
        //         handleHideModal();
        //       }, 1000);
        //     }
        //   }
        // );
    };

    const handleDeleteLicense = (id: string) => {
        // setTimeout(() => {
        //   setData((prev) => prev.filter((item) => item._id != id));
        // }, 400);
        // deleteLicense(id);
    };

    // handles sending inputs back to their original values
    const resetInputs = () => {
        setInputs({
            name: {
                value: "",
                isFocused: false,
            },
            description: {
                value: "",
                isFocused: false,
            },
            format: {
                value: [
                    {
                        name: "mp3",
                        isChecked: true,
                    },
                    {
                        name: "wav",
                        isChecked: false,
                    },
                    {
                        name: "trackout",
                        isChecked: false,
                    },
                ],
            },
            price: {
                value: 0,
                isFocused: false,
            },
            termsOfYears: {
                value: 1,
                isFocused: false,
            },
            distributionCopies: {
                value: 5000,
                isFocused: false,
            },
            audioStreams: {
                value: 1000000,
                isFocused: false,
            },
            freeDownloads: {
                value: "unlimited",
                isFocused: false,
            },
        });
    };

    useEffect(() => {
        handlegetLicenses();
    }, []);

    return (
        <div>
            <div className="flex justify-between items-center mb-10">
                <h1 className="font-display  text-2xl ">Create License</h1>
                <span
                    onClick={handleShowModal}
                    className="bg-accent flex px-10 py-3 text-sm text-white font-secondary rounded-full cursor-pointer"
                >
                    Add New License
                </span>
            </div>
            <table className="w-full border-t border-black/20 overflow-hidden">
                <thead className="bg-[#f1f1f1] h-12.5 font-secondary ">
                    <tr className="text-sm">
                        <td className="w-[10%]">
                            <span className="pl-10"></span>
                        </td>
                        <td className="w-[20%]">
                            <span>Name</span>
                        </td>

                        <td className="w-[20%]">
                            <span>Format</span>
                        </td>

                        <td className="w-[20%]">
                            <span>Price</span>
                        </td>

                        <td className="w-[20%]">
                            <span>Terms of years</span>
                        </td>
                        <td>
                            <span className="pr-10">Action</span>
                        </td>
                    </tr>
                </thead>

                <tbody className="overflow-hidden">
                    {data.length > 0 ? (
                        data.map((item, index) => (
                            <tr
                                key={index}
                                className={`h-15 border-b border-black/20 text-sm font-display capitalize  ${selectedDeleteLicense == item._id
                                    ? "translate-x-full opacity-0 duration-500"
                                    : "translate-x-0"
                                    }`}
                            >
                                <td>
                                    <span className="pl-10">
                                        <input type="checkbox" className="accent-accent" />
                                    </span>
                                </td>

                                <td>
                                    <span>{item.name}</span>
                                </td>
                                <td>
                                    <span className="lowercase">{item.format.join(", ")}</span>
                                </td>
                                <td>
                                    <span>
                                        {new Intl.NumberFormat("en-us", {
                                            currency: "USD",
                                            style: "currency",
                                        }).format(item.price)}
                                    </span>
                                </td>

                                <td>
                                    <span>{item.termsOfYears}</span>
                                </td>

                                <td className="text-[#555]">
                                    <div className="flex gap-3 items-center">
                                        <TbEdit
                                            className="cursor-pointer"
                                            size={18}
                                            onClick={() => {
                                                setSelectedLicense(item);
                                                setShowModal(true);
                                                setInputs((prev) => ({
                                                    ...prev,
                                                    name: { ...prev.name, value: item.name },
                                                    description: {
                                                        ...prev.description,
                                                        value: item.description!,
                                                    },
                                                    audioStreams: {
                                                        ...prev.audioStreams,
                                                        value: item.audioStreams,
                                                    },
                                                    format: {
                                                        ...prev.format,
                                                        value: prev.format.value.map((format) => ({
                                                            ...format,
                                                            isChecked: item.format.includes(format.name)
                                                                ? true
                                                                : false,
                                                        })),
                                                    },
                                                    price: {
                                                        ...prev.price,
                                                        value: item.price,
                                                    },
                                                    termsOfYears: {
                                                        ...prev.termsOfYears,
                                                        value: item.termsOfYears,
                                                    },
                                                    distributionCopies: {
                                                        ...prev.distributionCopies,
                                                        value: item.distributionCopies,
                                                    },
                                                }));
                                            }}
                                        />
                                        <RiDeleteBinLine
                                            className="cursor-pointer"
                                            size={18}
                                            onClick={() => {
                                                handleDeleteLicense(item._id);
                                                setSelectedDeleteLicense(item._id);
                                            }}
                                        />
                                    </div>
                                </td>
                            </tr>
                        ))
                    ) : (
                        <tr>
                            <td colSpan={6}>
                                <p className="py-5 border-b text-center">
                                    No items on this list{" "}
                                </p>
                            </td>
                        </tr>
                    )}
                </tbody>
            </table>

            <div
                className={`fixed bg-black/20 backdrop-blur-[2px] w-full h-full z-50 top-0 left-0 flex justify-center items-center ${!showModal ? "scale-0 delay-300" : "scale-100"
                    }`}
            >
                <div
                    className={` ${!showModal
                        ? "scale-0 translate-y-full  "
                        : "scale-100 translate-y-0"
                        }  duration-300 w-[40%] bg-white h-75  rounded-4xl overflow-auto shadow-2xl shadow-black/5 py-10`}
                >
                    <div className="mb-5 flex items-center justify-center flex-col  font-primary ">
                        <RiApps2AddLine size={30} />
                        <h1 className="text-[#777]">
                            {selectedLicense ? "Edit License" : "Add a License"}
                        </h1>
                    </div>

                    <form
                        action=""
                        className="w-full flex items-center justify-center flex-col font-display gap-5 "
                        onSubmit={selectedLicense ? handleEditLicense : handlecreateLicense}
                    >
                        <div
                            className={`border duration-300 ${inputs.name.isFocused ? "border-accent " : "border-[#999] "
                                }pl-4 py-3 text-xs  md:w-[80%] rounded-xl`}
                        >
                            <input
                                type="text"
                                onChange={(e) =>
                                    setInputs((prev) => ({
                                        ...prev,
                                        name: { ...prev.name, value: e.target.value },
                                    }))
                                }
                                className={`capitalize outline-none duration-500 w-full ${inputs.name.isFocused ? "pl-1" : ""
                                    }`}
                                required
                                placeholder="Enter License Name"
                                onFocus={() =>
                                    setInputs((prev) => ({
                                        ...prev,
                                        name: { ...prev.name, isFocused: true },
                                    }))
                                }
                                onBlur={() =>
                                    setInputs((prev) => ({
                                        ...prev,
                                        name: { ...prev.name, isFocused: false },
                                    }))
                                }
                                value={inputs.name.value}
                            />
                        </div>

                        <div
                            className={`border duration-300 ${inputs.description.isFocused
                                ? "border-accent "
                                : "border-[#999] "
                                }px-4 py-3 text-xs  md:w-[80%] rounded-xl`}
                        >
                            <textarea
                                onChange={(e) =>
                                    setInputs((prev) => ({
                                        ...prev,
                                        description: { ...prev.description, value: e.target.value },
                                    }))
                                }
                                className={`capitalize outline-none duration-500 h-full w-full resize-none ${inputs.description.isFocused ? "pl-1" : ""
                                    }`}
                                required
                                placeholder="Enter License Description"
                                onFocus={() =>
                                    setInputs((prev) => ({
                                        ...prev,
                                        description: { ...prev.description, isFocused: true },
                                    }))
                                }
                                onBlur={() =>
                                    setInputs((prev) => ({
                                        ...prev,
                                        description: { ...prev.description, isFocused: false },
                                    }))
                                }
                                name=""
                                id=""
                                value={inputs.description.value}
                            ></textarea>
                        </div>

                        <div className="md:w-[80%] text-xs">
                            <span className="">Enter Format</span>
                            <div className="flex justify-between mt-2">
                                {inputs.format.value.map((item, index) => (
                                    <label
                                        key={index}
                                        htmlFor="mp3"
                                        className="flex items-center gap-3 accent-accent"
                                    >
                                        <input
                                            type="checkbox"
                                            name={item.name}
                                            id=""
                                            onChange={(e) =>
                                                setInputs((prev) => ({
                                                    ...prev,
                                                    format: {
                                                        ...prev.format,
                                                        value: prev.format.value.map((format) =>
                                                            format.name == item.name
                                                                ? { ...format, isChecked: !format.isChecked }
                                                                : format
                                                        ),
                                                    },
                                                }))
                                            }
                                            checked={item.isChecked}
                                        />
                                        <span>.{item.name}</span>
                                    </label>
                                ))}
                            </div>
                        </div>

                        <div className="md:w-[80%] grid md:grid-cols-2 gap-3 text-xs">
                            <div className="grid gap-1">
                                <span className=""> Price</span>

                                <div
                                    className={`border duration-300 ${inputs.price.isFocused ? "border-accent " : "border-[#999] "
                                        }pl-4 py-3 text-xs   rounded-xl`}
                                >
                                    <input
                                        type="text"
                                        onChange={(e) =>
                                            !isNaN(Number(e.target.value))
                                                ? setInputs((prev) => ({
                                                    ...prev,
                                                    price: { ...prev.price, value: Number(e.target.value) },
                                                }))
                                                : ""
                                        }
                                        className={`capitalize outline-none duration-500 w-full ${inputs.price.isFocused ? "pl-1" : ""
                                            }`}
                                        required
                                        placeholder="Enter USD"
                                        onFocus={() =>
                                            setInputs((prev) => ({
                                                ...prev,
                                                price: { ...prev.price, isFocused: true },
                                            }))
                                        }
                                        onBlur={() =>
                                            setInputs((prev) => ({
                                                ...prev,
                                                price: { ...prev.price, isFocused: false },
                                            }))
                                        }
                                        value={inputs.price.value === 0 ? "" : inputs.price.value}
                                    />
                                </div>
                            </div>
                            <div className="grid gap-1">
                                <span className=""> Terms of years</span>
                                <div
                                    className={`border duration-300 ${inputs.termsOfYears.isFocused
                                        ? "border-accent "
                                        : "border-[#999] "
                                        }pl-4 py-3 text-xs   rounded-xl`}
                                >
                                    <input
                                        type="text"
                                        onChange={(e) =>
                                            setInputs((prev) => ({
                                                ...prev,
                                                termsOfYears: {
                                                    ...prev.termsOfYears,
                                                    value: Number(e.target.value),
                                                },
                                            }))
                                        }
                                        className={`capitalize outline-none duration-500 w-full ${inputs.termsOfYears.isFocused ? "pl-1" : ""
                                            }`}
                                        required
                                        placeholder=""
                                        onFocus={() =>
                                            setInputs((prev) => ({
                                                ...prev,
                                                termsOfYears: { ...prev.termsOfYears, isFocused: true },
                                            }))
                                        }
                                        onBlur={() =>
                                            setInputs((prev) => ({
                                                ...prev,
                                                termsOfYears: {
                                                    ...prev.termsOfYears,
                                                    isFocused: false,
                                                },
                                            }))
                                        }
                                        value={inputs.termsOfYears.value === 0 ? "" : inputs.termsOfYears.value}
                                    />
                                </div>
                            </div>

                            <div className="grid gap-1">
                                <span className=""> Distribution Copies</span>
                                <div
                                    className={`border duration-300 ${inputs.termsOfYears.isFocused
                                        ? "border-accent "
                                        : "border-[#999] "
                                        }pl-4 py-3 text-xs  rounded-xl`}
                                >
                                    <input
                                        type="text"
                                        onChange={(e) =>
                                            setInputs((prev) => ({
                                                ...prev,
                                                distributionCopies: {
                                                    ...prev.termsOfYears,
                                                    value: Number(e.target.value)
                                                },
                                            }))
                                        }
                                        className={`capitalize outline-none duration-500 w-full ${inputs.distributionCopies.isFocused ? "pl-1" : ""
                                            }`}
                                        required
                                        placeholder=""
                                        onFocus={() =>
                                            setInputs((prev) => ({
                                                ...prev,
                                                distributionCopies: {
                                                    ...prev.distributionCopies,
                                                    isFocused: true,
                                                },
                                            }))
                                        }
                                        onBlur={() =>
                                            setInputs((prev) => ({
                                                ...prev,
                                                distributionCopies: {
                                                    ...prev.distributionCopies,
                                                    isFocused: false,
                                                },
                                            }))
                                        }
                                        value={inputs.distributionCopies.value}
                                    />
                                </div>
                            </div>

                            <div className="grid gap-1">
                                <span className=""> Audio Strems</span>
                                <div
                                    className={`border duration-300 ${inputs.audioStreams.isFocused
                                        ? "border-accent "
                                        : "border-[#999] "
                                        }pl-4 py-3 text-xs  rounded-xl`}
                                >
                                    <input
                                        type="text"
                                        onChange={(e) =>
                                            setInputs((prev) => ({
                                                ...prev,
                                                audioStreams: {
                                                    ...prev.audioStreams,
                                                    value: Number(e.target.value),
                                                },
                                            }))
                                        }
                                        className={`capitalize outline-none duration-500 w-full ${inputs.audioStreams.isFocused ? "pl-1" : ""
                                            }`}
                                        required
                                        placeholder=""
                                        onFocus={() =>
                                            setInputs((prev) => ({
                                                ...prev,
                                                audioStreams: {
                                                    ...prev.audioStreams,
                                                    isFocused: true,
                                                },
                                            }))
                                        }
                                        onBlur={() =>
                                            setInputs((prev) => ({
                                                ...prev,
                                                distributionCopies: {
                                                    ...prev.audioStreams,
                                                    isFocused: false,
                                                },
                                            }))
                                        }
                                        value={inputs.audioStreams.value}
                                    />
                                </div>
                            </div>
                        </div>
                        <button className="bg-accent w-50  px-10 h-10 flex items-center justify-center text-sm text-white font-secondary rounded-full">
                            {isLoading.post ? (
                                <LoadingSpinner color="white" />
                            ) : selectedLicense ? (
                                "Edit"
                            ) : (
                                "Continue"
                            )}
                        </button>
                        <span className="text-sm cursor-pointer" onClick={handleHideModal}>
                            Cancel
                        </span>
                    </form>
                </div>
            </div>
        </div>
    );
}
