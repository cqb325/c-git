/**
 * @author cqb 2016-04-26.
 * @module FormControl
 */

import React from 'react';
import ReactDOM from 'react-dom';
import classNames from 'classnames';
import BaseComponent from '../core/BaseComponent';
import PropTypes from 'prop-types';
import Regs from '../utils/regs';
import Dom from '../utils/Dom';
import Validation from '../utils/Validation';
import Label from '../Label/index';
import Tooltip from '../Tooltip/index';
import omit from 'omit.js';
import Ajax from './Ajax';
import './FormControl.less';


/**
 * FormControl 类
 * 子元素只能有一个子元素控件
 * @class FormControl
 * @constructor
 * @extend BaseComponent
 */
class FormControl extends BaseComponent {
    displayName = 'FormControl';
    static displayName = 'FormControl';

    static defaultProps = {
        isFormItem: true,
        tipAlign: 'right',
        tipAuto: false,
        tipTheme: 'error',
        type: 'text',
        layout: 'inline',
        trigger: 'blur'
    };

    constructor (props) {
        super(props);

        this._isFormItem = props.isFormItem;
        this._areaLabel = false;
        this._tipAlign = props.tipAlign;
        this._tipAuto = props.tipAuto;
        this.item = null;

        this.addState({
            errorTip: ''
        });
    }

    /**
     * 获取类型对应的元素
     * @method _getControl
     * @param type
     * @returns {*}
     * @private
     */
    _getControl (type) {
        let component = null;
        if (type) {
            component = FormControl.COMPONENTS[type];
            if (!component) {
                component = FormControl.COMPONENTS['text'];
            }

            const others = omit(this.props, ['itemUnBind', 'tipTheme', 'tipAlign', 'tipAuto', 'itemStyle', 'itemClass', 'labelWidth',
                'handleChange', 'data-valueType', 'className', 'children', 'rules', 'messages', 'isFormItem',
                'onValid', 'onChange', 'label', 'labelGrid']);
            const props = Object.assign({
                type: this.props.type,
                id: this.props.id,
                key: 'formItem',
                ref: (f) => {
                    this.item = f;
                },
                'data-valueType': component.valueType
            }, others);
            props.onChange = this.onChange;
            delete props.required;

            this.props.itemStyle ? props.style = this.props.itemStyle : false;
            this.props.itemClass ? props.className = this.props.itemClass : false;

            component = React.createElement(component.component, props);
        }
        return component;
    }

    /**
     * 渲染子元素
     * @method _renderChildren
     * @returns {*}
     * @private
     */
    _renderChildren (ele) {
        ele = ele || this;
        return React.Children.map(ele.props.children, (child, index) => {
            const registerComp = this.isRegisterComponent(child);
            if (registerComp) {
                const others = omit(this.props, ['itemUnBind', 'tipTheme', 'tipAlign', 'tipAuto', 'itemStyle', 'itemClass', 'labelWidth',
                    'handleChange', 'data-valueType', 'className', 'children', 'rules', 'messages', 'isFormItem',
                    'onValid', 'onChange', 'label', 'labelGrid']);
                let props = Object.assign({
                    key: index,
                    'data-valueType': registerComp.valueType,
                    ref: (f) => {
                        this.item = f;
                    }
                }, others);

                props = Object.assign(props, child.props);
                props.onChange = this.onChange;

                delete props.required;

                this.props.itemStyle ? props.style = this.props.itemStyle : false;
                this.props.itemClass ? props.className = this.props.itemClass : false;

                return React.cloneElement(child, props);
            } else {
                if (child && child.props && child.props.children) {
                    return React.cloneElement(child, child.props, this._renderChildren(child));
                }   else {
                    return child;
                }
            }
        });
    }

    /**
     * 判断是否为已注册的控件
     * @method isRegisterComponent
     * @param child
     * @returns {boolean}
     */
    isRegisterComponent (child) {
        for (const type in FormControl.COMPONENTS) {
            const typeComp = FormControl.COMPONENTS[type];
            if (typeComp.component === child.type) {
                return typeComp;
            }
        }

        return false;
    }

