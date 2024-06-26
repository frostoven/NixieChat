import React from 'react';
import PropTypes from 'prop-types';
import { InvitationResponse } from '../../../shared/InvitationResponse';
import { Button, Form, List, Loader } from 'semantic-ui-react';
import {
  UnencryptedSettings,
} from '../../storage/cacheFrontends/UnencryptedSettings';
import { RsaPreview } from '../Generic/RsaPreview';
import { SharedPin } from '../Generic/SharedPin';
import { clientEmitter } from '../../emitters/comms';
import { clientEmitterAction } from '../../emitters/clientEmitterAction';
import { Invitation } from '../../api/Invitation';
import { RemoteCrypto } from '../../api/RemoteCrypto';
import {
  EncryptedAccountStorage,
} from '../../storage/EncryptedAccountStorage';

const accountStorage = new EncryptedAccountStorage();

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
const nameStyle = {
  cursor: 'pointer',
};

/** @type React.CSSProperties */
const selectedNameStyle = {
  ...nameStyle,
  fontWeight: 'bold',
};

/** @type React.CSSProperties */
const greetingStyle = {
  padding: 8,
  marginLeft: 8,
  marginTop: 4,
  border: 'thin dashed grey',
  borderLeft: '4px solid grey',
};

class RsvpResponseList extends React.Component {
  static propTypes = {
    invitationIds: PropTypes.array,
    // The message to show on the left of the responses screen.
    overrideLoaderMessage: PropTypes.string,
    onContactAdded: PropTypes.func.isRequired,
  };

  static defaultProps = {
    invitationIds: [],
    overrideLoaderMessage: 'Waiting for replies...',
  };

  state = {
    // Currently selected contact, ordered to bottom by time received.
    selected: 0,
    // Set to true once Diffie-Hellman secret and keys have been generated.
  };

  /**
   * Used to check if anyone's responding at all.
   */
  softTimeoutTimer = null;
  softTimeoutAmount = 120000;

  // What text is shown in statuses and buttons depends on which contact it
  // belongs to (we have a dynamic list of them). Each button and status can
  // have a different state and its text modified by updateDhStatus().
  // connectButtonText = new Map();

  componentDidMount() {
    this.softTimeoutTimer = setTimeout(this.softTimeout, this.softTimeoutAmount);
    clientEmitter.on(clientEmitterAction.updateDhStatus, this.updateDhStatus);
  }

  componentWillUnmount() {
    clearTimeout(this.softTimeoutTimer);
    clientEmitter.removeListener(
      clientEmitterAction.updateDhStatus, this.updateDhStatus,
    );
  }

  softTimeout = () => {
    if (this.props.invitationIds?.length) {
      // Message we're about to show is no longer relevant; quit out.
      return;
    }

    const elapsed = (this.softTimeoutAmount * 0.001).toFixed(0);
    $dialog.alert({
      prioritise: true,
      header: 'No Response',
      body: (
        <div>
          You've had no responses after {elapsed} seconds. It's likely that
          the recipient did not get your invite.
          <br/><br/>
          It's recommended you cancel and try again.
        </div>
      ),
    });
  };

  selectName = (index) => {
    this.setState({
      selected: index,
    });
  };

  /**
   * @param {InvitationInfo} info
   * @return {Promise<void>}
   */
  startVerification = async (info) => {
    await RemoteCrypto.startVerification({ creatorId: info.id });
  };

  updateDhStatus = () => {
    this.forceUpdate();
  };

  /** @param {InvitationInfo} info */
  saveContact = async (info) => {
    const added = await accountStorage.addContact(info);
    if (!added) {
      let error = 'An error occurred while saving the contact';
      if (info.error) {
        error += `: ${info.error}`;
      }
      window.$dialog.alert(error);
    }
    else {
      // TODO: toast a message such as "Contact added!"
      this.props.onContactAdded();
    }
  };

  /** @param {InvitationInfo} info */
  genSharedPin = (info) => {
    const { isOutbound, localPubKey, contactPubKey } = info;
    const initiatorPubKey = isOutbound ? localPubKey : contactPubKey;
    const receiverPubKey = isOutbound ? contactPubKey : localPubKey;

    return (
      <SharedPin
        sharedSecret={info.sharedSecret}
        initiatorName={info.initiatorName}
        initiatorId={info.initiatorSocketId}
        initiatorPubKey={initiatorPubKey}
        receiverName={info.receiverName}
        receiverId={info.receiverSocketId}
        receiverPubKey={receiverPubKey}
        time={info.time}
        onError={(error) => {
          info.reportFatalError(error);
          this.forceUpdate();
        }}
      />
    );
  };

