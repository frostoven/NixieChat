import {
  EncryptedAccountStorage,
} from '../../../storage/EncryptedAccountStorage';

const accountStorage = new EncryptedAccountStorage();

class DraftIo {
  private accountName: string;
  private messageDetachableId: string;

  constructor(accountName: string, messageDetachableId: string) {
    this.accountName = accountName;
    this.messageDetachableId = messageDetachableId;
  }

  // Saves the current unsent message for later use.
  saveDraft = (message) => {
    const {accountName, messageDetachableId} = this;
    if (message) {
      accountStorage.saveDraft({
        accountName,
        messageDetachableId,
        message,
      }).catch(console.error);
    }
    else {
      accountStorage.deleteDraft({
        accountName,
        messageDetachableId,
      }).catch(console.error);
    }
  };

  // Restores the last unsent message.
  loadDraft = (onLoaded: Function) => {
    const {accountName, messageDetachableId} = this;
    accountStorage.loadDraft({
      accountName,
      messageDetachableId,
    }).then((message) => {
      if (message) {
        onLoaded(message);
      }
    }).catch(console.error);
  };

}

export {
  DraftIo,
};
