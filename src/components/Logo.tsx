import Link from "next/link";
import { IoHeadset } from "react-icons/io5";

export default function Logo({ size, color="text-accent" }: { size: number; color?: string }) {
  return (
    <div>
      <Link
        href={"/"}
        className={"flex flex-wrap justify-center items-center gap-3"}
      >
        <IoHeadset className={`${color}`} size={size} />
        {/* <span className="font-primary text-sm">Alabah <span className="text-accent">Beatstore</span></span> */}
      </Link>
    </div>
  );
}
