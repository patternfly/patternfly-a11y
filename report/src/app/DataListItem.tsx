import React from "react";
import {
  DataListItem as PfDataListItem,
  DataListItemRow,
  DataListCell,
  DataListToggle,
  DataListContent,
  DataListItemCells,
  Tooltip,
} from "@patternfly/react-core";
import CheckCircleIcon from "@patternfly/react-icons/dist/js/icons/check-circle-icon";
import { IssuesDrawer } from "./IssuesDrawer";
import { TogglePlaceholder } from "./TogglePlaceholder";

const DataListItemInternal = ({
  val,
  numIssues,
  isExpanded,
  hideScreenshots,
  toggle,
}) => {
  const key = `${val.order}_${val.url}`;
  const screenshotCell = hideScreenshots ? null : (
    <DataListCell key={`image-${key}`}>
      <a
        href={`/screenshots/${val.screenshotFile}`}
        target="_blank"
        onClick={(e) => e.stopPropagation()}
      >
        <img
          src={`/screenshots/${val.screenshotFile}`}
          style={{ maxHeight: "250px" }}
        />
      </a>
    </DataListCell>
  );
  const urlCell = (
    <DataListCell key={`url-${key}`} width={2}>
      <a
        href={`${val.prefix}${val.url}`}
        target="_blank"
        onClick={(e) => e.stopPropagation()}
      >
        <span id={`url-${key}`}>{val.url}</span>
      </a>
    </DataListCell>
  );
  const shouldToggle = () => {
    if (numIssues > 0) {
      toggle(key);
    }
  };
  const cursorStyle = numIssues === 0 ? "auto" : "pointer";
  return (
    <PfDataListItem aria-labelledby={`url-${key}`} isExpanded={isExpanded}>
      <DataListItemRow onClick={shouldToggle} key={`row-${key}`}>
        {val.filteredViolations.length > 0 ||
        (val.filteredIncomplete && val.filteredIncomplete.length > 0) ? (
          <DataListToggle
            onClick={shouldToggle}
            isExpanded={isExpanded}
            id={key}
            aria-controls={`content-${key}`}
            style={{ cursor: cursorStyle }}
            key={`toggle-${key}`}
          />
        ) : (
          <TogglePlaceholder />
        )}
        <DataListItemCells
          key={`cells-${key}`}
          dataListCells={[
            urlCell,
            <DataListCell
              key={`label-${key}`}
              style={{ cursor: cursorStyle }}
            >
              <span id={`label-${key}`}>{val.label}</span>
            </DataListCell>,
            <DataListCell key={`issues-${key}`} style={{ cursor: cursorStyle }}>
              {numIssues === 0 ? (
                <Tooltip content="No accessibility issues">
                  <CheckCircleIcon color="green" />
                </Tooltip>
              ) : (
                <span>
                  {numIssues} accessibility issue
                  {numIssues !== 1 ? "s" : ""}
                </span>
              )}
            </DataListCell>,
            ...(hideScreenshots ? [] : [screenshotCell]),
          ]}
        />
      </DataListItemRow>
      {(val.filteredViolations.length > 0 ||
        (val.filteredIncomplete && val.filteredIncomplete.length > 0)) &&
        isExpanded && (
          <DataListContent
            aria-label={`Accessibility issues for ${key}`}
            id={`content-${key}`}
          >
            <IssuesDrawer
              url={val.url}
              violations={val.filteredViolations}
              incomplete={val.filteredIncomplete || []}
            />
          </DataListContent>
        )}
    </PfDataListItem>
  );
};

DataListItemInternal.displayName = "DataListItemInternal";
DataListItemInternal.whyDidYouRender = true;

export const DataListItem = React.memo(DataListItemInternal);
