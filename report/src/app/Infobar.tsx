import React from "react";
import {
  DescriptionList,
  DescriptionListGroup,
  DescriptionListTerm,
  DescriptionListDescription,
  Flex,
  FlexItem,
  ClipboardCopy,
  ClipboardCopyVariant,
  Title,
} from "@patternfly/react-core";
import { Graph } from "./Graph";
import { codeblockStyle } from "./DataList";

export const InfobarInternal = ({
  axeOptions,
  axeContext,
  sitesWithIssuesLength,
  sitesWithoutIssuesLength,
  reportLength,
  totalNumberIssues,
}) => (
  <Flex
    justifyContent={{ default: "justifyContentSpaceBetween" }}
    alignItems={{ default: "alignItemsFlexStart" }}
    style={{ padding: "30px" }}
  >
    {axeOptions && (
      <FlexItem>
        <Title headingLevel="h2" size="md">
          Axe context
        </Title>
        <div style={codeblockStyle}>{axeContext}</div>
        <Title headingLevel="h2" size="md">
          Axe options
        </Title>
        <ClipboardCopy
          isCode
          variant={ClipboardCopyVariant.expansion}
          isReadOnly
        >
          {axeOptions}
        </ClipboardCopy>
      </FlexItem>
    )}
    <FlexItem>
      <DescriptionList isHorizontal>
        <DescriptionListGroup>
          <DescriptionListTerm>Tested URLs</DescriptionListTerm>
          <DescriptionListDescription>
            {reportLength}
          </DescriptionListDescription>
          <DescriptionListTerm>Pass</DescriptionListTerm>
          <DescriptionListDescription>
            {sitesWithoutIssuesLength}
          </DescriptionListDescription>
          <DescriptionListTerm>Fail</DescriptionListTerm>
          <DescriptionListDescription>
            {sitesWithIssuesLength}
          </DescriptionListDescription>
          <DescriptionListTerm>Pass rate</DescriptionListTerm>
          <DescriptionListDescription>
            {(
              (sitesWithoutIssuesLength * 100) /
              (sitesWithIssuesLength + sitesWithoutIssuesLength)
            ).toFixed(2)}
            %
          </DescriptionListDescription>
          <DescriptionListTerm>Accessibility issues</DescriptionListTerm>
          <DescriptionListDescription>
            {totalNumberIssues}
          </DescriptionListDescription>
        </DescriptionListGroup>
      </DescriptionList>
    </FlexItem>
    <FlexItem>
      <Graph
        sitesWithoutIssuesLength={sitesWithoutIssuesLength}
        sitesWithIssuesLength={sitesWithIssuesLength}
      />
    </FlexItem>
  </Flex>
);
InfobarInternal.displayName = "InfobarInternal";
InfobarInternal.whyDidYouRender = true;

export const Infobar = React.memo(InfobarInternal);
