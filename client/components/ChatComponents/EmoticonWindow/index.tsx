import React from 'react';
import {
  UnencryptedSettings,
} from '../../../storage/cacheFrontends/UnencryptedSettings';
import { Tab, TabPane, TabProps } from 'semantic-ui-react';
import { EmoticonTab } from './EmoticonTab';
import { StyleManifest } from '../../../emoticonConfig/types/StyleManifest';
import { SettingsTab } from './SettingsTab';
import { StickersTab } from './StickersTab';
import { GifsTab } from './GifsTab';

const tabStyle: React.CSSProperties = {
  height: '25vh',
  minHeight: 160,
  padding: 0,
  paddingTop: 8,
};

interface Props {
  onInsertEmoticon: (
    unicode: number, styleManifest: StyleManifest, path: string, tone: number,
  ) => void,
  onRefreshNeeded: Function,
}

class EmoticonWindow extends React.Component<Props> {
  state = {
    activeTab: UnencryptedSettings.lastEmoticonTab(),
  };

  handleTabChange = (_: any, data: TabProps) => {
    const activeTab = data.activeIndex;
    UnencryptedSettings.setActiveEmoticonTab(activeTab).catch(console.error);
    this.setState({
      activeTab,
    });
  };

  render() {
    const darkMode = UnencryptedSettings.isDarkModeEnabled();
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
                    <SettingsTab onRefreshNeeded={this.props.onRefreshNeeded}/>
                  </TabPane>
                );
              },
            },
            {
              menuItem: 'Emoticons', render: () => {
                return (
                  <TabPane inverted={!darkMode} style={tabStyle}>
                    <EmoticonTab
                      onInsertEmoticon={this.props.onInsertEmoticon}
                    />
                  </TabPane>
                );
              },
            },
            {
              menuItem: 'Stickers', render: () => {
                return (
                  <TabPane inverted={!darkMode} style={tabStyle}>
                    <StickersTab/>
                  </TabPane>
                );
              },
            },
            {
              menuItem: 'GIFs', render: () => {
                return (
                  <TabPane inverted={!darkMode} style={tabStyle}>
                    <GifsTab/>
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
