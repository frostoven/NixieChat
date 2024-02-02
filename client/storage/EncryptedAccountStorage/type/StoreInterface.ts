interface StoreInterface {
  isDbReady: Function,
  prepareAccountsStore: Function,
  createAccount: Function,
  getAccountsStore: Function,
  getAccountByPublicName: Function,
  findAccountByPublicName: Function,
  addContact: Function,
  retrieveAllContacts: Function,
  retrieveContactByName: Function,
}

export {
  StoreInterface,
};
