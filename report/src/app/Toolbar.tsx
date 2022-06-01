import React from "react";
import {
  Toolbar as PFToolbar,
  ToolbarItem,
  ToolbarContent,
  Checkbox,
  Button,
  Tooltip,
} from "@patternfly/react-core";
import SortDecreasing from "@patternfly/react-icons/dist/js/icons/sort-amount-down-icon";
import SortIncreasing from "@patternfly/react-icons/dist/js/icons/sort-amount-down-alt-icon";
import InfoCircleIcon from "@patternfly/react-icons/dist/js/icons/info-circle-icon";
import { SortSelect } from "./SortSelect";
import { ExpandAll } from "./ExpandAll";
import { SeveritySelect } from "./SeveritySelect";

export const Toolbar = ({
  hideScreenshots,
  handleChange,
  expandAll,
  handleExpandAll,
  includePossibleIssues,
  handlePossibleIssues,
  sortIncreasing,
  onSelect,
  onSortDirectionClick,
  onSeveritySelect,
}) => {
  const toolbarItems = (
    <React.Fragment>
      <ToolbarItem>
        <Checkbox
          label="Hide screenshots"
          isChecked={hideScreenshots}
          onChange={handleChange}
          aria-label="Hide screenshots"
          id="hideScreenshotsId"
          name="hideScreenshotsName"
        />
      </ToolbarItem>
      <ToolbarItem>
        <ExpandAll expandAll={expandAll} handleExpandAll={handleExpandAll} />
      </ToolbarItem>
      <ToolbarItem>
        <Checkbox
          label={
            <span>
              <Tooltip content="Count and display possible issues that could neither be determined to definitively pass or definitively fail">
                <InfoCircleIcon color="blue" />
              </Tooltip>{" "}
              Include possible issues
            </span>
          }
          isChecked={includePossibleIssues}
          onChange={handlePossibleIssues}
          aria-label="Include possible issues"
          id="includePossibleId"
          name="includePossibleName"
        />
      </ToolbarItem>
      <ToolbarItem style={{ marginRight: 0 }}>
        <SortSelect onSelect={onSelect} />
      </ToolbarItem>
      <ToolbarItem>
        <Button
          variant="plain"
          aria-label="Sort direction"
          onClick={onSortDirectionClick}
        >
          {sortIncreasing ? <SortIncreasing /> : <SortDecreasing />}
        </Button>
      </ToolbarItem>
      <ToolbarItem>
          <SeveritySelect onSelect={onSeveritySelect} />
      </ToolbarItem>
    </React.Fragment>
  );
  return (
    <PFToolbar id="toolbar">
      <ToolbarContent>{toolbarItems}</ToolbarContent>
    </PFToolbar>
  );
};
Toolbar.displayName = "Toolbar";
Toolbar.whyDidYouRender = true;
