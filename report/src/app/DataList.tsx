import React from "react";
import {
  DataList,
  DataListItem,
  DataListItemRow,
  DataListCell,
  DataListToggle,
  DataListContent,
  DataListItemCells,
  Toolbar,
  ToolbarItem,
  ToolbarContent,
  Checkbox,
  Select,
  SelectOption,
  Button,
  DescriptionList,
  DescriptionListGroup,
  DescriptionListTerm,
  DescriptionListDescription,
  Flex,
  FlexItem,
  TextContent,
  Text,
  Bullseye,
  ClipboardCopy,
  ClipboardCopyVariant,
  Title,
  Tooltip,
} from "@patternfly/react-core";
import { css } from "@patternfly/react-styles";
import dataListToggleStyles from "@patternfly/react-styles/css/components/DataList/data-list";
import SortDecreasing from "@patternfly/react-icons/dist/js/icons/sort-amount-down-icon";
import SortIncreasing from "@patternfly/react-icons/dist/js/icons/sort-amount-down-alt-icon";
import CheckCircleIcon from "@patternfly/react-icons/dist/js/icons/check-circle-icon";
import InfoCircleIcon from "@patternfly/react-icons/dist/js/icons/info-circle-icon";
import {
  Chart,
  ChartAxis,
  ChartBar,
  ChartGroup,
  ChartVoronoiContainer,
} from "@patternfly/react-charts";
import { IssuesDrawer } from "./IssuesDrawer";

interface DataListState {
  expanded: string[];
  hideScreenshots: boolean;
  expandAll: boolean;
  isOpen: boolean;
  selected: any;
  sortIncreasing: boolean;
  showPassedURLs: boolean;
  includePossibleIssues: boolean;
  sitesWithIssues: any[];
  sitesWithoutIssues: any[];
  totalNumberIssues: number;
}

interface DataListProps {
  report: any;
}

export const codeblockStyle = {
  backgroundColor: "#f5f2f0",
  borderRadius: ".3em",
  padding: "5px 10px",
  display: "block",
  marginTop: "5px",
  color: "#c92c2c",
  border: "1px solid rgba(0,0,0,.1)",
  fontFamily: `Consolas, Monaco, 'Andale Mono', 'Ubuntu Mono', monospace`,
};

export class ExpandableDataList extends React.Component<
  DataListProps,
  DataListState
