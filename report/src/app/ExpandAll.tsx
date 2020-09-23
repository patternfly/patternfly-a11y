import React from "react";
import { Checkbox } from "@patternfly/react-core";

const ExpandAllInternal = ({ expandAll, handleExpandAll }) => (
  <Checkbox
    label="Expand all"
    isChecked={expandAll}
    onChange={handleExpandAll}
    aria-label="Expand all items"
    id="expandAllItemsId"
    name="expandAllItemsName"
  />
);
ExpandAllInternal.displayName = "ExpandAll";
ExpandAllInternal.whyDidYouRender = true;
export const ExpandAll = React.memo(
    ExpandAllInternal
);