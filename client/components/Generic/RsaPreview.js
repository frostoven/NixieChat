import React from 'react';
import PropTypes from 'prop-types';
import { Settings } from '../../storage/cacheFrontends/Settings';
import { Accordion, Icon, Segment } from 'semantic-ui-react';
import randomart from 'randomart';

const asciiArtSymbols = {
  '-2': '╡', // end
  '-1': '╟', // start
  '0': ' ',
  '1': '░',
  '2': '▒',
  '3': '▓',
  '4': '╪',
  '5': '╤',
  '6': '■',
  '7': '╔',
  '8': '═',
  '9': 'X',
  '10': '█',
  '11': '▄',
  '12': '▌',
  '13': '┼',
  '14': '@',
};

/** @type React.CSSProperties */
const contentStyle = {
  textAlign: 'center',
  overflow: 'auto',
};

/** @type React.CSSProperties */
const asciiStyle = {
  fontSize: 8,
};

/** @type React.CSSProperties */
const randomartContainerStyle = {
  display: 'inline-block',
  border: 'thin solid grey',
  opacity: 0.6,
  borderRadius: 4,
  width: 'fit-content',
  lineHeight: 0.53,
  letterSpacing: 0.5,
  padding: 4,
  marginRight: 2,
};

/** @type React.CSSProperties */
const pemContainerStyle = {
  display: 'inline-block',
  border: 'thin solid grey',
  opacity: 0.6,
  borderRadius: 4,
  width: 'fit-content',
  padding: 5,
  verticalAlign: 'top',
  minWidth: 372,
  textAlign: 'center',
};

class RsaPreview extends React.Component {
  static propTypes = {
    pubKey: PropTypes.object.isRequired,
    pemKey: PropTypes.string.isRequired,
  };

  state = {
    showAdvancedInfo: false,
  };

  toggleAdvancedInfo = () => {
    this.setState({ showAdvancedInfo: !this.state.showAdvancedInfo });
  };

  genRsaPreview = ({ visible }) => {
    if (!visible) {
      return;
    }

    const { pubKey, pemKey } = this.props;
    const charWidth = 68;
    const charHeight = 36;

    const randomartString = randomart(
      pubKey,
      {
        bounds: {
          width: charWidth,
          height: charHeight,
        },
        symbols: asciiArtSymbols,
      },
    );

    return (
      <>
        <pre style={randomartContainerStyle}>
          <code style={asciiStyle}>
            {randomartString}
          </code>
        </pre>

        <pre style={pemContainerStyle}>
          <code style={asciiStyle}>
            {pemKey}
          </code>
        </pre>
      </>
    );
  };

  render() {
    const darkMode = Settings.isDarkModeEnabled();
    const { showAdvancedInfo } = this.state;
    return (
      <Segment inverted={!darkMode}>
        <Accordion inverted={!darkMode}>
          <Accordion.Title
            active={showAdvancedInfo}
            onClick={this.toggleAdvancedInfo}
          >
            <Icon name="dropdown"/>
            View Digital Signature
          </Accordion.Title>
          <Accordion.Content active={showAdvancedInfo} style={contentStyle}>
            The prospective contact's RSA-4096 digital signature is as
            follows:
            <br/>
            {this.genRsaPreview({ visible: showAdvancedInfo })}
          </Accordion.Content>
        </Accordion>
      </Segment>
    );
  }
}

export {
  RsaPreview,
};
