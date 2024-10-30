import React from "react";
import {
	SimpleSelect,
  SimpleSelectOption
} from '@patternfly/react-templates';

const SortSelectInternal = ({ onSelect }) => {
  const [selected, setSelected] = React.useState("Sort by URL");

  const options: SimpleSelectOption[] = [
    { content: 'Sort by URL', value: 'Sort by URL', selected: selected === 'Sort by URL' },
    { content: 'Sort by Issues', value: 'Sort by Issues', selected: selected === 'Sort by Issues' }
  ];
  return (
    <SimpleSelect
      initialOptions={options}
      onSelect={(_ev, selection) => setSelected(String(selection))}
    />
  );
};
SortSelectInternal.displayName = "SortSelectInternal";
SortSelectInternal.whyDidYouRender = true;

export const SortSelect = React.memo(
  SortSelectInternal
);