> {
  constructor(props) {
    super(props);
    let totalNumberIssues: number = 0; 
    Object.values(this.props.report).forEach((val) => {
      totalNumberIssues +=
        this.getNumberOfIssues((val as any).violations) +
        this.getNumberOfIssues((val as any).incomplete);
    });
    const reportValues = Object.values(props.report);
    const sitesWithIssues = reportValues.filter((val: any) => {
      return val.violations.length > 0 || val.incomplete.length > 0;
    });
    const sitesWithoutIssues = reportValues.filter(
      (val: any) => val.violations.length === 0 && val.incomplete.length === 0
    );
    const expandAll = false;
    this.state = {
      expanded: expandAll ? Object.keys(props.report) : [],
      hideScreenshots: false,
      expandAll,
      isOpen: false,
      selected: "Sort by Order",
      sortIncreasing: true,
      showPassedURLs: true,
      includePossibleIssues: true,
      sitesWithIssues,
      sitesWithoutIssues,
      totalNumberIssues
    };
  }

  getNumberOfIssues = (category) => {
    let numIssues = 0;
    category.forEach((category) => (numIssues += category.nodes.length));
    return numIssues;
  }

  render() {
    const {
      expanded,
      hideScreenshots,
      expandAll,
      isOpen,
      selected,
      sortIncreasing,
      showPassedURLs,
      includePossibleIssues,
      sitesWithIssues,
      sitesWithoutIssues,
      totalNumberIssues
    } = this.state;
    const { report } = this.props;
    const toggle = (id) => {
      const index = expanded.indexOf(id);
      const newExpanded =
        index >= 0
          ? [
              ...expanded.slice(0, index),
              ...expanded.slice(index + 1, expanded.length),
            ]
          : [...expanded, id];
      this.setState(() => ({
        expanded: newExpanded,
        expandAll:
          newExpanded.length === 0
            ? false
            : newExpanded.length === Object.keys(report).length
            ? true
            : null,
      }));
    };
    const handleChange = (checked, event) => {
      const target = event.target;
      const value = target.type === "checkbox" ? target.checked : target.value;
      this.setState({ hideScreenshots: value });
    };
    const handleExpandAll = (checked, event) => {
      const target = event.target;
      const shouldExpandAll =
        target.type === "checkbox" ? target.checked : target.value;
      this.setState({
        expandAll: shouldExpandAll,
        expanded: shouldExpandAll ? Object.keys(report) : [],
      });
    };
    const handleShowPass = (checked, event) => {
      const target = event.target;
      const showPassedURLs =
        target.type === "checkbox" ? target.checked : target.value;
      this.setState({ showPassedURLs });
    };
    const handlePossibleIssues = (checked, event) => {
      const target = event.target;
      const includePossibleIssues =
        target.type === "checkbox" ? target.checked : target.value;
      // perform a deep copy on this.props.report since we mutate it by setting incomplete
      this.setState({
        includePossibleIssues,
        sitesWithIssues: Object.values(JSON.parse(JSON.stringify(this.props.report)))
          .map((issue) => {
            if (!includePossibleIssues) {
              (issue as any).incomplete = [];
            }
            return issue;
          })
          .filter((val: any) => {
            return val.violations.length > 0 || val.incomplete.length > 0;
          }),
      });
    };

    const TogglePlaceholder = () => (
      <div className={css(dataListToggleStyles.dataListItemControl)}>
        <div
          className={css(dataListToggleStyles.dataListToggle)}
          style={{ width: "48px", height: "36px" }}
        ></div>
      </div>
    );
    const sites = [
      ...sitesWithIssues,
      ...(showPassedURLs ? sitesWithoutIssues : []),
    ].sort((a: any, b: any) => {
      const sortDirection = sortIncreasing ? 1 : -1;
      if (selected === "Sort by Order") {
        return Number.parseInt(a.order) > Number.parseInt(b.order)
          ? sortDirection
          : sortDirection * -1;
      } else if (selected === "Sort by URL") {
        return a.url > b.url ? sortDirection : sortDirection * -1;
      } else {
        // Sort by Issues
        return a.violations.length > b.violations.length
          ? sortDirection
          : sortDirection * -1;
      }
    });
    const listItems = sites.map((val: any) => {
      const key = val.url;
      const screenshotCell = (
        <DataListCell key={`image-${val.url}`}>
          <a
            href={`../../coverage/screenshots/${val.screenshotFile}`}
            target="_blank"
          >
            <img
              src={`../../coverage/screenshots/${val.screenshotFile}`}
              style={{ maxHeight: "250px" }}
            />
          </a>
        </DataListCell>
      );
      const numIssues =
        this.getNumberOfIssues(val.violations) + this.getNumberOfIssues(val.incomplete);
      return (
        <DataListItem
          key={`item-${key}`}
          aria-labelledby={`url-${key}`}
          isExpanded={expanded.includes(key)}
        >
          <DataListItemRow>
            {val.violations.length > 0 || val.incomplete.length > 0 ? (
              <DataListToggle
                onClick={() => toggle(key)}
                isExpanded={expanded.includes(key)}
                id={key}
                aria-controls={`content-${key}`}
                style={{ cursor: "pointer" }}
              />
            ) : (
              <TogglePlaceholder />
            )}
            <DataListItemCells
              dataListCells={[
                <DataListCell
                  key={`order-${key}`}
                  onClick={() => toggle(key)}
                  style={{ cursor: "pointer" }}
                >
                  <span id={`order-${key}`}>{val.order}</span>
                </DataListCell>,
                <DataListCell
                  // width={4}
                  key={`url-${key}`}
                  onClick={() => toggle(key)}
                  style={{ cursor: "pointer" }}
                >
                  <span id={`url-${key}`}>{key}</span>
                </DataListCell>,
                <DataListCell
                  // width={2}
                  key={`label-${key}`}
                  onClick={() => toggle(key)}
                  style={{ cursor: "pointer" }}
                >
                  <span id={`label-${key}`}>{val.label}</span>
                </DataListCell>,
                <DataListCell
                  key={`issues-${key}`}
                  onClick={() => toggle(key)}
                  style={{ cursor: "pointer" }}
                >
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
          {(val.violations.length > 0 || val.incomplete.length > 0) && (
            <DataListContent
              aria-label={`Accessibility issues for ${key}`}
              id={`content-${key}`}
              isHidden={!expanded.includes(key)}
            >
              <IssuesDrawer
                url={val.url}
                violations={val.violations}
                incomplete={val.incomplete}
              />
            </DataListContent>
          )}
        </DataListItem>
      );
    });
    const onToggle = (isOpen) => {
      this.setState({
        isOpen,
      });
    };
    const onSelect = (event, selection) => {
      this.setState({
        selected: selection,
        isOpen: false,
      });
    };
    const onSortDirectionClick = () => {
      this.setState({
        sortIncreasing: !sortIncreasing,
      });
    };
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
          <Checkbox
            label="Expand all"
            isChecked={expandAll}
            onChange={handleExpandAll}
            aria-label="Expand all items"
            id="expandAllItemsId"
            name="expandAllItemsName"
          />
        </ToolbarItem>
        <ToolbarItem>
          <Checkbox
            label="Show passed URLs"
            isChecked={showPassedURLs}
            onChange={handleShowPass}
            aria-label="Show passed URLs"
            id="showPassedId"
            name="showPassedName"
          />
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
        <ToolbarItem>
          <Select
            onToggle={onToggle}
            onSelect={onSelect}
            selections={selected}
            isOpen={isOpen}
            direction="down"
            placeholderText="Sort by"
          >
            <SelectOption value="Sort by Order" />
            <SelectOption value="Sort by URL" />
            <SelectOption value="Sort by Issues" />
          </Select>
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
      </React.Fragment>
    );
    return (
      <React.Fragment>
        <Bullseye style={{ padding: "15px" }}>
          <TextContent>
            <Text component="h1">Accessibility report</Text>
          </TextContent>
        </Bullseye>
        <Flex
          justifyContent={{ default: "justifyContentSpaceBetween" }}
          alignItems={{ default: "alignItemsFlexStart" }}
          style={{ padding: "30px" }}
        >
          {sitesWithIssues &&
            sitesWithIssues.length > 0 &&
            (sitesWithIssues[0] as any).axeOptions && (
              <FlexItem>
                <Title headingLevel="h2" size="md">
                  Axe context
                </Title>
                <div style={codeblockStyle}>
                  {(sitesWithIssues[0] as any).context}
                </div>
                <Title headingLevel="h2" size="md">
                  Axe options
                </Title>
                <ClipboardCopy
                  isCode
                  variant={ClipboardCopyVariant.expansion}
                  isReadOnly
                >
                  {JSON.stringify(
                    (sitesWithIssues[0] as any).axeOptions,
                    null,
                    4
                  )}
                </ClipboardCopy>
              </FlexItem>
            )}
          <FlexItem>
            <DescriptionList isHorizontal>
              <DescriptionListGroup>
                <DescriptionListTerm>Tested URLs</DescriptionListTerm>
                <DescriptionListDescription>
                  {Object.keys(report).length}
                </DescriptionListDescription>
                <DescriptionListTerm>Pass</DescriptionListTerm>
                <DescriptionListDescription>
                  {sitesWithoutIssues.length}
                </DescriptionListDescription>
                <DescriptionListTerm>Fail</DescriptionListTerm>
                <DescriptionListDescription>
                  {sitesWithIssues.length}
                </DescriptionListDescription>
                <DescriptionListTerm>Pass rate</DescriptionListTerm>
                <DescriptionListDescription>
                  {(
                    (sitesWithoutIssues.length * 100) /
                    (sitesWithIssues.length + sitesWithoutIssues.length)
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
            <Chart
              ariaDesc="Number of test passes and failures"
              ariaTitle="Test report"
              containerComponent={
                <ChartVoronoiContainer constrainToVisibleArea />
              }
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
                      y: sitesWithoutIssues.length,
                    },
                  ]}
                  style={{ data: { fill: "lightgreen" } }}
                />
                <ChartBar
                  data={[
                    { name: "Fail", x: "Fail", y: sitesWithIssues.length },
                  ]}
                  style={{ data: { fill: "red" } }}
                />
              </ChartGroup>
            </Chart>
          </FlexItem>
        </Flex>
        <Toolbar id="toolbar">
          <ToolbarContent>{toolbarItems}</ToolbarContent>
        </Toolbar>
        <DataList aria-label="Accessibility report" isCompact>
          {listItems}
        </DataList>
      </React.Fragment>
    );
  }
}
