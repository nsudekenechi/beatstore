"use client";
import React, { useEffect, useState } from "react";
// import Table from "../../../components/admin/Table";
import { TbEdit } from "react-icons/tb";
import { RiDeleteBinLine } from "react-icons/ri";
import { RiApps2AddLine } from "react-icons/ri";
import LoadingSpinner from "@/components/LoadingSpinner";
import axios, { AxiosError } from "axios";
import { toast } from "sonner";
import { getToken } from "@/lib/util";
import TableSkeletonRow from "@/components/TableSkeletonRow";
import Skeleton from "@/components/Skeleton";
// import { useGenre } from "../../../hooks/useAdmin";
// import LoadingSpinner from "../../../components/LoadingSpinner";
interface IGenre {
  _id: string;
  name: string
}
export default function Genre() {
  const [showModal, setShowModal] = useState(false);
  const [data, setData] = useState<IGenre[]>([]);
  const [selectedGenre, setSelectedGenre] = useState<IGenre | null>(null);
  const [selectedDeleteGenre, setSelectedDeleteGenre] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState({
    get: false,
    post: false
  });
  //   const { isLoading, createGenre, getGenres, updateGenre, deleteGenre } = useGenre();
  const [inputs, setInputs] = useState({
    name: {
      value: "",
      isFocused: false,
    },
  });
  const handleShowModal = () => {
    setShowModal(true);
  };

  const handleHideModal = () => {
    setShowModal(false);
    // hiding modal for editing
    if (selectedGenre) {
      setSelectedGenre(null);
      setInputs((prev) => ({ ...prev, name: { ...prev.name, value: "" } }));
    }
  };

  const handleCreateGenre = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setIsLoading(prev => ({ ...prev, post: true }));
    try {
      const req = await axios.post("/api/admin/genre", { name: inputs.name.value }, getToken());
      toast("Genre Created Successfully");
      setInputs((prev) => ({ ...prev, name: { ...prev.name, value: "" } }));
      setData(prev => [...prev, { name: req.data.message.name, _id: req.data.message._id }]);
            setShowModal(false);

    } catch (err: any) {
      toast(err.response?.data?.message || "An error occurred", { dismissible: true, position: 'top-right' }); console.error(err);
    } finally {
      setIsLoading(prev => ({ ...prev, post: false }));
    }

  };
  const handleGetGenres = async () => {
    setIsLoading(prev => ({ ...prev, get: true }))
    try {
      const req = await axios.get("/api/admin/genre",  getToken());
      setData(req.data.message);

    } catch (err: any) {
      toast.error("Couldn't Get Genres, something went wrong", err.response.data?.message);
      console.error(err);
    } finally {
      setIsLoading(prev => ({ ...prev, get: false }))


    }

  };

  const handleEditGenre = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    try {
      const req = await axios.patch(`/api/admin/genre?id=${selectedGenre?._id}`, { name: inputs.name.value }, getToken());
      setData(prev => (prev.map(item => ({ ...item, name: selectedGenre?._id === item._id ? inputs.name.value : item.name }))))
      setShowModal(false);
      setSelectedGenre(null);
      setInputs((prev) => ({ ...prev, name: { ...prev.name, value: "" } }));
    } catch (err: any) {
      toast.error("Couldn't Update Genre", err.response.data?.message)
      console.error(err.response);
    }


  };

  const handleDeleteGenre = async (id: string) => {
    try {
      await axios.delete(`/api/admin/genre?id=${id}`, getToken());
      setSelectedDeleteGenre(id);
      setTimeout(() => {
        setData((prev) => prev.filter((item) => item._id != id));
      }, 400)
    } catch (err: any) {
      toast.error("Couldn't Delete Genre, ", err.response.data?.message)
      console.error(err.response);
    }

  };
  useEffect(() => {
    handleGetGenres();
  }, []);

  return (
    <div>
      <div className="flex justify-between items-center mb-10 ">
        <h1 className="  text-2xl ">Create a Genre</h1>
        <span
          onClick={handleShowModal}
          className="bg-accent flex px-10 py-3 text-sm text-white font-secondary rounded-full cursor-pointer"
        >
          Add New Genre
        </span>
      </div>

      <table className="w-full border-t border-black/20 overflow-hidden">
        <thead className="bg-[#f1f1f1] h-12.5 font-secondary ">
          <tr className="text-sm">
            <td className="w-[10%]">
              <span className="pl-10"></span>
            </td>
            <td className="w-[80%]">
              <span>Name</span>
            </td>
            <td>
              <span className="pr-10">Action</span>
            </td>
          </tr>
        </thead>

        <tbody className="overflow-hidden">
          {
            isLoading.get ? Array.from({ length: 10 }).map((_, key) => <TableSkeletonRow key={key} />) : data.length > 0 ? (
              data.map((item, index) => (
                <tr
                  key={index}
                  className={`h-15 border-b border-black/20 text-sm font-display capitalize  ${selectedDeleteGenre == item._id
                    ? "translate-x-full opacity-0 duration-500"
                    : "translate-x-0"
                    }`}
                >
                  <td>
                    <span className="pl-10">
                      <input type="checkbox" className="accent-accent" checked={selectedDeleteGenre === item._id} onChange={()=>{}} />
                    </span>
                  </td>

                  <td>
                    <span>{item.name}</span>
                  </td>

                  <td className="text-[#555]">
                    <div className="flex gap-3 items-center">
                      <TbEdit
                        className="cursor-pointer"
                        size={18}
                        onClick={() => {
                          setSelectedGenre(item);
                          setShowModal(true);
                          setInputs((prev) => ({
                            ...prev,
                            name: { ...prev.name, value: item.name },
                          }));
                        }}
                      />
                      <RiDeleteBinLine
                        className="cursor-pointer"
                        size={18}
                        onClick={() => {
                          handleDeleteGenre(item._id);
                          // setSelectedDeleteGenre(item._id);
                        }}
                      />
                    </div>
                  </td>
                </tr>
              ))
            ) : (
              <tr>
                <td colSpan={3}>
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
        onClick={() => {
          setShowModal(false)
        }}
      >
        <div
          className={` ${!showModal
            ? "scale-0 translate-y-full  "
            : "scale-100 translate-y-0"
            }  duration-300 w-[40%] bg-white min-h-75 rounded-4xl flex items-center justify-center flex-col shadow-2xl shadow-black/5`}
          onClick={(e) => {
            e.stopPropagation()
          }}
        >
          <div className="mb-5 flex items-center justify-center flex-col  font-primary ">
            <RiApps2AddLine size={30} />
            <h1 className="text-[#777]">
              {selectedGenre ? "Edit Genre" : "Add a Genre"}
            </h1>
          </div>

          <form
            className="w-full flex items-center justify-center flex-col font-display gap-5 text-primary"
            onSubmit={selectedGenre ? handleEditGenre : handleCreateGenre}
          >
            <div
              className={`border duration-300 ${inputs.name.isFocused ? "border-accent " : "border-[#999] "
                }pl-4 py-3 text-xs  md:w-[60%] rounded-xl`}
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
                placeholder="Enter Genre Name"
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

            <button className="bg-accent w-50  px-10 h-10 flex items-center justify-center text-sm text-white font-secondary rounded-full">
              {isLoading.post ? (
                <LoadingSpinner color="white"/>
              ) : selectedGenre ? (
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
