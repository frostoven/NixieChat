import React from 'react';
import PropTypes from 'prop-types';
import { Icon, Popup } from 'semantic-ui-react';

class ContextualHelp extends React.Component {
  static propTypes = {
    children: PropTypes.any,
  };

  static defaultProps = {
    children: null,
  };

  render() {
    return (
      <Popup
        trigger={
          <Icon name="question" color="green" size="small" inverted circular/>
        }
        content={this.props.children}
      />
    );
  }
}

export {
  ContextualHelp,
};
