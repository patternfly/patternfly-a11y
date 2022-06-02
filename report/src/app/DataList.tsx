import React from "react";
import { DataList, TextContent, Text, Bullseye } from "@patternfly/react-core";
import { Toolbar } from "./Toolbar";
import { Infobar } from "./Infobar";
import { DataListItem } from "./DataListItem";

interface DataListState {
  expanded: string[];
  hideScreenshots: boolean;
  expandAll: boolean;
  isOpen: boolean;
  selected: any;
  sortIncreasing: boolean;
  includePossibleIssues: boolean;
  sitesWithIssues: any[];
  sitesWithoutIssues: any[];
  totalNumberIssues: number;
  severitySelections: string[];
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
  static whyDidYouRender = true;
  static displayName = "ExpandableDataList";
  constructor(props) {
    super(props);
    let totalNumberIssues: number = 0;
    Object.values(this.props.report).forEach((val) => {
      totalNumberIssues +=
        this.getNumberOfIssues((val as any).violations) +
        this.getNumberOfIssues((val as any).incomplete || []);
    });
    const reportValues = Object.values(props.report);
    const sitesWithIssues = reportValues.filter((val: any) => {
      return (
        val.violations.length > 0 ||
        (val.incomplete && val.incomplete.length > 0)
      );
    });
    const sitesWithoutIssues = reportValues.filter(
      (val: any) =>
        val.violations.length === 0 &&
        (!val.incomplete || val.incomplete.length === 0)
    );

    const expandAll = false;
    this.state = {
      expanded: expandAll
        ? sitesWithIssues.map((val: any) => `${val.order}_${val.url}`)
        : [],
      hideScreenshots: false,
      expandAll,
      isOpen: false,
      selected: "Sort by URL",
      sortIncreasing: true,
      includePossibleIssues: true,
      sitesWithIssues,
      sitesWithoutIssues,
      totalNumberIssues,
      severitySelections: ["critical", "serious", "moderate", "minor"],
    };
  }

  getNumberOfIssues = (category) => {
    let numIssues = 0;
    category.forEach((category) => (numIssues += category.nodes.length));
    return numIssues;
  };

  onSelect = (event, selection) => {
    this.setState({
      selected: selection,
    });
  };

  onSeveritySelect = (event, selection) => {
    this.setState({
      severitySelections: selection,
    });
  };

  onSortDirectionClick = () => {
    this.setState({
      sortIncreasing: !this.state.sortIncreasing,
    });
  };