    /**
     * 对Input处理change变化事件
     * @method handleChange
     * @param event {Event} 事件对象
     */
    handleChange = (event, options) => {
        let {disabled, type, trigger} = this.props;
        if (disabled) {
            return;
        }
        // textArea
        if (this.props.autoHeight) {
            if (options && options.component) {
                options.component.autoHeight(event);
            }
        }

        if (!this.item) {
            // this.item = this.refs.formItem;
            return ;
        }
        // chilren自定义
        type = type || this.item.props.type;

        let value = event.target.value;

        if (value && (type === 'integer' || type === 'number')) {
            if (!Regs[type].test(value)) {
                value = this.state.value || '';
            }
        }

        this.item.setState({ value });

        const eventType = event.type;
        if (trigger && trigger === eventType) {
            this.check(value);
            if (this.props.onChange) {
                this.props.onChange.apply(this, [value, event]);
            }
        }
    }

    /**
     * 是否需要验证
     * @returns {boolean}
     */
    needValid () {
        if (!this.isFormItem()) {
            return false;
        }
        if (this.props.type === 'hidden') {
            return false;
        }

        if (this.props.disabled || this.props.readOnly) {
            return false;
        }

        if (this.item.state && this.item.state.disabled) {
            return false;
        }

        // Lable的不需要验证
        if (this.item && this.item.displayName === 'Label') {
            return false;
        }

        if (this._isMounted) {
            const ele = Dom.dom(ReactDOM.findDOMNode(this));
            if (ele.width() === 0 && ele.height() === 0) {
                return false;
            }
        }

        return true;
    }

    /**
     * 值变化回调
     * @method onChange
     * @param value 当前的值
     */
    onChange = (value, selectItem, option) => {
        this.check(value);
        if (this.props.onChange) {
            this.props.onChange.apply(this, [value, selectItem, option]);
        }
    }

    /**
     * 验证元素
     * @method check
     * @param value {String} 元素的值
     * @returns {boolean} 是否通过
     */
    check (value) {
        if (!this.needValid()) {
            return true;
        }

        if (value === undefined) {
            value = this.item.getValue();
        }
        const rules = this.props.rules || {};
        if (this.props.required) {
            rules['required'] = true;
        }
        const messages = this.props.messages;
        let rule;
        let result;

        if (!rules['required'] && (value === null || value === '' || value === undefined)) {
            if (this.state.errorTip) {
                this.setState({errorTip: null});
                this.refs.tooltip.setTitle(null);
                this.refs.tooltip.hide();
            }
            return true;
        }

        if (this.item.props['data-valueType'] === 'array') {
            value = value ? value instanceof Array ? value : value.split(',') : [];
        }

        if (rules['required']) {
            rule = { method: 'required', parameters: rules[ 'required' ] };
            result = this.validByMethod(value, rule, messages);
            if (result === false) {
                if (this._tipAuto) {
                    this.refs.tooltip.show();
                }
                return false;
            }
        }
        for (const method in rules) {
            if (method === 'required' || method === 'remote') {
                continue;
            }
            rule = { method, parameters: rules[ method ] };

            result = this.validByMethod(value, rule, messages);
            if (result === false) {
                if (this._tipAuto) {
                    this.refs.tooltip.show();
                }
                return false;
            }
        }
        if (rules['remote']) {
            let url = rules[ 'remote' ];
            if (typeof url === 'function') {
                url = url();
            } else {
                const params = {};
                params[this.props.name] = value;
                url = this._URLParse(url, params);
                url = this._rebuildURL(url);
            }

            result = this.validByRemote(value, url, messages);
            if (result === false) {
                if (this._tipAuto) {
                    this.refs.tooltip.show();
                }
                return false;
            }
        }

        if (this.props.onValid) {
            this.props.onValid(value, true, this);
        }
        this.emit('valid', value, true, this);

        this.setState({errorTip: null});
        this.refs.tooltip.setTitle(null);
        this.refs.tooltip.hide();

        return true;
    }