  render() {
    /** @type InvitationInfo[] */
    const invitationIds = this.props.invitationIds;
    const darkMode = UnencryptedSettings.isDarkModeEnabled();

    const { selected } = this.state;
    const leftSide = [
      <h3 key="ResponseHead">
        Responses
      </h3>,
    ];
    const rightSide = [];

    for (let i = 0, len = invitationIds.length; i < len; i++) {
      let invitationInfo = Invitation.getInfoById(invitationIds[i]);
      const isSelected = selected === i;

      const {
        error,
        rsvpAnswer,
        localPubKey,
        localPemKey,
        contactPublicName,
        contactGreetingName,
        contactGreetingMessage,
        contactPubKey,
        contactPemKey,
        dhPrepPercentage,
        dhPrepStatusMessage,
        contactDhPubKey,
        sharedSecret,
      } = invitationInfo;

      let name;
      if (contactGreetingName && contactGreetingName !== contactPublicName) {
        name = `${contactGreetingName} (${contactPublicName})`;
      }
      else {
        name = contactPublicName;
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

      const { accept, postpone, reject, verification } = InvitationResponse;

      // 0.5 means the exchange has paused and is now waiting for user
      // to authorize computing the DH secret (which takes some time).
      const readyToConnect = dhPrepPercentage === 0.5 && contactDhPubKey;

      // Used to generate the Diffie-Hellman secret.
      const InitHandshake = () => (
        <Button
          fluid
          disabled={!readyToConnect}
          onClick={() => this.startVerification(invitationInfo)}
        >
          {readyToConnect ? 'Connect' : dhPrepStatusMessage}
        </Button>
      );

      // We only check for *some* response types because the client does not
      // always send a response. For example, we don't respond when blocking a
      // contact, because that would immediately tell the sender that the
      // person blocking them is online, which is a privacy issue.
      if (error) {
        rightSide.push(error);
      }
      else if (rsvpAnswer === accept) {
        // An 8-char password with an (at-most) 14 color visual is something
        // of a joke compared to the actual massive text glob that DH
        // produces, but hey, any more complex than that and the layman just
        // won't bother. For the prudent, there's the SHA hash in the
        // advanced view.
        rightSide.push(
          <div key={`RsvpResponseAccepted${i}`}>
            <h3>Invitation to {contactPublicName}</h3>
            <div>
              Contact {name} has <b>accepted</b> your invitation.

              {
                contactGreetingMessage && (
                  <div>
                    <br/>
                    They've included this greeting in their response:
                    <p style={greetingStyle}>
                      {contactGreetingMessage}
                    </p>
                  </div>
                )
              }

              <RsaPreview
                contactPubKey={contactPubKey} contactPemKey={contactPemKey}
                localPubKey={localPubKey} localPemKey={localPemKey}
                contactName={contactGreetingName}
              />

              {!sharedSecret && <>
                Click 'Connect' to start the connection process. Please beware
                that this takes some time.
                <br/><br/>
              </>}

              <InitHandshake/>

              {sharedSecret && <>
                <br/>
                Please verify that the number and color below precisely match
                what your contact sees on their screen. Once confirmed, click
                'Add Contact.' Otherwise, this is not the correct person.

                <br/><br/>
                {this.genSharedPin(invitationInfo)}
                <br/><br/>

                <Button fluid onClick={() => this.saveContact(invitationInfo)}>
                  Add Contact
                </Button>
              </>}
            </div>
          </div>,
        );
      }
      else if (rsvpAnswer === postpone) {
        rightSide.push(
          <div key={`RsvpResponsePostponed${i}`}>
            <h3>Invitation to {contactPublicName}</h3>
            <div>
              Contact has asked that you resend the invitation at another
              time.
              <br/><br/>
              Note that they have <b>not</b> declined your invitation.
            </div>
          </div>,
        );
      }
      else if (rsvpAnswer === reject) {
        // Note: the client has the option to not send this, in which case
        // we'll simply time out.
        rightSide.push(
          <div key={`RsvpResponseRejected${i}`}>
            <h3>Invitation to {contactPublicName}</h3>
            <div>
              Contact has declined your invitation.
            </div>
          </div>,
        );
      }
      else if (rsvpAnswer === verification) {
        rightSide.push(
          <div key={`RsvpResponseLocal${i}`}>
            <h3>Adding {name} as a contact.</h3>
            <div>
              {!sharedSecret && <>
                To establish communication, an end-to-end exchange must be
                completed.
                <br/><br/>
                Click 'Connect' to start the connection process. Please beware
                that this takes some time.
              </>}

              <RsaPreview
                contactPubKey={contactPubKey} contactPemKey={contactPemKey}
                localPubKey={localPubKey} localPemKey={localPemKey}
                contactName={contactGreetingName}
              />

              <InitHandshake/>

              {sharedSecret && <>
                <br/>
                Please verify that the number and color below precisely match
                what your contact sees on their screen. Once confirmed, click
                'Add Contact.' Otherwise, this is not the correct person.

                <br/><br/>
                {this.genSharedPin(invitationInfo)}
                <br/><br/>

                <Button fluid onClick={() => this.saveContact(invitationInfo)}>
                  Add Contact
                </Button>
              </>}
            </div>
          </div>,
        );
      }
      else {
        rightSide.push(
          <div key={`RsvpInvalidResponse${i}`}>
            <h3>Could not add contact</h3>
            Unknown invitation response type: {`${rsvpAnswer}`}
          </div>,
        );
      }
    }

    let loaderMessage;
    if (this.props.overrideLoaderMessage) {
      loaderMessage = this.props.overrideLoaderMessage;
    }
    else if (!invitationIds.length) {
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
