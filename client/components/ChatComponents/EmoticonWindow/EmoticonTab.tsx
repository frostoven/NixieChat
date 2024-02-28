import React from 'react';
import { Settings } from '../../../storage/cacheFrontends/Settings';
import { ChatBoxButton } from '../ChatBoxButton';

const ICON_PATH = 'assets/icons';

const tabStyle: React.CSSProperties = {
  height: '30vh',
};

const emoSearchStyle: React.CSSProperties = {
  display: 'inline-block',
};

const toneSettingsStyle: React.CSSProperties = {
  display: 'inline-block',
  marginTop: 8,
  verticalAlign: 'middle',
};

class EmoticonTab extends React.Component {
  state = {
    searchText: '',
  };

  handleSearch = (event) => {
    this.setState({
      searchText: event.target.value,
    });
  };

  render() {
    const darkMode = Settings.isDarkModeEnabled();
    const { searchText } = this.state;
    return (
      <div>
        <div>
          <input
            autoFocus
            value={searchText}
            placeholder={'Search...'}
            style={emoSearchStyle}
            onChange={this.handleSearch}
          />
          <ChatBoxButton
            fileName={`${ICON_PATH}/cog.webp`}
            style={toneSettingsStyle}
          />
        </div>
        <div>
          [][][][][][][][]<br/>
          [][][][][][][][]<br/>
          [][][][][][][][]<br/>
          [][][][][][][][]<br/>
        </div>
        <div>
          Style: [] [] [] []
        </div>
      </div>
    );
  }
}

export {
  EmoticonTab,
};
