import React from 'react';
import { Settings } from '../../storage/cacheFrontends/Settings';
import { Icon, SemanticICONS } from 'semantic-ui-react';

const baseStyle: React.CSSProperties = {
  cursor: 'pointer',
  margin: 11,
  marginBottom: 7,
  fontWeight: 'revert',
  width: 22,
};

const darkModeStyle: React.CSSProperties = {
  ...baseStyle,
  color: '#c2c2c2',
  backgroundColor: '#424242',
};

const lightModeStyle: React.CSSProperties = {
  ...baseStyle,
  color: '#a2a2a2',
  backgroundColor: '#fdfdfd',
};

const imgStyle: React.CSSProperties = {
  width: 22,
};

interface Props {
  fileName: string,
  style?: React.CSSProperties,
}

class ChatBoxButton extends React.Component<Props> {
  render() {
    const darkMode = Settings.isDarkModeEnabled();
    let style = darkMode ? darkModeStyle : lightModeStyle;

    if (this.props.style) {
      style = { ...style, ...this.props.style };
    }

    return (
      <div style={style}>
        <img alt="" src={`${this.props.fileName}`} style={imgStyle}/>
      </div>
    );
  }
}

export {
  ChatBoxButton,
};
