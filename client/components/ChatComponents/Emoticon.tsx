import React from 'react';
import { StyleManifest } from '../../emoticonConfig/types/StyleManifest';
import { getEmoticonUrl } from '../../emoticonConfig';

interface Props {
  unicode: number,
  // Preview emoticons are larger. Default is true.
  isPreview?: boolean,
  tone: number,
  styleManifest: StyleManifest,
  onClick?: (unicode: number, styleManifest: StyleManifest, path: string) => void,
}

class Emoticon extends React.Component<Props> {
  path: string;

  constructor(props: Props | Readonly<Props>) {
    super(props);
    const { unicode, styleManifest, tone } = props;
    this.path = getEmoticonUrl(unicode, styleManifest, tone);
  }

  shouldComponentUpdate(nextProps: Readonly<Props>): boolean {
    // Emoticons should almost never re-render as they exist in the thousands.
    // The only valid reason currently to recreate emoticons are for tone
    // changes.
    return nextProps.tone !== this.props.tone;
  }

  handleClick = () => {
    if (!this.props.onClick) {
      return;
    }
    this.props.onClick(
      this.props.unicode,
      this.props.styleManifest,
      this.path,
    );
  };

  render() {
    const { unicode, styleManifest, tone, isPreview } = this.props;

    let style: React.CSSProperties;
    if (isPreview === false) {
      const {
        width, marginTop, marginRight, marginBottom, marginLeft,
      } = styleManifest.uiFit;
      style = {
        cursor: 'pointer',
        width, marginTop, marginRight, marginBottom, marginLeft,
      };
    }
    else {
      style = {
        cursor: 'pointer',
        width: styleManifest.previewSize,
      };
    }

    return (
      <img
        alt={String.fromCodePoint(unicode, tone)}
        src={this.path}
        style={style}
        onClick={this.handleClick}
      />
    );
  }
}

export {
  Emoticon,
};
