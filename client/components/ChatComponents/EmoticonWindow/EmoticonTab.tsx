import React from 'react';
import { Settings } from '../../../storage/cacheFrontends/Settings';
import { ChatBoxButton } from '../ChatBoxButton';
import { getAllStyles } from '../../../emoticonConfig';
import { Emoticon } from '../Emoticon';

const ICON_PATH = 'assets/icons';
const MAX_EMOTICONS_PER_ROW = 9;

const containerStyle: React.CSSProperties = {
  position: 'relative',
  height: '100%',
};

const searchContainerStyle: React.CSSProperties = {
  minWidth: 380,
  overflow: 'auto hidden',
  marginTop: -6,
  paddingLeft: 8,
  paddingRight: 8,
};

const emoSearchStyle: React.CSSProperties = {
  display: 'inline-block',
  padding: 4,
  maxWidth: 170,
};

const toneSettingsStyle: React.CSSProperties = {
  display: 'inline-block',
  marginTop: 8,
  verticalAlign: 'middle',
};

const emoticonContainerStyle: React.CSSProperties = {
  maxHeight: 108,
  padding: 2,
  marginRight: 15,
  overflowY: 'auto',
};

const emoticonRowStyle: React.CSSProperties = {
  display: 'flex',
  flexDirection: 'row',
  flexWrap: 'wrap',
  justifyContent: 'space-around',
  alignItems: 'stretch',
  alignContent: 'space-around',
  marginLeft: -3,
};

const emoticonStyle: React.CSSProperties = {
  flexGrow: 0,
  flexShrink: 1,
  flexBasis: 'auto',
  alignSelf: 'auto',
  order: 0,
  width: 40,
};

const chooserStyle: React.CSSProperties = {
  float: 'right',
  marginTop: -6,
  marginBottom: -6,
};

const chooserLabelStyle: React.CSSProperties = {
  display: 'inline-block',
  marginTop: 15,
  verticalAlign: 'top',
};

class EmoticonTab extends React.Component {
  state = {
    activeStyle: Settings.lastActiveEmoticonStyle(),
    searchText: '',
  };

  componentDidMount() {
    window.addEventListener('resize', this.handleResize);
  }

  componentWillUnmount() {
    window.removeEventListener('resize', this.handleResize);
  }

  handleResize = () => {
    this.forceUpdate();
  };

  handleSearch = (event) => {
    this.setState({
      searchText: event.target.value,
    });
  };

  drawEmoticonList = () => {
    const activeStyle = this.state.activeStyle;
    const style = getAllStyles()[activeStyle];
    const {
      availableEmoticons, toneSupport, dir, filePrefix, lookupTable,
    } = style;

    const viewportWidth = (window.innerWidth / window.devicePixelRatio) * 0.35;
    const itemsPerRow = Math.min(
      Math.ceil(viewportWidth / MAX_EMOTICONS_PER_ROW), MAX_EMOTICONS_PER_ROW,
    );

    const result: JSX.Element[] = [];
    let currentLine: JSX.Element[] = [];
    for (let i = 0, len = availableEmoticons.length; i < len; i++) {
      const unicode: number = availableEmoticons[i];
      currentLine.push(
        <div key={unicode} style={emoticonStyle}>
          <Emoticon
            key={`${activeStyle}-${unicode}`}
            unicode={unicode}
            styleManifest={style}
          />
        </div>,
      );
      if ((i + 1) % itemsPerRow === 0) {
        result.push(
          <div key={`row-${activeStyle}-${i}`} style={emoticonRowStyle}>
            {currentLine}
          </div>,
        );
        currentLine = [];
      }
    }

    // Push trailing results.
    if (currentLine.length < itemsPerRow) {
      // This prevents the flexbox visual glitches.
      for (let i = currentLine.length; i < itemsPerRow; i++) {
        currentLine.push(
          <div key={`back-fill-${i}`} style={emoticonStyle}/>,
        );
      }
    }
    result.push(
      <div key={`${activeStyle}-last-row`} style={emoticonRowStyle}>
        {currentLine}
      </div>,
    );

    return result;
  };

  handleStyleChange = (number: number) => {
    Settings.setActiveEmoticonStyle(number).catch(console.error);
    this.setState({
      activeStyle: number,
    });
  };

  render() {
    const darkMode = Settings.isDarkModeEnabled();
    const { searchText } = this.state;
    return (
      <div style={containerStyle}>
        <div style={searchContainerStyle}>
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

          <div style={chooserStyle}>
            <div style={chooserLabelStyle}>Style:</div>
            <ChatBoxButton
              fileName={'assets/emo/0-OpenMoji/1F642.webp'}
              width={28}
              style={{ verticalAlign: 'text-bottom' }}
              onClick={() => this.handleStyleChange(0)}
            />
            <ChatBoxButton
              fileName={'assets/emo/1-Noto/emoji_u1f642.webp'}
              width={23}
              style={{ verticalAlign: 'text-bottom', marginBottom: 9 }}
              onClick={() => this.handleStyleChange(1)}
            />
          </div>
        </div>
        <div style={emoticonContainerStyle}>
          {this.drawEmoticonList()}
        </div>
        <br/>
      </div>
    );
  }
}

export {
  EmoticonTab,
};