    /**
     * 解析url
     * @method _URLParse
     * @param url
     * @param otherParams
     * @returns {{pathname: *, query: {}}}
     * @private
     */
    _URLParse (url, otherParams) {
        url = url.split('?');
        const params = {};

        if (url[1]) {
            const parts = url[1].split('&');
            if (parts.length) {
                parts.forEach((part) => {
                    const pair = part.split('=');
                    params[pair[0]] = pair[1];
                });
            }
        }
        if (otherParams) {
            for (const key in otherParams) {
                params[key] = otherParams[key];
            }
        }

        return {
            pathname: url[0],
            query: params
        };
    }

    /**
     * 重构url
     * @param url
     * @returns {string}
     * @private
     */
    _rebuildURL (url) {
        const suffix = [];
        if (url.query) {
            for (const key in url.query) {
                suffix.push(`${key}=${url.query[key]}`);
            }
        }
        return `${url.pathname}?${suffix.join('&')}`;
    }

    /**
     * 远程验证字段
     * @param value
     * @param url
     * @param messages
     */
    validByRemote (value, url, messages) {
        const remoteRet = Ajax.get(url);

        let errorTip;
        if (remoteRet && !remoteRet.success) {
            errorTip = (messages && messages['remote']) ? messages['remote'] : Validation.messages['remote'];
            if (this._isMounted) {
                this.setState({errorTip});
                this.refs.tooltip.setTitle(errorTip);
            }
            if (this.props.onValid) {
                this.props.onValid(value, remoteRet.success, this);
            }
            this.emit('valid', value, remoteRet.success, this);
        }

        return remoteRet.success;
    }

    validByMethod (value, rule, messages) {
        const method = rule.method;
        if (!Validation.methods[ method ]) {
            console.error(`验证中缺少${method}方法`);
            return;
        }
        const result = Validation.methods[ method ].call(this, value, rule.parameters);
        let errorTip;
        if (result === false) {
            errorTip = (messages && messages[method]) ? messages[method] : Validation.messages[method];
            if (typeof errorTip === 'function') {
                if (!(rule.parameters instanceof Array)) {
                    rule.parameters = [rule.parameters];
                }
                errorTip = errorTip(...rule.parameters);
            }
            this.setState({errorTip});
            this.refs.tooltip.setTitle(errorTip);
            if (this.props.onValid) {
                this.props.onValid(value, result, this);
            }
            this.emit('valid', value, result, this);
        }

        return result;
    }

    /**
     * 获取表单元素
     * @method getReference
     * @returns {*}
     */
    getReference () {
        return this.item;
    }

    componentDidMount () {
        this._isMounted = true;
        if (this.props['itemBind'] && this.isFormItem()) {
            this.props['itemBind']({
                ref: this,
                name: this.props.name,
                isFormItem: this.isFormItem()
            });
        }
    }

    /**
     * 是否验证通过
     * @method isValid
     * @return {boolean} 是否验证通过
     */
    isValid () {
        return !this.state.errorTip;
    }

    /**
     * 获取值
     * @method getValue
     * @returns {String} 字段的值
     */
    getValue () {
        if (this.item.getValue) {
            return this.item.getValue();
        }
    }

    /**
     * 设置值
     * @method setValue
     * @param value
     */
    setValue (value) {
        if (this.item.setValue) {
            this.item.setValue(value);
        }
    }

    /**
     * 获取表单名称
     * @method getName
     * @return {String}  表单名称
     */
    getName () {
        return this.props.name;
    }

    /**
     * 是否为表单元素
     * @method isFormItem
     * @return {boolean} 是否为表单元素
     */
    isFormItem () {
        return this._isFormItem;
    }

    /**
     * 设置错误信息
     * @method setErrorTip
     * @param msg {String} 错误信息
     */
    setErrorTip (msg) {
        if (this._isMounted) {
            this.setState({errorTip: msg});
            if (this.refs.tooltip) {
                this.refs.tooltip.setTitle(msg);
            }
        }
    }

    componentWillUnmount () {
        this._isMounted = false;

        if (this.props['itemUnBind'] && this.isFormItem()) {
            this.props['itemUnBind'](this.props.name);
        }
    }

