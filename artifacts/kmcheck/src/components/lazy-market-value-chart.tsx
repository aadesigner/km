import { lazy, Suspense } from "react";
import type { ComponentProps } from "react";

const MarketValueChart = lazy(() =>
  import("./market-value-chart").then((m) => ({ default: m.MarketValueChart })),
);

type Props = ComponentProps<typeof MarketValueChart>;

/** Loads recharts only when market chart is rendered. */
export function LazyMarketValueChart(props: Props) {
  return (
    <Suspense fallback={null}>
      <MarketValueChart {...props} />
    </Suspense>
  );
}
