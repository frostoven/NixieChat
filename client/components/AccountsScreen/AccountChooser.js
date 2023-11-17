import React from 'react';

class AccountChooser extends React.Component {
  static propTypes = { 
    //
  };
  
  static defaultProps = {
    //
  };

  render() {
    const accounts = this.storage.getAccountList();
    return (
      <div>
      </div>
    )
  }
}

export {
  AccountChooser,
}
