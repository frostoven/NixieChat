import React from 'react';
import './modal';
import { clientEmitter } from './emitters/comms';
import { UnencryptedSettingsStore } from './storage/UnencryptedSettingsStore';
import { MainSection } from './components/MainSection';
import { clientEmitterAction } from './emitters/clientEmitterAction';
import { EncryptedAccountStorage } from './storage/EncryptedAccountStorage';
import { microRouter } from './microRouter';

const bootStyle: React.CSSProperties = {
  textAlign: 'center',
  width: '100%',
};

class RootNode extends React.Component {
  state = {
    bootComplete: false,
    bootMessages: [ 'Starting up...' ],
  };

  plaintextStorage = new UnencryptedSettingsStore();
  accountStorage = new EncryptedAccountStorage();

  componentDidMount() {
    microRouter.init();
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
    await this.plaintextStorage.initStorage();

    await this.asyncSetState({
      bootMessages: [ ...this.state.bootMessages, 'Loading accounts...' ],
    });
    await accountStorage.autoLoadAllAccounts();

    this.setState({
      bootComplete: true,
    }, () => {
      // To prevent blinding the dark theme folks with a flash of white during
      // boot, we hardcode boot styles into the loader elements. Those styles
      // get in the way after boot; remove them here.
      const bodyBackdrop = document.querySelector('.initial-body-backdrop');
      const loaderBackdrop = document.querySelector('.initial-loader-backdrop');
      bodyBackdrop && bodyBackdrop.classList.remove('initial-body-backdrop');
      loaderBackdrop && loaderBackdrop.classList.remove('initial-loader-backdrop');
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
