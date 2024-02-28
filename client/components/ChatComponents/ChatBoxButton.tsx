import React from 'react';
import { Settings } from '../../storage/cacheFrontends/Settings';

const baseStyle: React.CSSProperties = {
  display: 'inline-block',
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
  width?: number,
  onClick?: () => void,
}

class ChatBoxButton extends React.Component<Props> {
  render() {
    const darkMode = Settings.isDarkModeEnabled();
    const { style, width, onClick } = this.props;
    let containerStyle = darkMode ? darkModeStyle : lightModeStyle;

    if (style) {
      containerStyle = { ...containerStyle, ...style };
    }

    let buttonStyle;
    if (width) {
      buttonStyle = { ...imgStyle, width };
    }
    else {
      buttonStyle = imgStyle;
    }

    return (
      <div style={containerStyle} onClick={onClick ? onClick : undefined}>
        <img alt="" src={`${this.props.fileName}`} style={buttonStyle}/>
      </div>
    );
  }
}

export {
  ChatBoxButton,
};
