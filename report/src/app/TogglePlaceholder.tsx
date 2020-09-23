import React from "react";
import { css } from "@patternfly/react-styles";
import dataListToggleStyles from "@patternfly/react-styles/css/components/DataList/data-list";

export const TogglePlaceholder = () => (
  <div className={css(dataListToggleStyles.dataListItemControl)}>
    <div
      className={css(dataListToggleStyles.dataListToggle)}
      style={{ width: "48px", height: "36px" }}
    ></div>
  </div>
);
