import React from 'react';
import { Settings } from '../../../storage/cacheFrontends/Settings';
import { getAllStyles } from '../../../emoticonConfig';
import { Emoticon } from '../Emoticon';
import {
  Dropdown, DropdownDivider,
  DropdownHeader,
  DropdownItem, DropdownItemProps,
  DropdownMenu, Form,
} from 'semantic-ui-react';
import { StyleManifest } from '../../../emoticonConfig/types/StyleManifest';

const TONE_PREFIX = 'assets/emo/1-Noto/emoji_u';
const MAX_EMOTICONS_PER_ROW = 9;

// TODO: Find a way to make this more generic. These fucking icon size
//  differences drive me insane.
// Used to squeeze icon previews into small spaces. Not used for  emoticon
// chooserStyle lists.
const iconPreviewConfig = [
  {
    src: 'assets/emo/0-OpenMoji/1F642.webp',
    width: 28,
    marginTop: -14,
    marginRight: -19,
    marginLeft: -19,
    marginBottom: -3,
  },
  {
    src: 'assets/emo/1-Noto/emoji_u1f642.webp',
    width: 21,
    marginTop: -10,
    marginRight: -14,
    marginLeft: -15,
  },
];

const emoticonsDisabledStyle: React.CSSProperties = {
  textAlign: 'center',
  width: '80%',
  margin: 'auto',
};


const containerStyle: React.CSSProperties = {
  position: 'relative',
  height: '100%',
};

const searchContainerStyle: React.CSSProperties = {
  marginTop: -6,
  paddingTop: 4,
  paddingLeft: 8,
  paddingRight: 8,
  whiteSpace: 'nowrap',
};

const emoSearchStyle: React.CSSProperties = {
  display: 'inline-block',
  padding: 4,
  maxWidth: 170,
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

const toneStyle = {
  marginLeft: 4,
  marginRight: 4,
  marginTop: 4,
  width: 21,
};

const chooserStyle: React.CSSProperties = {
  display: 'inline-block',
  marginTop: -7,
  marginBottom: -5,
  verticalAlign: 'middle',
  paddingLeft: 8,
};

const chooserDropdownStyle: React.CSSProperties = {
  height: 29,
};

const dropdownMenuStyle: React.CSSProperties = {
  marginLeft: -87,
  paddingBottom: 2,
};

const dropdownRotatedTextStyle: React.CSSProperties = {
  position: 'absolute',
  top: 25,
  left: -10,
  width: 0,
  textWrap: 'wrap',
  whiteSpace: 'pre-line',
};

const chooserItemStyle: React.CSSProperties = {
  marginLeft: 28,
};

const chooserItemTextStyle: React.CSSProperties = {
  paddingLeft: 4,
  display: 'inline-block',
  marginLeft: 28,
  marginTop: -7,
  verticalAlign: 'top',
};

interface Props {
  onInsertEmoticon: (
    unicode: number, styleManifest: StyleManifest, path: string,
  ) => void,
}

class EmoticonTab extends React.Component<Props> {
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

  handleSearch = (event: React.ChangeEvent<HTMLInputElement>) => {
    this.setState({
      searchText: event.target.value,
    });
  };

  handleEmoticonClick = (
    unicode: number, styleManifest: StyleManifest, path: string,
  ) => {
    this.props.onInsertEmoticon(unicode, styleManifest, path);
  };

  drawEmoticonList = () => {
    const activeStyle = this.state.activeStyle;
    const style = getAllStyles()[activeStyle];
    const { availableEmoticons } = style;

    const viewportWidth = (window.innerWidth / window.devicePixelRatio) * 0.35;
    const itemsPerRow = Math.min(
      Math.ceil(viewportWidth / MAX_EMOTICONS_PER_ROW), MAX_EMOTICONS_PER_ROW,
    );

    const result: JSX.Element[] = [];
    let currentLine: JSX.Element[] = [];
    for (let i = 0, len = availableEmoticons.length; i < len; i++) {
      const unicode: number = availableEmoticons[i];
      currentLine.push(
        // TODO: for tone change, consider changing the emoticon key. This
        //  allows the Emoticon component to ignore all non-tone-change
        //  renders.
        <div key={unicode} style={emoticonStyle}>
          <Emoticon
            key={`${activeStyle}-${unicode}`}
            unicode={unicode}
            styleManifest={style}
            onClick={this.handleEmoticonClick}
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

  handleStyleChange = (_: any, result: DropdownItemProps) => {
    Settings.setActiveEmoticonStyle(result.value).catch(console.error);
    this.setState({
      activeStyle: result.value,
    });
  };

  getStyleIconPreview = (styleIndex: number) => {
    const previewInfo = iconPreviewConfig[styleIndex];
    return (
      <img
        alt=""
        src={previewInfo.src}
        style={{
          width: previewInfo.width,
          marginTop: previewInfo.marginTop,
          marginRight: previewInfo.marginRight,
          marginLeft: previewInfo.marginLeft,
          marginBottom: previewInfo.marginBottom,
        }}
      />
    );
  };

  render() {
    const darkMode = Settings.isDarkModeEnabled();

    const richInputEnabled = Settings.richInputEnabled() || false;
    if (!richInputEnabled) {
      return (
        <Form inverted={!darkMode} style={emoticonsDisabledStyle}>
          <Form.Field>
            <br/><br/>
            <label>
              Emoticons are disabled when using the fallback input style.
            </label>
            <label>
              You may change this option from the Settings tab.
            </label>
          </Form.Field>
        </Form>
      )
    }

    const { searchText, activeStyle } = this.state;
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
          <div style={chooserStyle}>
            <Dropdown
              button
              className={`icon thin-dropdown ${darkMode ? '' : 'dropdown-light-mode'}`}
              labeled
              // @ts-ignore
              text={this.getStyleIconPreview(activeStyle)}
              style={chooserDropdownStyle}
            >
              <DropdownMenu style={dropdownMenuStyle}>
                <img
                  src={`${TONE_PREFIX}1f44d.webp`}
                  style={toneStyle} alt=""
                />
                <img
                  src={`${TONE_PREFIX}1f44d_1f3fb.webp`}
                  style={toneStyle} alt=""
                />
                <img
                  src={`${TONE_PREFIX}1f44d_1f3fc.webp`}
                  style={toneStyle} alt=""
                />
                <img
                  src={`${TONE_PREFIX}1f44d_1f3fd.webp`}
                  style={toneStyle} alt=""
                />
                <img
                  src={`${TONE_PREFIX}1f44d_1f3fe.webp`}
                  style={toneStyle} alt=""
                />
                <img
                  src={`${TONE_PREFIX}1f44d_1f3ff.webp`}
                  style={toneStyle} alt=""
                />

                <DropdownDivider/>

                <DropdownHeader
                  content="s t y l e"
                  style={dropdownRotatedTextStyle}
                />

                <DropdownItem
                  key={'OpenMoji'}
                  value={0}
                  style={chooserItemStyle}
                  onClick={this.handleStyleChange}
                >
                  {this.getStyleIconPreview(0)}
                  <div style={chooserItemTextStyle}>
                    OpenMoji
                  </div>
                </DropdownItem>

                <DropdownItem
                  key={'Noto'}
                  value={1}
                  style={chooserItemStyle}
                  onClick={this.handleStyleChange}
                >
                  {this.getStyleIconPreview(1)}
                  <div style={chooserItemTextStyle}>
                    Noto
                  </div>
                </DropdownItem>
              </DropdownMenu>
            </Dropdown>

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
