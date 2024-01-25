import React from 'react';
import ReactDOM from 'react-dom';
import './modal';
import { clientEmitter } from './emitters/comms';
import { NixieStorage } from './storage/NixieStorage';
import { AccountsScreen } from './components/AccountsScreen';
import { MainSection } from './components/MainSection';
import { clientEmitterAction } from './emitters/clientEmitterAction';

/**
 * TODO list:
 *  * create a login screen
 *  * allow creation of accounts in the login screen [explain they need to be backed up]
 *  * if you allow yourself to be found, you ca be searched or if they know your exact name
 *  * every chat is multi-user. new users may request all past plaintext messages from other
 *    people in the chat. if they refuse, then you need to resync plaintext from others to
 *    see new messages from exising user.
 *  * all messages are internally stored as jpg or png. if another is sent, convert to jpg
 *    or png depending on whether or not the source is lossless.
 *  * create a SHA-256 address of the person's public key.
 */

if (
  location.protocol === 'http:' &&
  ![ 'localhost', '127.0.0.1' ].includes(location.hostname)
) {
  $modal.alert({
    header: 'Cryptographic Error',
    body: (
      <div>
        This page was loaded over HTTP. Most browsers block cryptographic
        functions under HTTP.
        <br/>
        <br/>
        If account creation and loading refuses to run, you'll either need to
        switch to HTTPS or download the NixieChat app.
      </div>
    ),
  });
}

class RootNode extends React.Component {
  static defaultState = {
    booting: true,
    loggedIn: false,
  };

  storage = new NixieStorage();

  constructor(props) {
    super(props);
    this.state = { ...RootNode.defaultState };
  }

  componentDidMount() {
    clientEmitter.on(clientEmitterAction.reloadApp, async () => {
      this.setState({
        loggedIn: !!this.storage.lastActiveAccount,
        booting: false,
      });
    });
  }

  render() {
    const { booting, loggedIn } = this.state;

    if (booting) {
      return <div>Starting up...</div>;
    }
    else if (!loggedIn) {
      return <AccountsScreen/>;
    }
    else {
      return (
        <MainSection/>
      );
    }
  }
}

const domContainer = document.querySelector('#react-element');
const element = React.createElement;
ReactDOM.render(element(RootNode), domContainer);
