import * as React from "react";
import { render } from "react-dom";
import "@patternfly/react-core/dist/styles/base.css";
import { ExpandableDataList } from "./app/DataList";
// @ts-ignore
import "./styles.css";

fetch('/results.json')
  .then(res => res.json())
  .then(results => 
    render(
      <ExpandableDataList report={results} />,
      document.getElementById("root")
    )
  )
  .catch((error) => {
    console.error('Error:', error);
  });

