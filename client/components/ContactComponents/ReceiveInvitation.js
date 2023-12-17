import React from 'react';
import PropTypes from 'prop-types';
import randomart from 'randomart';
import { Accordion, Button, Icon, Segment } from 'semantic-ui-react';
import { Settings } from '../../storage/cacheFrontends/Settings';
import { InvitationResponse } from '../../../shared/InvitiationResponse';

class ReceiveInvitation extends React.Component {
  static propTypes = {
    dialog: PropTypes.object.isRequired,
    source: PropTypes.string.isRequired,
    ownName: PropTypes.string.isRequired,
    greeting: PropTypes.string.isRequired,
    pubKey: PropTypes.any.isRequired,
    time: PropTypes.number.isRequired,
    onSelectChoice: PropTypes.func,
  };

  static defaultProps = {
    onSelectChoice: () => {
    },
  };

  state = {
    showAdvancedInfo: false,
  };

  // All these buttons are disabled at first to give the user time to respond
  // to
  actions = [
    {
      name: 'Reject Invite',
      onSelect: () => {
        $modal.deactivateModal();
        this.props.onSelectChoice(InvitationResponse.reject);
      },
      disabled: true,
    },
    {
      name: 'Block Account',
      onSelect: () => {
        $modal.deactivateModal();
        this.props.onSelectChoice(InvitationResponse.block);
      },
      disabled: true,
    },
    {
      name: 'Ask Me Later',
      onSelect: () => {
        $modal.deactivateModal();
        this.props.onSelectChoice(InvitationResponse.postpone);
      },
      disabled: true,
    },
    {
      name: 'Accept Invite',
      onSelect: () => {
        $modal.deactivateModal();
        this.props.onSelectChoice(InvitationResponse.accept);
      },
      disabled: true,
      style: { marginLeft: 16 },
    },
  ];

  componentDidMount() {
    const dialog = this.props.dialog;
    dialog.actions = [
      ...this.actions,
      <Button key="invite" disabled
              style={{ position: 'absolute', left: 4 }}>
        <i>Options available in 3 seconds</i>
      </Button>,
    ];

    // Force modal to recognize button changes.
    $modal.invalidate();

    // Wait 3 seconds, then make the buttons clickable. We wait to ensure the
    // user doesn't accidentally click any buttons while using the app.
    setTimeout(() => {
      this.actions.forEach((action) => {
        action.disabled = false;
      });
      this.props.dialog.actions = this.actions;
      $modal.invalidate();
    }, 3000);
  }

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
    const pixelSquared = 8;

    return (
      <>
        <pre style={{
          display: 'inline-block',
          border: 'thin solid grey',
          opacity: 0.6,
          borderRadius: 4,
          width: 'fit-content',
          lineHeight: 0.53,
          letterSpacing: 0.5,
          padding: 4,
          marginRight: 2,
        }}>
          <code style={{
            fontSize: pixelSquared,
          }}>
            {randomart(pubKey, {
              bounds: {
                width: charWidth,
                height: charHeight,
              },
              symbols: {
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
              },
            })}
          </code>
        </pre>

        <pre style={{
          display: 'inline-block',
          border: 'thin solid grey',
          opacity: 0.6,
          borderRadius: 4,
          width: 'fit-content',
          padding: 5,
          verticalAlign: 'top',
        }}>
          <code style={{
            fontSize: pixelSquared,
          }}>
            {pemKey}
          </code>
        </pre>
      </>
    );
  };

  render() {
    const { showAdvancedInfo } = this.state;
    const { source, ownName } = this.props;
    const darkMode = Settings.isDarkModeEnabled();

    return (
      <div>
        You have received a contact invite from someone claiming to be
        "{source}". This request was sent to "{ownName}".
        <br/><br/>
        If you are not expecting an invitation, it is highly advisable you
        decline this request. Only accept contacts you trust; they can resend
        the invitation at any time (unless you block them).
        <br/><br/>
        This invite expires in 120 seconds.

        <Segment inverted={!darkMode}>
          <Accordion inverted={!darkMode}>
            <Accordion.Title
              active={showAdvancedInfo}
              onClick={this.toggleAdvancedInfo}
            >
              <Icon name="dropdown"/>
              Advanced Info
            </Accordion.Title>
            <Accordion.Content active={showAdvancedInfo}>
              The prospective contact's RSA-4096 digital signature is as
              follows:
              <br/>
              {this.genRsaPreview({ visible: showAdvancedInfo })}
            </Accordion.Content>
          </Accordion>
        </Segment>
      </div>
    );
  }
}

export {
  ReceiveInvitation,
};
