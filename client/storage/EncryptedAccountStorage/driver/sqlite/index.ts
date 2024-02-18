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

  getAccountsStore() {
    console.error('[SQLiteStorage] under construction');
  }

  addContact() {
    console.error('[SQLiteStorage] under construction');
  }

  public getAllContactsByOwner() {
    console.error('[SQLiteStorage] under construction');
  }

  retrieveAllContacts() {
    console.error('[SQLiteStorage] under construction');
  }
}

export default SqliteStorage;
