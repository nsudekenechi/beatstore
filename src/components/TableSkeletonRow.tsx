export default function TableSkeletonRow({ cols = 3 }: { cols?: number }) {
  return (
    <tr className="h-15 border-b border-black/20 text-sm font-display capitalize">
      <td><span className="pl-10"><div className="h-4 w-4 animate-pulse rounded bg-gray-200" /></span></td>
      <td><div className="h-4 w-32 animate-pulse rounded bg-gray-200" /></td>
      <td className="text-[#555]"><div className="flex gap-3"><div className="h-4.5 w-4.5 animate-pulse rounded bg-gray-200" /><div className="h-4.5 w-4.5 animate-pulse rounded bg-gray-200" /></div></td>
    </tr>
  );
}
