import React from "react";
import { Select, SelectOption } from "@patternfly/react-core";

const SeveritySelectInternal = ({ onSelect }) => {
  const [isOpen, setIsOpen] = React.useState(false);
  const [selected, setSelected] = React.useState([
    "critical",
    "serious",
    "moderate",
    "minor",
  ]);
  const onToggle = (isOpen) => {
    setIsOpen(isOpen);
  };
  const onSeveritySelect = (event, selection) => {
    let newSels;
    if (selected.includes(selection)) {
      newSels = selected.filter((item) => item !== selection);
      setSelected(newSels);
    } else {
      newSels = [...selected, selection];
      setSelected(newSels);
    }
    onSelect(event, newSels);
  };
  // impact: "minor", "moderate", "serious", or "critical"
  return (
    <Select
      onToggle={onToggle}
      onSelect={onSeveritySelect}
      selections={selected}
      isOpen={isOpen}
      direction="down"
      placeholderText="Filter by severity"
      variant="checkbox"
      menuAppendTo={document.body}
    >
      <SelectOption value="critical">Critical</SelectOption>
      <SelectOption value="serious">Serious</SelectOption>
      <SelectOption value="moderate">Moderate</SelectOption>
      <SelectOption value="minor">Minor</SelectOption>
      <SelectOption value="ok">Passed</SelectOption>
    </Select>
  );
};
SeveritySelectInternal.displayName = "SeveritySelectInternal";
SeveritySelectInternal.whyDidYouRender = true;

export const SeveritySelect = React.memo(SeveritySelectInternal);
