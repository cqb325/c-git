/**
 * @author cqb 2018-05-12.
 * @module Scroller
 */

import React from 'react';
import classNames from 'classnames';

class ScrollItem extends React.Component {
    displayName = 'ScrollItem';

    render () {
        const clazzName = classNames('cm-date-scroll-item-num', {
            'cm-date-scroll-item-num-active': this.props.active,
            'cm-date-scroll-item-num-disable': this.props.disable
        });
        return <div className={clazzName} onClick={this.props.onClick}>{this.props.num}</div>;
    }
}

class Scroller extends React.Component {
    displayName = 'Scroller';

    static defaultProps = {
        min: 0,
        max: 59,
        value: 0
    };

    state = {
        value: Math.max(this.props.value, this.props.min),
        min: this.props.min,
        max: this.props.max
    };

    renderItems () {
        const arr = [];
        let value = Math.max(this.state.value, this.state.min);
        value = Math.min(value, this.state.max);
        for (let i = this.state.min; i <= this.state.max; i++) {
            const num = i < 10 ? `0${i}` : i;
            arr.push(<ScrollItem key={i} onClick={this.onClick.bind(this, i)} active={value == i} num={num}></ScrollItem>);
        }
        return arr;
    }

    componentDidMount () {
        // this.wrap.addEventListener('mousewheel', this.scrollWrap, false);
        // this.wrap.addEventListener('DOMMouseScroll',this.scrollWrap,false);
        this.scrollTop();
    }

    scrollTop () {
        let value = Math.max(this.state.value, this.state.min);
        value = Math.min(value, this.state.max);
        const top = 34 * (value - this.state.min);
        this.scroller.scrollTop = top;
    }

    // scrollWrap = (e) => {
    //     if (e.preventDefault) {
    //         e.preventDefault();
    //     }
    //     if (e.stopPropagation) {
    //         e.stopPropagation();
    //     }
    //     const delta = e.wheelDelta || -e.detail;
    //     if (delta < 0) {
    //         this.addNum();
    //     } else {
    //         this.subNum();
    //     }
    // }

    // addNum () {
    //     const value = Math.min(this.state.value + 1, this.state.max);
    //     this.setState({value}, () => {
    //         if (this.props.onChange) {
    //             this.props.onChange(value);
    //         }
    //     });
    // }

    // subNum () {
    //     const value = Math.max(this.state.value - 1, this.state.min);
    //     this.setState({value}, () => {
    //         if (this.props.onChange) {
    //             this.props.onChange(value);
    //         }
    //     });
    // }

    onClick (value) {
        this.setState({value}, () => {
            this.scrollTop();
            if (this.props.onChange) {
                this.props.onChange(value);
            }
        });
    }

    getValue () {
        return this.state.value;
    }

    setValue (value, min, max) {
        value = Math.max(value, min === undefined ? this.state.min : min);
        value = Math.min(value, max === undefined ? this.state.max : max);
        this.setState({value});
    }

    setMin (min, callback) {
        const value = Math.max(this.state.value, min);
        this.setState({
            min,
            value
        }, () => {
            callback ? callback() : false;
        });
    }

    setMax (max, callback) {
        const value = Math.min(this.state.value, max);
        this.setState({max, value}, () => {
            callback ? callback() : false;
        });
    }

    setEdge (min, max, callback) {
        let value = Math.max(this.state.value, min);
        value = Math.min(value, max);
        this.setState({min, max, value}, () => {
            callback ? callback() : false;
        });
    }

    componentWillUnmount () {
        this.wrap.removeEventListener('mousewheel', this.scrollWrap);
    }

    componentWillReceiveProps (nextProps) {
        const params = {};
        if (nextProps.min !== this.props.min && nextProps.min !== this.state.min) {
            params.min = nextProps.min === undefined ? this.state.min : nextProps.min;
            this.setMin(nextProps.min);
        }
        if (nextProps.max !== this.props.max && nextProps.max !== this.state.max) {
            params.max = nextProps.max === undefined ? this.state.max : nextProps.max;
            this.setMax(nextProps.max);
        }
        if (nextProps.value !== this.props.value && nextProps.value !== this.state.value) {
            this.setValue(nextProps.value, params.min, params.max);
        }
    }

    render () {
        const {className, style} = this.props;
        const clazzName = classNames(className, 'cm-date-scroll-item');
        return (
            <div className={clazzName} style={style} ref={(f) => this.wrap = f}>
                <div ref={(f) => this.scroller = f} className='cm-date-scroll-item-wrap'>
                    {this.renderItems()}
                </div>
            </div>
        );
    }
}
export default Scroller;
