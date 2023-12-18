import _ from 'lodash';
import React from 'react';
import PropTypes from 'prop-types';
import { InvitationResponse } from '../../../shared/InvitiationResponse';
import {
  Button,
  Form,
  List,
  Loader,
  Progress,
} from 'semantic-ui-react';
import { Settings } from '../../storage/cacheFrontends/Settings';
import { getDiffieHellman } from 'diffie-hellman';
import { KeyStrength, KeyStrengthFriendly } from '../../../shared/KeyStrength';
import { setPromiseTimeout } from '../../utils';

/** @type React.CSSProperties */
const columnStyle = {
  display: 'inline-block',
  height: '100%',
  verticalAlign: 'top',
  overflow: 'auto',
};

/** @type React.CSSProperties */
const leftColStyle = {
  ...columnStyle,
  paddingRight: 16,
  flex: '0 0 15em',
};

/** @type React.CSSProperties */
const responseLoaderAnimation = {
  overflow: 'hidden',
};


/** @type React.CSSProperties */
const loaderIconStyle = {
  paddingLeft: 24,
  paddingBottom: 18,
};

/** @type React.CSSProperties */
const headerStyle = {
  textDecoration: 'underline',
};

/** @type React.CSSProperties */
const nameStyle = {
  cursor: 'pointer',
};

/** @type React.CSSProperties */
const selectedNameStyle = {
  ...nameStyle,
  fontWeight: 'bold',
};

/** @type React.CSSProperties */
const connectButton = {
  // float: 'right',
};

class RsvpResponseList extends React.Component {
  static propTypes = {
    responses: PropTypes.array,
  };

  static defaultProps = {
    responses: [],
  };

  state = {
    // Currently selected contact, ordered to bottom by time received.
    selected: 0,
    // Set to true once Diffie-Hellman secret and keys have been generated.
    dhGenerated: false,
  };

  connectText = new Map();

  selectName = (index) => {
    this.setState({
      selected: index,
    });
  };

  startVerification = async (contactIndex, bobPublicKey) => {
    // Crypto appears to hijack the thread before the UI can do status updates;
    // this gives is a bit of breathing room. The status update has a small
    // chance of failing anyway, which is fine seeing as status updates are not
    // security critical in this case.
    let start = Date.now();
    const refreshStatus = (stage, percent) => {
      console.log(Date.now() - start, 'ms passed since last update.');
      return new Promise(resolve => {
        this.connectText.set(contactIndex, (
          <Progress percent={percent}>{stage}</Progress>
        ));
        console.log(stage);
        this.forceUpdate(() => _.defer(resolve));
        start = Date.now();
      });
    };

    const modGroup = KeyStrength.messagingModGroup;
    const groupFriendly = KeyStrengthFriendly[modGroup];

    await refreshStatus(`(1/3) Loading ${modGroup} group...`, 1);
    // Give some breathing room so that it doesn't look too glitched.
    await setPromiseTimeout(500);
    const alice = getDiffieHellman(modGroup);

    await refreshStatus(`(2/3) Generating ${groupFriendly} DH keys...`, 20);
    alice.generateKeys();
    console.log(`DH key generation complete...`);

    await refreshStatus(`(3/3) Generating DH secret...`, 60);
    const aliceSecret = alice.computeSecret(bobPublicKey);
    console.log(`DH secret generation complete:`, { aliceSecret });

    await refreshStatus(`Done`, 100);
    this.setState({ dhGenerated: true });
  };

