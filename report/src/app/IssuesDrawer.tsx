import React from "react";
import {
  SimpleList,
  SimpleListGroup,
  SimpleListItem,
  DrawerPanelContent,
  DrawerHead,
  Title,
  FlexItem,
  DrawerPanelBody,
  Card,
  Drawer,
  DrawerContent,
  DrawerContentBody,
  Flex,
  Pagination,
  ExpandableSection,
  Tooltip,
} from "@patternfly/react-core";
import { codeblockStyle } from "./DataList";
import InfoCircleIcon from "@patternfly/react-icons/dist/js/icons/info-circle-icon";
import ExclamationCircleIcon from "@patternfly/react-icons/dist/js/icons/exclamation-circle-icon";

interface IssuesDrawerState {
  currentViolationOrIncomplete: any;
  issuesPage: number;
  type: string;
}

interface IssuesDrawerProps {
  url: string;
  violations: any[];
  incomplete: any[];
}

export class IssuesDrawer extends React.Component<
  IssuesDrawerProps,
  IssuesDrawerState
> {
  static whyDidYouRender = true;
  static displayName = "IssuesDrawer";
  state = {
    currentViolationOrIncomplete:
      this.props.violations[0] || this.props.incomplete[0],
    issuesPage: 1,
    type: this.props.violations[0] ? "violation" : "incomplete",
  };

  render() {
    const { url, violations, incomplete } = this.props;
    const { currentViolationOrIncomplete, issuesPage, type } = this.state;
    const onSelectListItem = (listItem, listItemProps) => {
      let result;
      const typeFromClass = listItemProps.className.split("__")[0];
      const idFromClass = listItemProps.className.split("__")[1];
      if (typeFromClass === "violation") {
        result = violations.find((violation) => violation.id === idFromClass);
      } else {
        // 'incomplete'
        result = incomplete.find((incomplete) => incomplete.id === idFromClass);
      }
      this.setState({
        currentViolationOrIncomplete: result,
        issuesPage: 1,
        type: typeFromClass,
      });
    };
    const onSetPage = (_event, pageNumber) => {
      console.log(`page: ${pageNumber}`);
      this.setState({
        issuesPage: pageNumber,
      });
    };
    const drawerContent = (
      <React.Fragment>
        <SimpleList onSelect={onSelectListItem}>
          {violations && violations.length > 0 && (
            <SimpleListGroup
              title={
                <span>
                  <Tooltip content="Failed accessibility tests">
                    <ExclamationCircleIcon color="red" />
                  </Tooltip>{" "}
                  <span style={{ paddingLeft: "5px" }}>Violations</span>
                </span>
              }
            >
              {violations.map((violation, index) => (
                <SimpleListItem
                  key={violation.id}
                  className={`violation__${violation.id}`}
                  isActive={index === 0}
                >
                  {violation.help}{" "}
                  <span style={{ float: "right" }}>
                    {violation.nodes.length}
                  </span>
                </SimpleListItem>
              ))}
            </SimpleListGroup>
          )}
          {incomplete && incomplete.length > 0 && (
            <SimpleListGroup
              title={
                <span>
                  <Tooltip content="Issues that could neither be determined to definitively pass or definitively fail">
                    <InfoCircleIcon color="blue" />
                  </Tooltip>{" "}
                  <span style={{ paddingLeft: "5px" }}>Needs review</span>
                </span>
              }
            >
              {incomplete.map((incomplete, index) => (
                <SimpleListItem
                  key={incomplete.id}
                  className={`incomplete__${incomplete.id}`}
                >
                  {incomplete.help}{" "}
                  <span style={{ float: "right" }}>
                    {incomplete.nodes.length}
                  </span>
                </SimpleListItem>
              ))}
            </SimpleListGroup>
          )}
        </SimpleList>
      </React.Fragment>
    );

    let anyMessages = 0;
    let noneMessages = 0;
    let allMessages = 0;
    currentViolationOrIncomplete.nodes[issuesPage - 1].any.forEach((any) => {
      if (any.message) {
        anyMessages++;
      }
    });
    currentViolationOrIncomplete.nodes[issuesPage - 1].none.forEach((none) => {
      if (none.message) {
        noneMessages++;
      }
    });
    currentViolationOrIncomplete.nodes[issuesPage - 1].all.forEach((all) => {
      if (all.message) {
        allMessages++;
      }
    });
    let hasOnlyOneCategory;
    if (anyMessages && !noneMessages && !allMessages) {
      hasOnlyOneCategory = "any";
    } else if (!anyMessages && noneMessages && !allMessages) {
      hasOnlyOneCategory = "none";
    } else if (!anyMessages && !noneMessages && allMessages) {
      hasOnlyOneCategory = "all";
    }

    const getRelatedNodes = (url, relatedNodes) => {
      if (relatedNodes && relatedNodes.length > 0) {
        const nodes = relatedNodes.filter((n) => n.target);
        if (nodes && nodes.length > 0) {
          return (
            <React.Fragment>
              <div>Related nodes:</div>
              {nodes.map((n, i) => (
                <div style={codeblockStyle} key={`${url}-related-node-${i}`}>
                  {n.target}
                </div>
              ))}
            </React.Fragment>
          );
        }
      }
    };

    const ShowMoreContent = () => (
      <FlexItem>
        <div>
          <strong>To solve this violation, you need to:</strong>
        </div>
        {hasOnlyOneCategory ? (
          <React.Fragment>
            <div>
              {hasOnlyOneCategory === "any" && anyMessages > 1
                ? "Fix at least one (1) of these issues:"
                : "Fix the following:"}
            </div>
            <div>
              {currentViolationOrIncomplete.nodes[issuesPage - 1][
                hasOnlyOneCategory
              ].map(
                (node, i) =>
                  node.message && (
                    <div key={`${url}-message-${i}`}>
                      <div style={codeblockStyle}>{node.message}</div>
                      {getRelatedNodes(url, node.relatedNodes)}
                    </div>
                  )
              )}
            </div>
          </React.Fragment>
        ) : (
          <React.Fragment>
            <div style={{ paddingTop: "5px" }}>
              Fix at least one (1) of these issues:
            </div>
            {currentViolationOrIncomplete.nodes[issuesPage - 1].any.map(
              (node, i) =>
                node.message && (
                  <div style={codeblockStyle} key={`${url}-any-message-${i}`}>
                    {node.message}
                  </div>
                )
            )}
            <div style={{ padding: "15px 0 15px 0" }}>
              <strong>and</strong>
            </div>
            <div>Fix the following:</div>
            {currentViolationOrIncomplete.nodes[issuesPage - 1].none.map(
              (node, i) =>
                node.message && (
                  <div style={codeblockStyle} key={`${url}-none-message-${i}`}>
                    {node.message}
                  </div>
                )
            )}
            {currentViolationOrIncomplete.nodes[issuesPage - 1].all.map(
              (node, i) =>
                node.message && (
                  <div style={codeblockStyle} key={`${url}-all-message-${i}`}>
                    {node.message}
                  </div>
                )
            )}
          </React.Fragment>
        )}
      </FlexItem>
    );

    const panelContent = (
      <DrawerPanelContent widths={{ default: "width_66" }}>
        <DrawerHead>
          <Title headingLevel="h2" size="lg">
            {currentViolationOrIncomplete.description}{" "}
            <span style={{ fontSize: "small", paddingLeft: "15px" }}>
              Impact: {currentViolationOrIncomplete.impact}
            </span>
          </Title>
          <div>
            Rule ID: {currentViolationOrIncomplete.id}
          </div>
          <div>
            <a href={currentViolationOrIncomplete.helpUrl} target="_blank">
              Learn more
            </a>
          </div>
        </DrawerHead>
        <DrawerPanelBody>
          {currentViolationOrIncomplete.nodes.length > 1 && (
            <Pagination
              itemCount={currentViolationOrIncomplete.nodes.length}
              perPage={1}
              page={issuesPage}
              onSetPage={onSetPage}
              widgetId="pagination-options-menu-top"
            />
          )}
          <Flex
            spaceItems={{ default: "spaceItemsLg" }}
            direction={{ default: "column" }}
          >
            <FlexItem>
              <div>Element location:</div>
              <div style={codeblockStyle}>
                {currentViolationOrIncomplete.nodes[issuesPage - 1].target}
              </div>
            </FlexItem>
            <FlexItem>
              <div>Element source:</div>
              <div style={codeblockStyle}>
                {currentViolationOrIncomplete.nodes[issuesPage - 1].html}
              </div>
            </FlexItem>
            <FlexItem>
              <hr />
            </FlexItem>
            {type === "incomplete" && (
              <FlexItem>
                <div>
                  <strong>
                    We are not sure this is an issue, because it could neither
                    be determined to definitively pass or definitively fail
                  </strong>
                </div>
              </FlexItem>
            )}
            {type === "incomplete" ? (
              <ExpandableSection toggleText="I want to review this">
                <ShowMoreContent />
              </ExpandableSection>
            ) : (
              <ShowMoreContent />
            )}
          </Flex>
        </DrawerPanelBody>
      </DrawerPanelContent>
    );
    return (
      <Card>
        <Drawer isStatic className="pf-a11y-drawer-content">
          <DrawerContent panelContent={panelContent}>
            <DrawerContentBody>{drawerContent}</DrawerContentBody>
          </DrawerContent>
        </Drawer>
      </Card>
    );
  }
}
