import _ from 'lodash';
import React from 'react';
import PropTypes from 'prop-types';
import {
  Button,
  Form,
  Message,
  Segment,
} from 'semantic-ui-react';
import {
  UnencryptedSettings,
} from '../../storage/cacheFrontends/UnencryptedSettings';
import { RemoteCrypto } from '../../api/RemoteCrypto';
import {
  EncryptedAccountStorage,
} from '../../storage/EncryptedAccountStorage';
import { sharedConfig } from '../../../shared/config';
import { clientEmitter } from '../../emitters/comms';
import { ClientMessageType } from '../../emitters/ClientMessageType';
import { RsvpResponseList } from './RsvpResponseList';
import { NxField } from '../Generic/NxField';
import { setPromiseTimeout } from '../../utils';
import { KeyStrength } from '../../../shared/KeyStrength';
import { clientEmitterAction } from '../../emitters/clientEmitterAction';
import { randomAccountName, randomErrorColor } from '../../../shared/textGen';

const accountStorage = new EncryptedAccountStorage();

class ContactFinder extends React.Component {
  static propTypes = {
    onContactAdded: PropTypes.func.isRequired,
  };

  state = {
    localGreetingName: '',
    localGreeting: '',
    contactPublicName: '',
    buttonDisabled: false,
    buttonText: 'Search',
    errorMessage: '',
    showSearchWindow: false,
  };

  constructor(props) {
    super(props);
    const acc = accountStorage.getActiveAccount().decryptedData;
    this.state.localGreetingName =
      acc.personalName || acc.publicName || randomAccountName();
    this.invitationItems = {};
  }

  componentDidMount() {
    clientEmitter.on(
      ClientMessageType.receiveRsvpResponse, this.receiveRsvpResponse,
    );

    clientEmitter.on(
      clientEmitterAction.updateContactCreatorViews, this.updateContactCreatorViews,
    );
  }

  componentWillUnmount() {
    clientEmitter.removeListener(
      ClientMessageType.receiveRsvpResponse, this.receiveRsvpResponse,
    );

    clientEmitter.removeListener(
      clientEmitterAction.updateContactCreatorViews, this.updateContactCreatorViews,
    );
  }

  /**
   * @param {InvitationInfo} rsvp
   */
  receiveRsvpResponse = (rsvp) => {
    this.invitationItems[rsvp.id] = {
      id: rsvp.id,
      dhKeySent: false,
    };
    // To avoid concurrency issues, we use a simple array with force update
    // instead of setState.
    this.forceUpdate(async () => {
      // Give the UI room to breath. We should eventually make things like
      // this use web workers instead.
      await setPromiseTimeout(500);
      await this.sendDhKey(rsvp);
    });
  };

  /**
   * See comment for this.sendDhKeys.
   * @param {InvitationInfo} info
   */
  updateContactCreatorViews = (info) => {
    if (!this.invitationItems[info.id]) {
      this.invitationItems[info.id] = {};
    }
    this.invitationItems[info.id].id = info.id;
    _.defer(() => this.forceUpdate());
  };

  // If ever there was a sane reason to use Flux or Redux, this is it; here
  // we're waiting for network effects and then updating props with a
  // forceUpdate in componentDidMount when things arrive. Not great, but that's
  // how things are currently set up.
  // TODO: Set up a dispatch system system, and integrate me into it.
  /**
   * @param {InvitationInfo} rsvp
   */
  async sendDhKey(rsvp) {
    if (this.invitationItems[rsvp.id].dhKeySent) {
      return;
    }
    this.invitationItems[rsvp.id].dhKeySent = true;

    await RemoteCrypto.createAndSendDhPubKey({
      modGroup: KeyStrength.messagingModGroup,
      targetId: rsvp.contactSocketId,
    });
  }

