/**
 * @author cqb 2016-04-27.
 * @module CheckBoxGroup
 */

import React from 'react';
import classNames from 'classnames';
import PropTypes from 'prop-types';
import BaseComponent from '../core/BaseComponent';
import FormControl from '../FormControl/index';
import CheckBox from '../CheckBox/index';
import fetch from '../utils/fetch';


/**
 * CheckBoxGroup 类
 * @class CheckBoxGroup
 * @constructor
 * @extend BaseComponent
 */
class CheckBoxGroup extends BaseComponent {
    static displayName = 'CheckBoxGroup';

    static propTypes = {
        /**
         * 数据源
         * @attribute data
         * @type {Array}
         */
        data: PropTypes.array,
        /**
         * 默认值
         * @attribute value
         * @type {String}
         */
        value: PropTypes.string,
        /**
         * 数据源地址
         * @attribute url
         * @type {String}
         */
        url: PropTypes.string,
        /**
         * 禁用属性
         * @attribute disabled
         * @type {Boolean}
         */
        disabled: PropTypes.bool,
        /**
         * 组名
         * @attribute name
         * @type {String}
         */
        name: PropTypes.string,
        /**
         * class样式名称
         * @attribute className
         * @type {String}
         */
        className: PropTypes.string,
        /**
         * 行式inline、堆积stack布局
         * @attribute layout
         * @type {String}
         */
        layout: PropTypes.oneOf(['inline', 'stack']),
        /**
         * value字段
         * @attribute valueField
         * @type {String}
         */
        valueField: PropTypes.string,
        /**
         * 显示字段
         * @attribute textField
         * @type {String}
         */
        textField: PropTypes.string,
        /**
         * 值变化回调
         * @attribute onChange
         * @type {Function}
         */
        onChange: PropTypes.func
    };

    static defaultProps = {
        value: '',
        data: [],
        layout: 'inline',
        valueField: 'id',
        textField: 'text',
        disabled: false
    };

    constructor (props) {
        super(props);

        this.addState({
            data: props.data,
            value: `${props.value}`,
            disabled: props.disabled
        });

        this.items = [];
        this.itemMap = {};
    }

    /**
     * 记录当前的checkbox对象
     * @param {[type]} ref [description]
     */
    addCheckBox = (ref) => {
        if (ref) {
            this.items.push(ref);
            this.itemMap[ref.getValue()] = ref;
        }
    }

    /**
     * 子元素移除后回调， 删除记录的对象
     * @param  {[type]} item [description]
     * @return {[type]}      [description]
     */
    unbind = (item) => {
        this.items = this.items.filter((aitem) => {
            return aitem != item;
        });

        delete this.itemMap[item.getValue()];
    }

    /**
     * 值变化回调
     * @method handleChange
     * @param value {String} 当前操作对象的值
     * @param checked   {Boolean} 知否选中
     * @param event     {Event} 事件对象
     * @param item  {Object} 当前操作对象
     */
    handleChange = () => {
        const {disabled} = this.state;

        if (disabled) {
            return;
        }

        const ret = [];

        this.items.forEach((theItem) => {
            if (theItem.isChecked()) {
                ret.push(theItem.getValue());
            }
        });

        this.handleTrigger(ret.join(','));
    }

    /**
     * 处理值变化
     * @method handleTrigger
     * @param value {String} 当前值
     */
    handleTrigger (value) {
        this.state.value = value;
        if (this.props.onChange) {
            this.props.onChange(value);
        }

        this.emit('change', value);
    }

    /**
     * 设置新数据
     * @param {[type]} newData [description]
     */
    setData (newData) {
        this.setState({data: newData});
    }

    /**
     * 设置值
     * @method setValue
     * @param value {String} 要设置的值
     */
    setValue (value) {
        this.setState({value: `${value}`});
    }

    /**
     * 获取值
     * @method getValue
     * @returns {*}
     */
    getValue () {
        return this.state.value;
    }

    disable () {
        this.items.forEach((item) => {
            item.disable();
        });
    }

    enable () {
        super.enable();
        this.items.forEach((item) => {
            item.enable();
        });
    }

