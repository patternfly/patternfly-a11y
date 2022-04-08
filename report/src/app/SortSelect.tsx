import React from "react";
import { Select, SelectOption } from "@patternfly/react-core";

const SortSelectInternal = ({ onSelect }) => {
  const [isOpen, setIsOpen] = React.useState(false);
  const [selected, setSelected] = React.useState("Sort by URL");
  const onToggle = (isOpen) => {
    setIsOpen(isOpen);
  };
  const onSortSelect = (event, selection) => {
    setIsOpen(false);
    setSelected(selection);
    onSelect(event, selection);
  };
  return (
    <Select
      onToggle={onToggle}
      onSelect={onSortSelect}
      selections={selected}
      isOpen={isOpen}
      direction="down"
      placeholderText="Sort by"
      menuAppendTo={document.body}
    >
      {/* <SelectOption value="Sort by Order" /> */}
      <SelectOption value="Sort by URL" />
      <SelectOption value="Sort by Issues" />
    </Select>
  );
};
SortSelectInternal.displayName = "SortSelectInternal";
SortSelectInternal.whyDidYouRender = true;

export const SortSelect = React.memo(
  SortSelectInternal
);
