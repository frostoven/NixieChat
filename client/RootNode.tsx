import React from 'react';
import './modal';
import { clientEmitter } from './emitters/comms';
import { NixieStorage } from './storage/NixieStorage';
import { MainSection } from './components/MainSection';
import { clientEmitterAction } from './emitters/clientEmitterAction';
import { EncryptedAccountStorage } from './storage/EncryptedAccountStorage';

const bootStyle: React.CSSProperties = {
  textAlign: 'center',
  width: '100%',
};

class RootNode extends React.Component {
  state = {
    bootComplete: false,
    bootMessages: [ 'Starting up...' ],
  };

  plaintextStorage = new NixieStorage();
  accountStorage = new EncryptedAccountStorage();

  componentDidMount() {
    this.watchBoot().catch(console.error);
    clientEmitter.on(clientEmitterAction.reloadApp, async () => {
      this.watchBoot().then(() => {
        this.forceUpdate();
      }).catch(console.error);
    });
  }

  asyncSetState = async (newState: object) => {
    return new Promise<void>(resolve => {
      this.setState(newState, resolve);
    });
  };

  watchBoot = async () => {
    const accountStorage = this.accountStorage;

    await this.asyncSetState({
      bootMessages: [ ...this.state.bootMessages, 'Preparing database...' ],
    });
    await accountStorage.prepareAccountsStore();

    await this.asyncSetState({
      bootMessages: [ ...this.state.bootMessages, 'Loading accounts...' ],
    });
    await accountStorage.autoLoadAllAccounts();

    this.setState({
      bootComplete: true,
    });
  };

  render() {
    const { bootComplete, bootMessages } = this.state;

    if (!bootComplete) {
      return (
        <div style={bootStyle}>
          <h3>
            Frostoven's NixieChat
          </h3>

          {this.state.bootMessages.map((value, index) => {
            return (
              <div key={`RootNodeBoot${index}`}>
                {value}
              </div>
            );
          })}
        </div>
      );
    }

    return <MainSection/>;
  }
}

export {
  RootNode,
};
