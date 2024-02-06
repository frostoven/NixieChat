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
    isPassword: PropTypes.bool,
    visible: PropTypes.bool,
    onChange: PropTypes.func,
  };

  static defaultProps = {
    label: '',
    help: null,
    placeholder: null,
    autoFocus: false,
    isPassword: false,
    visible: true,
    onChange: () => {
    },
  };

  render() {
    if (!this.props.visible) {
      return null;
    }

    const {
      label, help, placeholder, value, autoFocus, isPassword, onChange,
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
          type={isPassword ? 'password' : null}
          autoComplete={isPassword ? 'on' : null}
          onChange={onChange}
        />
      </Form.Field>
    );
  }
}

export {
  NxField,
};