  toggle = (id) => {
    const { expanded, sitesWithIssues } = this.state;
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
          : newExpanded.length === sitesWithIssues.length
          ? true
          : null,
    }));
  };
  handleChange = (checked, event) => {
    const target = event.target;
    const value = target.type === "checkbox" ? target.checked : target.value;
    this.setState({ hideScreenshots: value });
  };
  handleExpandAll = (checked, event) => {
    const target = event.target;
    const shouldExpandAll =
      target.type === "checkbox" ? target.checked : target.value;
    this.setState({
      expandAll: shouldExpandAll,
      expanded: shouldExpandAll ? Object.keys(this.props.report) : [],
    });
  };
  handlePossibleIssues = (checked, event) => {
    const target = event.target;
    const includePossibleIssues =
      target.type === "checkbox" ? target.checked : target.value;
    // perform a deep copy on this.props.report since we mutate it by setting incomplete
    this.setState({
      includePossibleIssues,
      sitesWithIssues: Object.values(
        JSON.parse(JSON.stringify(this.props.report))
      )
        .map((issue) => {
          if (!includePossibleIssues) {
            (issue as any).incomplete = [];
          }
          return issue;
        })
        .filter((val: any) => {
          return (
            val.violations.length > 0 ||
            (val.incomplete && val.incomplete.length > 0)
          );
        }),
    });
  };

  render() {
    const {
      hideScreenshots,
      expandAll,
      sortIncreasing,
      includePossibleIssues,
      sitesWithIssues,
      sitesWithoutIssues,
      totalNumberIssues,
    } = this.state;
    const { report } = this.props;
    return (
      <React.Fragment>
        <Bullseye style={{ padding: "15px" }}>
          <TextContent>
            <Text component="h1">Accessibility report</Text>
          </TextContent>
        </Bullseye>
        <Infobar
          axeOptions={
            (sitesWithIssues &&
              sitesWithIssues.length > 0 &&
              JSON.stringify(
                (sitesWithIssues[0] as any).axeOptions,
                null,
                4
              )) ||
            null
          }
          axeContext={
            (sitesWithIssues &&
              sitesWithIssues.length > 0 &&
              (sitesWithIssues[0] as any).context) ||
            null
          }
          sitesWithIssuesLength={sitesWithIssues.length}
          sitesWithoutIssuesLength={sitesWithoutIssues.length}
          reportLength={Object.keys(report).length}
          totalNumberIssues={totalNumberIssues}
        />
        <Toolbar
          hideScreenshots={hideScreenshots}
          handleChange={this.handleChange}
          expandAll={expandAll}
          handleExpandAll={this.handleExpandAll}
          includePossibleIssues={includePossibleIssues}
          handlePossibleIssues={this.handlePossibleIssues}
          sortIncreasing={sortIncreasing}
          onSelect={this.onSelect}
          onSeveritySelect={this.onSeveritySelect}
          onSortDirectionClick={this.onSortDirectionClick}
        />
        <DataList aria-label="Accessibility report" isCompact>
          {[
            ...this.state.sitesWithIssues,
            ...(this.state.sitesWithoutIssues || []),
          ]
            .filter((val: any) => {
              // filter out issues that do not match current severity selection
              val.filteredViolations = val.violations ? val.violations.filter((violation) => this.state.severitySelections.includes(violation.impact)) : [];
              val.filteredIncomplete = val.incomplete ? val.incomplete.filter((incomplete) => this.state.severitySelections.includes(incomplete.impact)) : [];
              const numViolations = val.filteredViolations?.length || 0; 
              const numIncomplete = val.filteredIncomplete?.length || 0; 
              if (numViolations + numIncomplete === 0) {
                if (this.state.severitySelections.includes("ok")) {
                  return val;
                }
                return null;
              } 
              return val;
            })
            .sort((a: any, b: any) => {
              const sortDirection = this.state.sortIncreasing ? 1 : -1;
              if (this.state.selected === "Sort by Order") {
                return Number.parseInt(a.order) > Number.parseInt(b.order)
                  ? sortDirection
                  : sortDirection * -1;
              } else if (this.state.selected === "Sort by URL") {
                return a.url > b.url ? sortDirection : sortDirection * -1;
              } else {
                // Sort by Issues
                const numViolationsA = this.getNumberOfIssues(a.filteredViolations);
                const numIncompleteA = this.getNumberOfIssues(a.filteredIncomplete || []);
                const numViolationsB = this.getNumberOfIssues(b.filteredViolations);
                const numIncompleteB = this.getNumberOfIssues(b.filteredIncomplete || []);
                if ((numViolationsA + numIncompleteA) < (numViolationsB + numIncompleteB)) {
                  return -1 * sortDirection;
                }
                if ((numViolationsA + numIncompleteA) > (numViolationsB + numIncompleteB)) {
                  return 1 * sortDirection;
                }
                return 0;
              }
            })
            .map((val: any) => {
              const key = `${val.order}_${val.url}`;
              return (
                <DataListItem
                  key={key}
                  val={val}
                  numIssues={
                    this.getNumberOfIssues(val.filteredViolations) +
                    this.getNumberOfIssues(val.filteredIncomplete || [])
                  }
                  isExpanded={this.state.expanded.includes(key)}
                  hideScreenshots={this.state.hideScreenshots}
                  toggle={this.toggle}
                />
              );
            })}
        </DataList>
      </React.Fragment>
    );
  }
}
