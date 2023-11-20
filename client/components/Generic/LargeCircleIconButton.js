import React from 'react';
import PropTypes from 'prop-types';
import { Button, Icon } from 'semantic-ui-react';

class LargeCircleIconButton extends React.Component {
  static propTypes = {
    onClick: PropTypes.func,
    icon: PropTypes.string,
    label: PropTypes.string,
    iconStyle: PropTypes.object,
  };

  static defaultProps = {
    onClick: () => {
      console.warn('[LargeCircleIconButton] no callback specified.');
    },
    icon: 'paperclip',
    label: 'Button',
    iconStyle: {},
  };

  render() {
    return (
      <div onClick={this.createChat} style={{
        cursor: 'pointer',
        textAlign: 'center',
        width: 200,
        height: 200,
        margin: 'auto',
      }}>
        <br/>
        <Button style={{
          textAlign: 'center',
          width: 99,
          height: 99,
          borderRadius: '100%',
        }}>
          <Icon
            size="big"
            /** @type  */
            name={this.props.icon}
            style={{ paddingLeft: 12, ...this.props.iconStyle }}
          />
        </Button>
        <br/><br/>
        <b>{this.props.label}</b>
      </div>
    );
  }
}

console.log({LargeCircleIconButton})

export {
  LargeCircleIconButton,
};
