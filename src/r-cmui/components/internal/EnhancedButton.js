import React from 'react';
const Component = React.PureComponent;
import TouchRipple from './TouchRipple';

class EnhancedButton extends Component {
    /**
     * 创建按钮子元素
     * @method createButtonChildren
     * @returns {*}
     */
    createButtonChildren () {
        const {
            children,
            disabled,
            centerRipple,
            touchRippleColor,
            touchRippleOpacity,
            initFull
        } = this.props;

        const touchRipple = !disabled ? (
            <TouchRipple
                key='touchRipple'
                centerRipple={centerRipple}
                color={touchRippleColor}
                opacity={touchRippleOpacity}
                initFull={initFull}
            >
                {children}
            </TouchRipple>
        ) : undefined;

        const ret = [];
        ret.push(touchRipple);
        if (!touchRipple) {
            ret.push(children);
        }
        return ret;
    }

    handleClick = (event) => {
        if (!this.props.disabled) {
            if (this.props.onClick) {
                this.props.onClick(event);
            }
        }
    }

    render () {
        const {
            disabled,
            style
        } = this.props;

        const mergedStyles = Object.assign({
            border: 10,
            background: 'none',
            boxSizing: 'border-box',
            display: 'inline-block',
            cursor: disabled ? 'default' : 'pointer',
            textDecoration: 'none',
            outline: 'none',
            font: 'inherit'
        }, style);

        const buttonChildren = this.createButtonChildren();

        const props = {
            style: mergedStyles,
            disabled,
            onClick: this.handleClick
        };
        return (
            <span {...props}>
                {buttonChildren}
            </span>
        );
    }
}

export default EnhancedButton;
