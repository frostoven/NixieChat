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

const MiniButton = ({ children, onClick }) => {
  return (
    <div
      style={{
        height: 29,
        padding: 3,
        cursor: 'pointer',
        display: 'inline-block',
        width: '40%',
        color: '#fff',
        backgroundColor: '#41878b',
        fontWeight: 'bold',
        borderRadius: 4,
      }}
      onClick={onClick}
    >
      {children}
    </div>
  );
};

class RsaPreview extends React.Component {
  static propTypes = {
    contactName: PropTypes.string.isRequired,
    contactPubKey: PropTypes.instanceOf(Uint8Array).isRequired,
    contactPemKey: PropTypes.string.isRequired,
    localPubKey: PropTypes.instanceOf(Uint8Array).isRequired,
    localPemKey: PropTypes.string.isRequired,
  };

  toggleAdvancedInfo = () => {
    this.setState({ showAdvancedInfo: !this.state.showAdvancedInfo });
  };

  constructor(props) {
    super(props);
    this.state = {
      showAdvancedInfo: false,
      artView: Settings.preferRsaArtView(),
      showOwnKey: false,
    };
  }

  genRsaPreview = ({ visible }) => {
    if (!visible) {
      return;
    }

    const charWidth = 68;
    const charHeight = 36;

    const { artView, showOwnKey } = this.state;

    const {
      contactPubKey, contactPemKey, localPubKey, localPemKey,
    } = this.props;

    const randomartStyle = {
      ...randomartContainerStyle,
    };

    const pemStyle = {
      ...pemContainerStyle,
    };

    let pubKey, pemKey;
    if (showOwnKey) {
      pubKey = localPubKey;
      pemKey = localPemKey;
      randomartStyle.border = pemStyle.border = '4px solid #c77c33';
    }
    else {
      pubKey = contactPubKey;
      pemKey = contactPemKey;
      randomartStyle.border = pemStyle.border = '4px solid #3cb137';
    }

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

    if (artView) {
      return (
        <pre style={randomartStyle}>
          <code style={asciiStyle}>
            {randomartString}
          </code>
        </pre>
      );
    }
    else {
      return (
        <pre style={pemStyle}>
          <code style={asciiStyle}>
            {pemKey}
          </code>
        </pre>
      );
    }
  };

  genDescription = () => {
    if (this.state.showOwnKey) {
      return 'Your own RSA-4096 digital signature is as follows:';
    }
    else {
      return `${this.props.contactName}'s RSA-4096 digital signature is as ` +
        'follows:';
    }
  };

  switchArtView = () => {
    this.setState({
      artView: !this.state.artView,
    }, () => {
      Settings.setPreferRsaArtView(this.state.artView).catch(console.error);
    });
  };

  switchOwner = () => {
    this.setState({
      showOwnKey: !this.state.showOwnKey,
    });
  };

  render() {
    const darkMode = Settings.isDarkModeEnabled();
    const { showAdvancedInfo, showOwnKey } = this.state;
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
            {this.genDescription()}
            <br/>

            {this.genRsaPreview({ visible: showAdvancedInfo })}
            <br/>

            <MiniButton onClick={this.switchArtView}>
              Change Style
            </MiniButton>

            &nbsp;&nbsp;

            <MiniButton onClick={this.switchOwner}>
              {showOwnKey ? 'View Contact\'s Key' : 'View Own Key'}
            </MiniButton>

          </Accordion.Content>
        </Accordion>
      </Segment>
    );
  }
}

export {
  RsaPreview,
};