    render () {
        let {
            label,
            type,
            layout,
            className,
            style,
            required,
            tipTheme,
            labelWidth,
            group,
            labelStyle
        } = this.props;
        //  console.log(layout);

        className = classNames('cm-form-group', className, {
            [`cm-form-group-${layout}`]: layout,
            [`cm-form-group-${type}`]: type,
            'cm-form-group-stick': group,
            'cm-form-group-invalid': this.state.errorTip
        });

        const customChildren = this._renderChildren();
        
        let items = null;
        if (!customChildren) {
            items = this._getControl(type);
        }

        const labelClass = classNames('cm-form-label', {
            'cm-form-label-required': required || this.required
        });

        if (type === 'hidden') {
            return (
                <div className={className} style={style}>
                    {items}
                    {customChildren}
                </div>
            );
        }

        let labelEle = null;
        if (label) {
            if (label === '&nbsp;') {
                label = ' ';
            }
            const ls = {};
            if (labelWidth != undefined) {
                ls['width'] = labelWidth;
            }
            Object.assign(ls, labelStyle || {});
            labelEle = <Label className={labelClass} style={ls}>{label}</Label>;
        }
        if (this.props.layout === 'stack-inline' && labelWidth && label) {
            style = Object.assign({paddingLeft: labelWidth}, style);
        }
        return (
            <div className={className} style={style}>
                {labelEle}
                <Tooltip theme={tipTheme} className={'error-tip'}
                    align={this._tipAlign} ref='tooltip' title={this.state.errorTip}>
                    {items}
                    {customChildren}
                </Tooltip>
            </div>
        );
    }
}

FormControl.COMPONENTS = {

};

/**
 * 注册空间到FormControl
 * @param component 空间类
 * @param type 空间类型
 * @param valueType 值类型
 */
FormControl.register = function (component, type, valueType) {
    if (type instanceof Array) {
        type.forEach((theType) => {
            if (theType === 'number' || theType === 'integer' || theType === 'tel') {
                valueType = 'number';
            }
            if (!FormControl.COMPONENTS[theType]) {
                FormControl.COMPONENTS[theType] = {
                    component,
                    valueType: valueType || 'string'
                };
            }
        });
    } else {
        if (!FormControl.COMPONENTS[type]) {
            FormControl.COMPONENTS[type] = {
                component,
                valueType: valueType || 'string'
            };
        }
    }
};

FormControl.propTypes = {
    /**
     * 类型
     * @attribute type
     * @type {String}
     */
    type: PropTypes.string,
    /**
     * 字段名称
     * @attribute name
     * @type {String}
     */
    name: PropTypes.string,
    /**
     * 布局
     * @attribute layout
     * @type {String}
     */
    layout: PropTypes.string,
    /**
     * 字段提示文字
     * @attribute label
     * @type {String}
     */
    label: PropTypes.any,
    /**
     * 文本框的提示
     * @attribute placeholder
     * @type {String}
     */
    placeholder: PropTypes.string,
    /**
     * 文本的宽度
     * @attribute labelGrid
     * @type {Object/Number}
     */
    labelGrid: PropTypes.oneOfType([PropTypes.string, PropTypes.number]),
    /**
     * 验证规则
     * @attribute rules
     * @type {Object}
     */
    rules: PropTypes.object,
    /**
     * 字段对应错误信息的提示语
     * @attribute messages
     * @type {Object}
     */
    messages: PropTypes.object,
    /**
     * 自定义class
     * @attribute className
     * @type {String}
     */
    className: PropTypes.string,
    /**
     * 自定义样式
     * @attribute style
     * @type {Object}
     */
    style: PropTypes.object,
    /**
     * 是否为表单元素  默认true 如为false则不会在表单中上传
     * @attribute isFormItem
     * @type {Boolean}
     */
    isFormItem: PropTypes.bool,
    /**
     * 是否必须的校验
     * @attribute required
     * @type {Boolean}
     */
    required: PropTypes.bool,
    /**
     * 验证后的回调
     * @attribute onValid
     * @type {Function}
     */
    onValid: PropTypes.func,
    /**
     * 值变化后的回调
     * @attribute onChange
     * @type {Function}
     */
    onChange: PropTypes.func,
    /**
     * 提示位置
     * @attribute tipAlign
     * @type {String}
     * @default right
     */
    tipAlign: PropTypes.string
};

export default FormControl;
