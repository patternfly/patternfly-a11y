import * as React from 'react';
import { render } from 'react-dom';
import { Router, Link } from '@reach/router';
import '@patternfly/react-core/dist/styles/base.css';
import {
  PageSection,
  Gallery,
  GalleryItem,
  Card,
  CardBody
} from '@patternfly/react-core';
import { PageLayout } from './app/PageLayout';

let Home = (props: {path?: string}) => (
  <PageLayout>
    <PageSection>
      <h1>This is homepage content</h1>
    </PageSection>
  </PageLayout>
);

let Dash = (props: {path?: string}) => (
  <PageLayout>
    <PageSection>
      <h1>This is dashboard content</h1>
      <Gallery hasGutter>
        {Array.apply(0, Array(10)).map((x, i) => (
          <GalleryItem key={i}>
            <Card>
              <CardBody>This is a card</CardBody>
            </Card>
          </GalleryItem>
        ))}
      </Gallery>
    </PageSection>
  </PageLayout>
);

render(
  <Router>
    <Home path="/" />
    <Dash path="dashboard" />
  </Router>,
  document.getElementById('root')
);