    /**
     * 设置某个索引项为禁用状态
     * @param  {[type]} index [description]
     * @return {[type]}       [description]
     */
    disableItem (index) {
        const item = this.getItem(index);
        if (item) {
            item.disable();
        }
    }

    /**
     * 根据选项值禁用选项
     * @param  {[type]} value [description]
     * @return {[type]}       [description]
     */
    disableItemByValue (value) {
        const item = this.getItemByValue(value);
        if (item) {
            item.disable();
        }
    }

    /**
     * 设置某个索引项为启用状态
     * @param  {[type]} index [description]
     * @return {[type]}       [description]
     */
    enableItem (index) {
        const item = this.getItem(index);
        if (item) {
            item.enable();
        }
    }

    /**
     * 根据选项值激活选项
     * @param  {[type]} value [description]
     * @return {[type]}       [description]
     */
    enableItemByValue (value) {
        const item = this.getItemByValue(value);
        if (item) {
            item.enable();
        }
    }

    /**
     * 获取某个索引的checkbox项
     * @param  {[type]} index [description]
     * @return {[type]}       [description]
     */
    getItem (index) {
        const item = this.items[index];
        return item;
    }

    /**
     * 根据value值获取其中的项
     * @param  {[type]} value [description]
     * @return {[type]}       [description]
     */
    getItemByValue (value) {
        const item = this.itemMap[value];
        return item;
    }

    /**
     * 获取所有的checkbox项
     * @return {[type]} [description]
     */
    getItems () {
        return this.items;
    }

    /**
     * 渲染显式的子组件
     * @return {Array} 子元素
     */
    renderChildrenItems () {
        const {name} = this.props;
        const values = this.state.value === undefined ? [] : this.state.value.split(',');
        return React.Children.map(this.props.children, (child) => {
            const componentName = child && child.type && child.type.displayName ? child.type.displayName : '';
            if (componentName === 'CheckBox') {
                const value = `${child.props.value}`;
                const checked = values.indexOf(value) != -1;
                const props = Object.assign({}, child.props, {
                    name,
                    ref: this.addCheckBox,
                    unbind: this.unbind,
                    checked,
                    onChange: this.handleChange,
                    disabled: this.state.disabled || child.props.disabled
                });
                return React.cloneElement(child, props);
            } else {
                return child;
            }
        });
    }

    /**
     * 渲染子节点
     * @method renderItems
     * @returns {Array} 子对象
     * @private
     */
    renderItems () {
        const {valueField, textField, name} = this.props;

        const data = this.state.data || [];
        const values = this.state.value === undefined ? [] : this.state.value.split(',');
        return data.map((item) => {
            const value = `${item[valueField]}`;
            const text = item[textField];
            const checked = values.indexOf(value) != -1;
            item._checked = checked;

            return (<CheckBox key={value}
                name={name}
                ref={this.addCheckBox}
                disabled={this.state.disabled}
                value={value}
                label={text}
                checked={checked}
                unbind={this.unbind}
                onChange={this.handleChange}
            />);
        }, this);
    }

    componentWillMount () {
        if (this.props.url) {
            this.loadRemoteData();
        }
    }

    /**
     * 加载远程数据
     * @return {Promise} [description]
     */
    async loadRemoteData () {
        const data = await fetch(this.props.url);
        this.setState({data});
    }

    componentWillReceiveProps (nextProps) {
        const params = {};
        const value = nextProps.value === 'undefined' ? '' : nextProps.value;
        if (value !== this.props.value && value !== this.state.value) {
            params.value = value;
        }
        if (nextProps.data != this.state.data && nextProps.data != this.props.data) {
            params.data = nextProps.data;
        }
        this.setState(params);
    }

    render () {
        let {className, layout, style} = this.props;
        className = classNames(
            className,
            'cm-checkbox-group',
            {
                'cm-checkbox-group-stack': layout === 'stack'
            }
        );

        return (
            <span className={className} style={style}>
                {this.renderChildrenItems()}
                {this.renderItems()}
            </span>
        );
    }
}

FormControl.register(CheckBoxGroup, 'checkbox', 'array');

export default CheckBoxGroup;
