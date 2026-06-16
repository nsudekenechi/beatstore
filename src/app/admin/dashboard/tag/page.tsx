"use client";
import React, { useEffect, useState } from "react";
// import Table from "../../../components/admin/Table";
import { TbEdit } from "react-icons/tb";
import { RiDeleteBinLine } from "react-icons/ri";
import { RiApps2AddLine } from "react-icons/ri";
import LoadingSpinner from "@/components/LoadingSpinner";
import axios from "axios";
import { toast } from "sonner";
import { getToken } from "@/lib/util";
// import { useTag } from "../../../hooks/useAdmin";
// import LoadingSpinner from "../../../components/LoadingSpinner";
interface ITag {
  _id: string;
  name: string
}
export default function Tag() {
  const [showModal, setShowModal] = useState(false);
  const [data, setData] = useState<ITag[]>([]);
  const [selectedTag, setSelectedTag] = useState<ITag | null>(null);
  const [selectedDeleteTag, setSelectedDeleteTag] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  //   const { isLoading, createTag, getTags, updateTag, deleteTag } = useTag();
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
    if (selectedTag) {
      setSelectedTag(null);
      setInputs((prev) => ({ ...prev, name: { ...prev.name, value: "" } }));
    }
  };

  const handleCreateTag = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setIsLoading(true);
    try {
      const req = await axios.post("/api/admin/tag", { name: inputs.name.value });
      toast("Tag Created Successfully");
      setInputs((prev) => ({ ...prev, name: { ...prev.name, value: "" } }));
      setData(prev => [...prev, { name: req.data.message.name, _id: req.data.message._id }]);
    } catch (err: any) {
      toast(err.response?.data?.message || "An error occurred", { dismissible: true, position: 'top-right' }); console.error(err);
    } finally {
      setIsLoading(false);
    }

  };
  const handleGetTags = async () => {
    try {

      const req = await axios.get("/api/admin/tag", getToken());
      setData(req.data.message);
    } catch (err) {
      console.log(err);
    }
    // getTags().then((data) => {
    //   if (data) {
    //     setData(data);
    //   }
    // });
  };

  const handleEditTag = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();


    // updateTag({ name: inputs.name.value }, selectedTag._id).then((data) => {
    //   if (data) {
    //     setTimeout(() => {
    //       handleGetTags();
    //       setShowModal(false);
    //       setSelectedTag(null);
    //       setInputs((prev) => ({ ...prev, name: { ...prev.name, value: "" } }));
    //     }, 1000);
    //   }
    // });
  };

  const handleDeleteTag = (id: string) => {
    // setTimeout(() => {
    //   setData((prev) => prev.filter((item) => item._id != id));
    // }, 400);
    // deleteTag(id);
  };
  useEffect(() => {
    handleGetTags();
  }, []);

  return (
    <div>
      <div className="flex justify-between items-center mb-10 ">
        <h1 className="  text-2xl ">Create a Tag</h1>
        <span
          onClick={handleShowModal}
          className="bg-accent flex px-10 py-3 text-sm text-white font-secondary rounded-full cursor-pointer"
        >
          Add New Tag
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
          {data.length > 0 ? (
            data.map((item, index) => (
              <tr
                key={index}
                className={`h-15 border-b border-black/20 text-sm font-display capitalize  ${selectedDeleteTag == item._id
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

                <td className="text-[#555]">
                  <div className="flex gap-3 items-center">
                    <TbEdit
                      className="cursor-pointer"
                      size={18}
                      onClick={() => {
                        setSelectedTag(item);
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
                        handleDeleteTag(item._id);
                        setSelectedDeleteTag(item._id);
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
              {selectedTag ? "Edit Tag" : "Add a Tag"}
            </h1>
          </div>

          <form
            className="w-full flex items-center justify-center flex-col font-display gap-5 text-primary"
            onSubmit={selectedTag ? handleEditTag : handleCreateTag}
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
                placeholder="Enter Tag Name"
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
              {isLoading ? (
                <LoadingSpinner />
              ) : selectedTag ? (
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
