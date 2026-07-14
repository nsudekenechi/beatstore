import { CgSpinnerTwoAlt } from "react-icons/cg";

export default function LoadingSpinner({ size=20, color="black" }: { size?: number; color?: string }) {
  return <CgSpinnerTwoAlt className="animate-spin" size={size} color={color} />;
}
