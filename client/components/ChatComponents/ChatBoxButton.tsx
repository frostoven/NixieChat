import React from 'react';
import { Settings } from '../../storage/cacheFrontends/Settings';
import { Icon, SemanticICONS } from 'semantic-ui-react';

const baseStyle: React.CSSProperties = {
  cursor: 'pointer',
  margin: 11,
  fontWeight: 'revert',
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

interface Props {
  icon: SemanticICONS,
}

class ChatBoxButton extends React.Component<Props> {
  render() {
    const darkMode = Settings.isDarkModeEnabled();
    const style = darkMode ? darkModeStyle : lightModeStyle;
    return (
      <div style={style}>
        <Icon size="large" name={this.props.icon}/>
      </div>
    );
  }
}

export {
  ChatBoxButton,
};
