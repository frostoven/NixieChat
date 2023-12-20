import React from 'react';
import {
  Button,
  Form,
  Message,
  Segment,
} from 'semantic-ui-react';
import { Settings } from '../../storage/cacheFrontends/Settings';
import { RemoteCrypto } from '../../api/RemoteCrypto';
import { Accounts } from '../../storage/cacheFrontends/Accounts';
import { sharedConfig } from '../../../shared/config';
import { clientEmitter } from '../../emitters/comms';
import { ClientMessageType } from '../../emitters/ClientMessageType';
import { RsvpResponseList } from './RsvpResponseList';
import { NxField } from '../Generic/NxField';

// Used to pick a server error message at random. The reason we randomise them
// is that they all look pretty, and all look like valid error message
// candidates due to their bright backgrounds.
function randomErrorColor() {
  const options = [
    'orange', 'olive', 'teal', 'blue', 'violet', 'purple', 'pink',
  ];
  return options[~~(options.length * Math.random())];
}

// Used for situations where the user has not given themselves a private name.
// Generates a random name that changes every time the 'Add contact' screen is
// launched.
// Example output: 'Phantom 69'
function randomLocalName() {
  const nameTypes = [ 'Phantom', 'Shade', 'Nameless', 'Kraken', 'Wolfe' ];
  return (
    nameTypes[~~(nameTypes.length * Math.random())] +
    ' ' +
    `${Math.random()}`.slice(-2)
  );
}

class ContactFinder extends React.Component {
  state = {
    localName: '',
    targetName: '',
    greeting: '',
    buttonDisabled: false,
    buttonText: 'Search',
    errorMessage: '',
    showSearchWindow: false,
  };

  constructor(props) {
    super(props);
    const acc = Accounts.getActiveAccount();
    console.log('active account:', acc);
    this.state.localName = acc.publicName || randomLocalName();
    this.rsvpResponses = [];
  }

  componentDidMount() {
    clientEmitter.on(ClientMessageType.receiveRsvpResponse, (rsvp) => {
      // To avoid concurrency issues, we use a simple array with force update
      // instead of setState.
      this.rsvpResponses.push(rsvp);
      this.forceUpdate();
    });
  }

  findContact = () => {
    this.setState({
      buttonDisabled: true,
      buttonText: 'Searching...',
      errorMessage: '',
      showSearchWindow: true,
    }, async () => {
      const source = this.state.localName || '(No name specified)';
      const { targetName: target, greeting } = this.state;
      await RemoteCrypto.findContact(source, target, greeting, (error, data) => {
        console.log('findContact', { error, data });
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
    const greetingLength = this.state.greeting.length;
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
          responses={this.rsvpResponses}
          ownName={this.state.localName}
        />
      );
    }

    const darkMode = Settings.isDarkModeEnabled();
    const {
      localName,
      targetName,
      greeting,
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
            label="Your name"
            help={(
              <div>
                The name you want the contact to see in the invitation.
                <br/><br/>
                This name will be displayed in their contacts list if they
                choose to accept your invitation.
              </div>
            )}
            placeholder="Shown in Invite"
            value={localName}
            onChange={(event) => {
              this.setState({ localName: event.target.value });
            }}
          />

          <NxField
            label="Contact Public Name"
            autoFocus
            placeholder={'Contact\'s Public Name'}
            help={(
              <div>
                You can only find contacts if they have a public name. Their
                public names are visible only while they are online.
              </div>
            )}
            value={targetName}
            onChange={(event) => {
              this.setState({ targetName: event.target.value });
            }}
          />

          <NxField
            label="Greeing"
            help={(
              <div>
                Optional message you want them to see when they receive the
                invite
              </div>
            )}
            placeholder="Optional Greeting"
            value={greeting}
            onChange={(event) => {
              this.setState({ greeting: event.target.value });
            }}
          />

          {this.greetingLimitNotice()}

          {errorMessage &&
            <Message color={randomErrorColor()}>{errorMessage}</Message>}

          <Button
            primary
            type="submit"
            disabled={buttonDisabled}
            onClick={this.findContact}
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
