import React from 'react';
import { Settings } from '../../../storage/cacheFrontends/Settings';
import { Tab, TabPane, TabProps } from 'semantic-ui-react';
import { EmoticonTab } from './EmoticonTab';

const tabStyle: React.CSSProperties = {
  height: '25vh',
  minHeight: 160,
  padding: 0,
  paddingTop: 8,
};

class EmoticonWindow extends React.Component {
  state = {
    activeTab: Settings.lastEmoticonTab(),
  };

  handleTabChange = (_: any, data: TabProps) => {
    const activeTab = data.activeIndex;
    Settings.setActiveEmoticonTab(activeTab).catch(console.error);
    this.setState({
      activeTab,
    });
  };

  render() {
    const darkMode = Settings.isDarkModeEnabled();
    const { activeTab } = this.state;
    return (
      <div>
        <Tab
          activeIndex={activeTab}
          menu={{ inverted: !darkMode, attached: true, tabular: true }}
          onTabChange={this.handleTabChange}
          panes={[
            {
              menuItem: 'Settings', render: () => {
                return (
                  <TabPane inverted={!darkMode} style={tabStyle}>
                    Settings TBD
                  </TabPane>
                );
              },
            },
            {
              menuItem: 'Emoticons', render: () => {
                return (
                  <TabPane
                    className="54"
                    inverted={!darkMode}
                    style={tabStyle}
                  >
                    <EmoticonTab/>
                  </TabPane>
                );
              },
            },
            {
              menuItem: 'Stickers', render: () => {
                return (
                  <TabPane inverted={!darkMode} style={tabStyle}>
                    Stickers TBD
                  </TabPane>
                );
              },
            },
            {
              menuItem: 'GIFs', render: () => {
                return (
                  <TabPane inverted={!darkMode} style={tabStyle}>
                    GIFs TBD
                  </TabPane>
                );
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
