import { Suspense } from "react";
import { RunView } from "@/components/run/RunView";

export default function RunPage() {
  return (
    <Suspense>
      <RunView />
    </Suspense>
  );
}
