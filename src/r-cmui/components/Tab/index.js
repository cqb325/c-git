/**
 * @author cqb 2016-05-09.
 * @module Tab
 */

import React from 'react';
import classNames from 'classnames';
import BaseComponent from '../core/BaseComponent';
import EnhancedButton from '../internal/EnhancedButton';
import ScrollInner from './scrollinner';
import Item from './Item';
import './Tab.less';

/**
 * Tab 类
 * @class Tab
 * @constructor
 * @extend BaseComponent
 */
class Tab extends BaseComponent {
    static displayName = 'Tab';

    static defaultProps = {
        hasClose: false
    };

    constructor (props) {
        super(props);

        this.addState({
            activeKey: props.activeKey || this.getDefaultActiveKey(),
            headerSize: 0
        });
    }

    getDefaultActiveKey () {
        let activeKey = '';
        React.Children.forEach(this.props.children, (child) => {
            if (!activeKey && child && child.key) {
                activeKey = child.key;
            }
        });
        return activeKey;
    }

    _selectTab (key, disabled, event) {
        if (event.stopPropagation()) {
            event.stopPropagation();
        }
        if (disabled) {
            return false;
        }
        this.setState({
            activeKey: key
        });
        this.refs.scroll.jumpToKey(key);

        if (this.props.onSelect) {
            this.props.onSelect(key);
        }
    }

    /**
     * 获取激活的tab的key
     * @method getActiveKey
     * @returns {*}
     */
    getActiveKey () {
        return this.state.activeKey;
    }

    componentDidUpdate () {
        this.updateSize();
    }

    componentDidMount () {
        this.updateSize();
    }

    updateSize () {
        const rect = this.header.getBoundingClientRect();
        const w = rect.width ;
        const length = this.props.children.length;
        const size = this.props.children.length ? (w - 20 + 20 * length) / length : 0;
        this.setState({
            headerSize: size
        });
    }

    _getHeader () {
        const activeKey = this.state.activeKey;
        return React.Children.map(this.props.children, (child) => {
            const {title, disabled} = child.props;
            const key = child.key;
            const active = activeKey === key;
            const style = {
                width: this.state.headerSize
            };

            const className = classNames({
                active
            });
            return (
                <li key={key} className={className} style={style} onClick={(e) => { this._selectTab(key, disabled, e); }}>
                    <a href='javascript:void(0)' className='cm-tab-title' title={title}>
                        {title}
                        {this.props.hasClose ? <span className='cm-tab-close' title='关闭' onClick={this._removeItem.bind(this, key)}>&times;</span> : null}
                    </a>
                </li>
            );
        });
    }

    _getContent () {
        const activeKey = this.state.activeKey;
        return React.Children.map(this.props.children, (child) => {
            const key = child.key;
            const active = activeKey === key;

            const className = classNames('cm-tab-panel', child.className, {
                active
            });
            const props = Object.assign({className, identify: key}, child.props);
            return React.cloneElement(child, props);
        });
    }

    _removeItem (key, event) {
        if (event.stopPropagation()) {
            event.stopPropagation();
        }

        if (this.props.onRemove) {
            this.props.onRemove(key);
        }

        return false;
    }

    componentWillReceiveProps (nextProps) {
        if (nextProps.activeKey !== this.props.activeKey) {
            this.setState({
                activeKey: nextProps.activeKey
            });
        }
    }

    render () {
        let {className, style} = this.props;
        className = classNames('cm-tab', className);

        const headers = this._getHeader();
        const contents = this._getContent();
        return (
            <div className={className} style={style}>
                <ul className='cm-tab-header' ref={(f) => this.header = f}>
                    {headers}
                    <div className='cm-tab-tools'>
                        {this.props.tools}
                    </div>
                </ul>
                <div className='cm-tab-content'>
                    <ScrollInner ref='scroll' activeKey={this.state.activeKey}>
                        {contents}
                    </ScrollInner>
                </div>
            </div>
        );
    }
}

Tab.Item = Item;

export default Tab;
