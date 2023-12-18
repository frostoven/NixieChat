import React from 'react';
import PropTypes from 'prop-types';
import { Form } from 'semantic-ui-react';
import { ContextualHelp } from './ContextualHelp';

class NxField extends React.Component {
  static propTypes = {
    label: PropTypes.any,
    help: PropTypes.any,
    placeholder: PropTypes.any,
    value: PropTypes.any,
    autoFocus: PropTypes.bool,
    onChange: PropTypes.func,
  };

  static defaultProps = {
    label: '',
    help: null,
    placeholder: null,
    autoFocus: false,
    onChange: () => {
    },
  };

  render() {
    const {
      label, help, placeholder, value, autoFocus, onChange,
    } = this.props;
    return (
      <Form.Field>
        <label>
          {label}
          &nbsp;
          {help ? <ContextualHelp>{help}</ContextualHelp> : null}
        </label>
        <input
          autoFocus={autoFocus}
          placeholder={placeholder}
          value={value}
          onChange={this.props.onChange}
        />
      </Form.Field>
    );
  }
}

export {
  NxField,
};