  render() {
    const darkMode = Settings.isDarkModeEnabled();
    const { responses } = this.props;
    const { selected } = this.state;
    const leftSide = [
      <h3 key="ResponseHead">
        Responses
      </h3>,
    ];
    const rightSide = [];

    for (let i = 0, len = responses.length; i < len; i++) {
      const responseOptions = responses[i];
      const isSelected = selected === i;

      const {
        answer,
        sourceId,
        publicName,
        personalName,
        publicKey,
      } = responseOptions;

      let name;
      if (personalName) {
        name = `${personalName} (${publicName})`;
      }
      else {
        name = publicName;
      }

      leftSide.push(
        <List key={`RsvpResponse${i}`} onClick={() => this.selectName(i)}>
          <List.Item>
            <List.Icon name="user circle"/>
            <List.Content>
              <List.Content style={isSelected ? selectedNameStyle : nameStyle}>
                {name}
              </List.Content>
            </List.Content>
          </List.Item>
        </List>,
      );

      //
      if (!isSelected) {
        // Only write to the right side if the selected name is active.
        continue;
      }

      // What each button shows which contact it belongs to. Each button can
      // have a different state and its text modified by startVerification().
      if (!this.connectText.get(i)) {
        this.connectText.set(i, 'Connect');
      }
      const { accept, postpone, reject, verification } = InvitationResponse;

      // Used to generate the Diffie-Hellman secret.
      const InitHandshake = () => (
        <Button
          fluid
          disabled={this.connectText.get(i) !== 'Connect'}
          style={connectButton}
          onClick={() => this.startVerification(i, publicKey)}
        >
          {this.connectText.get(i)}
        </Button>
      );

      // We only check for *some* response types because the client does not
      // always send a response. For example, we don't respond when blocking a
      // contact, because that would immediately tell the sender that the
      // person blocking them is online, which is a privacy issue.
      if (answer === accept) {
        // An 8-char password with an (at-most) 14 color visual is something
        // of a joke compared to the actual massive text glob that DH
        // produces, but hey, any more complex than that and the layman just
        // won't bother. For the prudent, there's the SHA hash in the
        // advanced view.
        rightSide.push(
          <div key={`RsvpResponseAccepted${i}`}>
            <h3>Invitation to {publicName}</h3>
            <div>
              Contact {name} has <b>accepted</b> your invitation.
              <br/><br/>
              Click 'Connect' to start the connection process. Please beware
              that this takes some time.
              {/*Please verify that the number and color below precisely match*/}
              {/*what your contact sees on their screen. Once confirmed, click*/}
              {/*'Confirm Verification.' Otherwise, this is not the correct person.*/}
              {/*<br/><br/>*/}
              {/*[710 59-2 B]*/}
              <br/><br/>
              <InitHandshake/>
            </div>
          </div>,
        );
      }
      else if (answer === postpone) {
        rightSide.push(
          <div key={`RsvpResponsePostponed${i}`}>
            <h3>Invitation to {publicName}</h3>
            <div>
              Contact has asked that you resend the invitation at another
              time.
              <br/><br/>
              Note that they have <b>not</b> declined your invitation.
            </div>
          </div>,
        );
      }
      else if (answer === reject) {
        // Note: the client has the option to not send this, in which case
        // we'll simply time out.
        rightSide.push(
          <div key={`RsvpResponseRejected${i}`}>
            <h3>Invitation to {publicName}</h3>
            <div>
              Contact has declined your invitation.
            </div>
          </div>,
        );
      }
      else if (answer === verification) {
        rightSide.push(
          <div key={`RsvpResponseLocal${i}`}>
            <h3>Adding [nnn] as a contact.</h3>
            <div>
              To establish communication, an end-to-end exchange must be
              completed.
              <br/><br/>
              Click 'Connect' to start the connection process. Please beware
              that this takes some time.
              <br/><br/>
              <InitHandshake/>
            </div>
          </div>,
        );
      }
      else {
        return (
          <div>
            Unknown invitation response type: {answer}
          </div>
        );
      }
    }

    let loaderMessage;
    if (!responses.length) {
      loaderMessage = 'Waiting for replies...';
    }
    else {
      loaderMessage = 'Awaiting further replies...';
    }
    leftSide.push(
      <div key="ResponseLoaderAnimation" style={responseLoaderAnimation}>
        <Loader
          size="mini" active inline inverted={!darkMode}
          style={loaderIconStyle}
        /> {loaderMessage}
        <hr/>
      </div>,
    );

    return (
      <Form inverted={!darkMode}>
        <Form.Group widths="equal">
          <Form.Field style={leftColStyle}>
            {leftSide}
          </Form.Field>
          <Form.Field>
            {rightSide}
          </Form.Field>
        </Form.Group>
      </Form>
    );
  }
}

export {
  RsvpResponseList,
};
