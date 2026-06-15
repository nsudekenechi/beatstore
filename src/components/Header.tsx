
import Logo from "./Logo";
import { VscHome } from "react-icons/vsc";
import { BiCategory } from "react-icons/bi";
import { LuBookText } from "react-icons/lu";
import { BsFillMusicPlayerFill } from "react-icons/bs";
import { LuListMusic } from "react-icons/lu";
import { AiOutlineLogout } from "react-icons/ai";
import Link from "next/link";
import { usePathname } from "next/navigation";

export default function Header() {
  const pathname = usePathname();
  
  const links = [
    {
      Icon: VscHome,
      text: "home",
    },
    {
      Icon: BiCategory,
      text: "tag",
    },

    {
      Icon: LuBookText,
      text: "license",
    },
    {
      Icon: BsFillMusicPlayerFill,
      text: "genre",
    },
    {
      Icon: LuListMusic,
      text: "beat",
    },
    {
      Icon: AiOutlineLogout,
      text: "logout",
    },
  ];
  return (
    <>
      <div className="hidden lg:block py-5">
        <div className=" fixed w-full top-0 h-screen grid grid-cols-12">
          <nav className=" py-10 w-[70%]">
            <ul className="flex flex-col items-center justify-between  min-h-[80vh] px-10">
              <li>
                <span className="w-8 h-8 flex items-center justify-center bg-accent rounded-full  ">
                  <Logo size={15} color="text-white" />
                </span>
              </li>
              <ul className="grid gap-7 bg-white p-4 shadow rounded-full">
                {links.map(
                  (link, index) =>
                    !["logout"].includes(link.text) && (
                      <li key={index}>
                        <Link
                          href={`/admin/dashboard/${link.text == "home" ? "/" : link.text}`}
                          className={`${pathname.includes(link.text === "home" ? "" : link.text ) ? "text-accent" : "text-[#c0c0c0]"}`}
                          // className={({ isActive }) =>
                          //   `${isActive ? " text-accent" : "text-[#c0c0c0]"}`
                          // }
                          // end={link.text == "home" ? true : false}
                        >
                          <link.Icon size={16} />
                        </Link>
                      </li>
                    )
                )}
              </ul>
              {/* Bottom Nav */}
              <ul className="grid gap-7 bg-white p-4 shadow rounded-full">
                {links.map(
                  (link, index) =>
                    ["logout"].includes(link.text) && (
                      <li key={index}>
                        <Link href={link.text}>
                          <link.Icon size={16} />
                        </Link>
                      </li>
                    )
                )}
              </ul>
            </ul>
          </nav>
        </div>
      </div>

      <div className="lg:hidden h-[100px]">
        <nav className="fixed bg-white/20 backdrop-blur-lg w-[100%]  py-5 px-10 bottom-0 z-100">
          <ul className="flex items-center justify-center gap-3 bg-white p-4 shadow-2xl shadow-black/5 outline outline-black/20 rounded-full">
            {links.map(
              (link, index) =>
                !["logout"].includes(link.text) && (
                  <li key={index}>
                    <Link
                      href={link.text == "home" ? "/" : link.text}
                      // className={({ isActive }) =>
                      //   `${
                      //     isActive
                      //       ? " bg-accent text-white rounded-full "
                      //       : "text-[#c0c0c0]"
                      //   } flex items-center justify-center w-8 h-8 duration-500 hover:translate-y-0.5`
                      // }
                      // end={link.text == "home" ? true : false}
                    >
                      <link.Icon size={20} />
                    </Link>
                  </li>
                )
            )}
          </ul>
        </nav>
      </div>
    </>
  );
}
