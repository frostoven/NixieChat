import React from 'react';
import { Settings } from '../../../storage/cacheFrontends/Settings';
import { Tab, TabPane } from 'semantic-ui-react';

const containerStyle: React.CSSProperties = {
  position: 'absolute',
  bottom: 45,
  left: 0,
  right: 0,
};

const tabStyle: React.CSSProperties = {
  height: '30vh',
};

class EmoticonWindow extends React.Component {
  render() {
    const darkMode = Settings.isDarkModeEnabled();
    return (
      <div style={containerStyle}>
        <Tab
          menu={{ inverted: !darkMode, attached: true, tabular: true }}
          panes={[
            {
              menuItem: 'Settings', render: () => {
                return (<TabPane inverted={!darkMode} style={tabStyle}>
                  Tab 1 Content
                </TabPane>);
              },
            },
            {
              menuItem: 'Emoticons', render: () => {
                return (<TabPane inverted={!darkMode} style={tabStyle}>
                  Tab 2 Content
                </TabPane>);
              },
            },
            {
              menuItem: 'Stickers', render: () => {
                return (<TabPane inverted={!darkMode} style={tabStyle}>
                  Tab 3 Content
                </TabPane>);
              },
            },
            {
              menuItem: 'GIFs', render: () => {
                return (<TabPane inverted={!darkMode} style={tabStyle}>
                  Tab 3 Content
                </TabPane>);
              },
            },
          ]}
        />
      </div>
    );
  }
}

export {
  EmoticonWindow,
};