  sendInvitation = () => {
    if (!this.state.contactPublicName) {
      return this.setState({
        errorMessage: 'Please specify the contact\'s public name.',
      });
    }

    this.setState({
      buttonDisabled: true,
      buttonText: 'Searching...',
      errorMessage: '',
      showSearchWindow: true,
    }, async () => {
      const greetingName = this.state.localGreetingName || '(No name specified)';
      const { contactPublicName, localGreeting } = this.state;
      const activeAccount = accountStorage.getActiveAccount();
      const { accountId, accountName } = activeAccount.decryptedData;

      await RemoteCrypto.sendInvitation(
        accountId, accountName, contactPublicName, localGreeting, greetingName,
        (error, data) => {
          const state = {
            buttonDisabled: false,
            buttonText: 'Search',
          };

          if (error) {
            state.errorMessage = error;
          }

          this.setState(state);
        });
    });
  };

  greetingLimitNotice = () => {
    const limit = sharedConfig.greetingLimit;
    const greetingLength = this.state.localGreeting.length;
    const threshold = greetingLength / limit;
    if (threshold < 0.5) {
      return null;
    }

    const style = { padding: '8px 0px 8px 14px' };

    if (threshold <= 1) {
      return (
        <Message color="green" style={style}>
          Character limit: {greetingLength} of {limit}
        </Message>
      );
    }
    else {
      return (
        <Message color="red" style={style}>
          Character limit: {greetingLength} of {limit} - exceeded
        </Message>
      );
    }

  };

  render() {
    if (this.state.showSearchWindow) {
      return (
        <RsvpResponseList
          key={`RsvpResponseList-Finder`}
          invitationIds={Object.keys(this.invitationItems)}
          onContactAdded={this.props.onContactAdded}
        />
      );
    }

    const darkMode = UnencryptedSettings.isDarkModeEnabled();
    const {
      localGreetingName,
      contactPublicName,
      localGreeting,
      buttonDisabled,
      buttonText,
      errorMessage,
    } = this.state;

    return (
      <Segment style={{ textAlign: 'left' }} inverted={!darkMode}>
        <b>You can only add someone as a contact while they're online</b>.
        People who are offline do not appear in searches.
        <br/><br/>
        Be aware that <i>two different people can share the same name</i>, so
        please do not simply assume your to-be contact is online just because
        you see their name.
        <br/><br/>
        It's better to think of a public name as a radio frequency than a name.
        That is, everyone with this public name will hear you asking if they
        want to become your contact.
        <br/><br/>
        <Form>
          <NxField
            label="Name You Want Shown"
            help={(
              <div>
                The name by which you wish to identify yourself. Your
                prospective contact will see this name in the invitation.
                <br/><br/>
                This is the name that will be displayed in their contacts list
                if they choose to accept your invitation. You're allowed to
                pick a name that differs from your account details.
              </div>
            )}
            placeholder="Shown in Invite"
            value={localGreetingName}
            onChange={(event) => {
              this.setState({ localGreetingName: event.target.value });
            }}
          />

          <NxField
            label="Contact Public Name"
            autoFocus
            placeholder={'Contact\'s Public Name'}
            help={(
              <div>
                You need to obtain this name from your prospective contact.
                <br/>
                You can only find contacts if they have a public name. Their
                public names are usable only while they are online.
              </div>
            )}
            value={contactPublicName}
            onChange={(event) => {
              this.setState({ contactPublicName: event.target.value });
            }}
          />

          <NxField
            label="Greeing"
            help={(
              <div>
                Optional message you want them to see when they receive the
                invite.
                <br/>
                <b>Note:</b> Greetings are not encrypted.
              </div>
            )}
            placeholder="Optional Greeting"
            value={localGreeting}
            onChange={(event) => {
              this.setState({ localGreeting: event.target.value });
            }}
          />

          {this.greetingLimitNotice()}

          {errorMessage &&
            <Message color={randomErrorColor()}>{errorMessage}</Message>}

          <Button
            primary
            type="button"
            disabled={buttonDisabled}
            onClick={this.sendInvitation}
          >
            {buttonText}
          </Button>
        </Form>
      </Segment>
    );
  }
}

export {
  ContactFinder,
};
