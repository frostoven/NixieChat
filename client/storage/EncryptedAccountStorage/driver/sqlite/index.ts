import { StoreInterface } from '../../types/StoreInterface';

class SqliteStorage implements StoreInterface {
  prepareAccountsStore() {
    console.error('[SQLiteStorage] under construction');
  }

  async isDbReady() {
    console.error('[SQLiteStorage] under construction');
  }

  async createAccount() {
    console.error('[SQLiteStorage] under construction');
  }

  async getAllEncryptedAccounts() {
    console.error('[SQLiteStorage] under construction');
    return null;
  }

  addContact() {
    console.error('[SQLiteStorage] under construction');
  }

  createChat() {
    console.error('[SQLiteStorage] under construction');
  }

  getAllContactsByOwner() {
    console.error('[SQLiteStorage] under construction');
  }

  getAllChatsByOwner() {
    console.error('[SQLiteStorage] under construction');
  }

  createMessage() {
    console.error('[SQLiteStorage] under construction');
  }

  getMessagesDescending() {
    console.error('[SQLiteStorage] under construction');
  }

  saveDraft() {
    console.error('[SQLiteStorage] under construction');
  }

  loadDraft() {
    console.error('[SQLiteStorage] under construction');
  }

  deleteDraft() {
    console.error('[SQLiteStorage] under construction');
  }
}

export default SqliteStorage;
