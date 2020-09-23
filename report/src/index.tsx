console.log(`script path: ${process.cwd()}`)
console.log(`process.env.NODE_ENV: ${process.env.NODE_ENV}`)

import "./wdyr";
import * as React from "react";
import { render } from "react-dom";
import "@patternfly/react-core/dist/styles/base.css";
import { ExpandableDataList } from "./app/DataList";

let results;
if (process.env.NODE_ENV === 'production') {
  results = require(`${process.cwd()}coverage/results.json`)
} else {
  results = require(`../../coverage/results.json`)
}

render(
  <ExpandableDataList report={results} />,
  document.getElementById("root")
);
