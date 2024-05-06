import {
  EncryptedAccountStorage,
} from '../../../storage/EncryptedAccountStorage';
import { MessageFormatter } from '../../../richInput/MessageFormatter';

const accountStorage = new EncryptedAccountStorage();

class DraftIo {
  private accountName: string;
  private messageDetachableId: string;

  constructor(accountName: string, messageDetachableId: string) {
    this.accountName = accountName;
    this.messageDetachableId = messageDetachableId;
  }

  // Saves the current unsent message for later use.
  saveDraft = (element: HTMLTextAreaElement | HTMLDivElement) => {
    // @ts-ignore - Possible failure is part of the test.
    const textOnly = element.type === 'textarea';
    const formatter = new MessageFormatter();

    if (textOnly) {
      // @ts-ignore
      const value = element.value || '';
      formatter.importFromPlaintext(value);
    }
    else {
      formatter.importFromElement(element);
    }

    const message = formatter.exportAsJsonString(true);
    const { accountName, messageDetachableId } = this;
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
  loadDraft = (onLoaded: Function, textOnly = false) => {
    const { accountName, messageDetachableId } = this;
    accountStorage.loadDraft({
      accountName,
      messageDetachableId,
    }).then((formattedMessage) => {
      if (formattedMessage) {
        const formatter =
          new MessageFormatter().importFromJsonString(formattedMessage);

        if (textOnly) {
          onLoaded(formatter.exportAsPlaintext());
        }
        else {
          onLoaded(formatter.exportAsHtmlNodes());
        }
      }
    }).catch(console.error);
  };

}

export {
  DraftIo,
};
