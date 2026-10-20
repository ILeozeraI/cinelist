import { SkeletonGrid } from "@/components/Skeletons";

export default function Loading() {
  return (
    <div className="shell page-top">
      <SkeletonGrid count={12} />
    </div>
  );
}
