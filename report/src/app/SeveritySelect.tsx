import React from "react";
import { CheckboxSelect, CheckboxSelectOption } from '@patternfly/react-templates';

const Options: { content: string; value: string; description?: string; isDisabled?: boolean }[] = [
  { content: 'critical', value: 'critical' },
  { content: 'serious', value: 'serious' },
  { content: 'moderate', value: 'moderate' },
  { content: 'minor', value: 'minor' },
  { content: 'passed', value: 'ok' }
];

const SeveritySelectInternal = ({ onSelect }) => {
  const [selected, setSelected] = React.useState<string[]>([
    "critical",
    "serious",
    "moderate",
    "minor"
  ]);

  const initialOptions = React.useMemo<CheckboxSelectOption[]>(
    () => Options.map((o) => ({ ...o, selected: selected.includes(o.value) })),
    [selected]
  );

  React.useEffect(() => {
    onSelect(selected);
  }, [selected])

  // impact: "minor", "moderate", "serious", or "critical"
  return (
    <CheckboxSelect
      initialOptions={initialOptions}
      onSelect={(_ev, value) => {
        const val = String(value);
        setSelected((prevSelected) =>
          prevSelected.includes(val) ? prevSelected.filter((item) => item !== val) : [...prevSelected, String(val)]
        );
      }}
    />
  );
};
SeveritySelectInternal.displayName = "SeveritySelectInternal";
SeveritySelectInternal.whyDidYouRender = true;

export const SeveritySelect = React.memo(SeveritySelectInternal);
