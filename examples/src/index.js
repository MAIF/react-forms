import React from 'react';
import ReactDOM from 'react-dom';
import './index.css';
import Playground from './Playground';
import Storybook from './Storybook';
import Tabs from './Tabs';
import ReleaseCandidate from './ReleaseCandidate'

ReactDOM.render(
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
  </React.StrictMode>,
  document.getElementById('root')
);
