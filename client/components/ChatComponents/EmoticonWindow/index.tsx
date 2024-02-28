import React from 'react';
import { Settings } from '../../../storage/cacheFrontends/Settings';
import { Tab, TabPane, TabProps } from 'semantic-ui-react';
import { EmoticonTab } from './EmoticonTab';

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
  state = {
    activeTab: Settings.lastEmoticonTab(),
  };

  handleTabChange = (_: any, data: TabProps) => {
    const activeTab = data.activeIndex;
    Settings.setLastEmoticonTab(activeTab).catch(console.error);
    this.setState({
      activeTab,
    });
  };

  render() {
    const darkMode = Settings.isDarkModeEnabled();
    const { activeTab } = this.state;
    return (
      <div style={containerStyle}>
        <Tab
          activeIndex={activeTab}
          menu={{ inverted: !darkMode, attached: true, tabular: true }}
          onTabChange={this.handleTabChange}
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
                return (
                  <TabPane inverted={!darkMode} style={tabStyle}>
                    <EmoticonTab/>
                  </TabPane>
                );
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
