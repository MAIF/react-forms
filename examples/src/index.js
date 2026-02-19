import React from 'react';
import { createRoot } from 'react-dom/client';
import './index.css';
import Playground from './Playground';
import Storybook from './Storybook';
import Tabs from './Tabs';
import ReleaseCandidate from './ReleaseCandidate'

const root = createRoot(document.getElementById('root'));
root.render(
  <React.StrictMode>
    <Tabs tabs={[
      {
        id: "playground",
        label: "Playground",
        content: <Playground />
      },
      // {
      //   id: "release-candidate",
      //   label: "Release Candidate",
      //   content: <ReleaseCandidate />
      // },
      {
        id: "storybook",
        label: "Storybook",
        content: <Storybook />
      }]}
      defaultTab="playground" />
  </React.StrictMode>
);
