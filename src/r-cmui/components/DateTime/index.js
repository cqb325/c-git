/**
 * @author cqb 2016-04-05.
 * @module Datetime
 */
import React from 'react';
import classNames from 'classnames';
import ReactDOM from 'react-dom';
import BaseComponent from '../core/BaseComponent';
import PropTypes from 'prop-types';
import moment from 'moment';
import Dom from '../utils/Dom';
import clickAway from '../utils/ClickAway';
import Date from './Date';
import FormControl from '../FormControl/index';
import grids from '../utils/grids';
const getGrid = grids.getGrid;
import velocity from '../../lib/velocity';
import omit from 'omit.js';
import './DateTime.less';

/**
 * Datetime 类
 * @class Datetime
 * @constructor
 * @extend BaseComponent
 */
class Datetime extends BaseComponent {
    constructor (props) {
        super(props);

        this.addState({
            visibility: false,
            value: props.value
        });
    }

    /**
     * ClickAway 点击别的地方的回调
     * @method componentClickAway
     */
    componentClickAway () {
        this.hide();
    }

    /**
     * 显示操作
     * @method show
     */
    show () {
        if (this.props.readOnly || this.props.disabled) {
            return;
        }

        if (this.state.visibility) {
            return false;
        }

        const ele = ReactDOM.findDOMNode(this.refs.datePicker);
        Dom.dom(ele).show();
        const container = Dom.closest(ele, '.cm-datetime');
        const offset = Dom.getOuterHeight(ele) + 5;
        const dropup = Dom.overView(container, offset);

        Dom.withoutTransition(container, () => {
            this.setState({ dropup });
            Dom.dom(ele).hide();
        });

        velocity(ele, 'fadeIn', {duration: 500});

        if (!this.state.visibility) {
            this.setState({ visibility: true });
            setTimeout(() => {
                const dateComp = this.refs.date;
                dateComp.show();

                this.bindClickAway();
            }, 0);
        }
    }

    /**
     * 隐藏操作
     * @method show
     * @returns {boolean}
     */
    hide () {
        const ele = ReactDOM.findDOMNode(this.refs.datePicker);
        const dateComp = this.refs.date;
        velocity(ele, 'fadeOut', {
            delay: 100,
            duration: 200,
            complete: () => {
                if (dateComp.getStage() === 0 && dateComp.minStage === 0) {
                    dateComp.setStage(1);
                }
                this.setState({ visibility: false });
                this.unbindClickAway();
            }
        });
    }

    /**
     * 设置值
     * @method setValue
     * @param value {String} 当前值
     */
    setValue (value) {
        this.setState({
            value
        });
        const dateComp = this.refs.date;
        dateComp.setValue(value);
    }

    /**
     * 获取值
     * @method getValue
     * @return {String} 当前值
     */
    getValue () {
        return this.state.value;
    }

    _selectDate (value, date) {
        this.setState({
            value
        });

        if (this.props.onSelectDate) {
            this.props.onSelectDate(value, date);
        }

        this.emit('selectDate', value, date);


        if (this.props.onChange) {
            this.props.onChange(value, date);
        }

        this.emit('change', value, date);
    }


    componentDidMount () {
        const dateComp = this.refs.date;

        dateComp.on('hide', () => {
            this.hide();
        });

        dateComp.on('selectTime', (value) => {
            this.emit('selectTime', value);
        });
        dateComp.on('selectMonth', (value) => {
            this.emit('selectMonth', value);
        });
        dateComp.on('selectYear', (value) => {
            this.emit('selectYear', value);
        });
    }

    componentWillReceiveProps (nextProps) {
        if (nextProps.value !== this.props.value && nextProps.value !== this.state.value) {
            this.setValue(nextProps.value);
        }
    }

    getReference () {
        return this.refs.date;
    }

    /**
     * 渲染组件结构
     * @method render
     * @returns {XML}
     */
    render () {
        let {className, grid, readOnly, disabled, name, placeholder, style} = this.props;
        className = classNames(
            className,
            'cm-datetime',
            this.state.theme,
            getGrid(grid),
            {
                disabled,
                active: this.state.active && !readOnly,
                dropup: this.state.dropup
            }
        );

        let text = this.state.value
            ? this.state.value
            : '';
        text = text
            ? (<span className='date-text'>
                <input type='hidden' name={name} defaultValue={this.state.value} />{text}
            </span>)
            : (<span className='date-text'>
                <input type='hidden' name={name} defaultValue={this.state.value} />{placeholder}&nbsp;
            </span>);

        const others = omit(this.props, ['className', 'grid', 'readOnly', 'disabled', 'style']);
        return (
            <div ref='datetime' onClick={this.show.bind(this)} className={className} style={style || {}}>
                {text}
                <i className='fa fa-calendar' />
                <div className='cm-datetime-wrap' ref='datePicker'>
                    <Date ref='date' {...others} onSelectDate={this._selectDate.bind(this)} />
                </div>
            </div>
        );
    }
}

clickAway(Datetime);

Datetime.propTypes = {
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
     * 禁用
     * @attribute disabled
     * @type {Boolean}
     */
    disabled: PropTypes.bool,
    /**
     * 只读
     * @attribute readOnly
     * @type {Boolean}
     */
    readOnly: PropTypes.bool,
    /**
     * 默认值
     * @attribute value
     * @type {string/moment}
     */
    value: PropTypes.oneOfType([PropTypes.string, PropTypes.instanceOf(moment)]),
    /**
     * 显示状态 'datetime','date','time'
     * @attribute view
     * @type {string}
     */
    view: PropTypes.oneOf(['datetime', 'date', 'time']),
    /**
     * 格式化
     * @attribute format
     * @type {string}
     */
    format: PropTypes.string,
    /**
     * 开始时间
     * @attribute startDate
     * @type {string/moment}
     */
    startDate: PropTypes.oneOfType([PropTypes.string, PropTypes.instanceOf(moment)]),
    /**
     * 结束时间
     * @attribute endDate
     * @type {string/moment}
     */
    endDate: PropTypes.oneOfType([PropTypes.string, PropTypes.instanceOf(moment)])
};

FormControl.register(Datetime, 'datetime');

export default Datetime;
