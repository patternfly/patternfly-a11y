import React from "react";
import {
  Chart,
  ChartAxis,
  ChartBar,
  ChartGroup,
  ChartVoronoiContainer,
} from "@patternfly/react-charts";

export const GraphInternal = ({ sitesWithoutIssuesLength, sitesWithIssuesLength }) => (
  <Chart
    ariaDesc="Number of test passes and failures"
    ariaTitle="Test report"
    containerComponent={<ChartVoronoiContainer constrainToVisibleArea />}
    domainPadding={{ x: [30, 25] }}
    legendData={[
      { name: "Pass", symbol: { fill: "lightgreen" } },
      { name: "Fail", symbol: { fill: "red" } },
    ]}
    legendPosition="bottom-left"
    height={175}
    padding={{
      bottom: 75, // Adjusted to accommodate legend
      left: 50,
      right: 50, // Adjusted to accommodate tooltip
      top: 0,
    }}
    // themeColor={ChartThemeColor.multiOrdered}
    width={400}
  >
    <ChartAxis />
    <ChartAxis dependentAxis showGrid />
    <ChartGroup offset={11} horizontal>
      <ChartBar
        data={[
          {
            name: "Pass",
            x: "Pass",
            y: sitesWithoutIssuesLength,
          },
        ]}
        style={{ data: { fill: "lightgreen" } }}
      />
      <ChartBar
        data={[{ name: "Fail", x: "Fail", y: sitesWithIssuesLength }]}
        style={{ data: { fill: "red" } }}
      />
    </ChartGroup>
  </Chart>
);
GraphInternal.displayName = "GraphInternal";
GraphInternal.whyDidYouRender = true;

export const Graph = React.memo(
    GraphInternal
);