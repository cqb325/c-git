import React from 'react';
import BaseComponent from '../core/BaseComponent';
import UUID from '../utils/UUID';
import CheckBox from '../CheckBox/index';
import Dom from '../utils/Dom';
import PropTypes from 'prop-types';
import moment from 'moment';

/**
 * Row 类
 * @class Row
 * @extend BaseComponent
 */
class Row extends BaseComponent {
    static displayName = 'Row';

    static defaultProps = {
        data: [],
        identify: UUID.v4()
    };

    static contextTypes = {
        bindRow: PropTypes.func,
        unBindRow: PropTypes.func
    }

    constructor (props) {
        super(props);

        props.data._show = props.data._show || true;
        this.addState({
            data: props.data
        });

        this.identify = props.identify;
    }

    componentWillReceiveProps (nextProps) {
        if (nextProps.data !== this.props.data && nextProps.data !== this.state.data) {
            this.setState({
                data: nextProps.data
            });
        }
    }

    checkRow = (value, checked) => {
        this.props.table.refreshHeaderCheckBox(this.identify, checked);
    }

    check (checked) {
        if (this.refs.checkbox) {
            if (!this.refs.checkbox.isDisabled()) {
                this.refs.checkbox.setChecked(checked);
            }
        }
    }

    isChecked () {
        if (this.refs.checkbox) {
            return this.refs.checkbox.isChecked();
        } else {
            return false;
        }
    }

    getData () {
        return this.state.data;
    }

    componentDidMount () {
        if (this.refs.checkbox) {
            this.props.table.bindCheckBox(this.identify, {checkbox: this.refs.checkbox, row: this});
        }
        this.context.bindRow(this.identify, this);
    }

    componentWillUnmount () {
        if (this.refs.checkbox) {
            this.props.table.unBindCheckBox(this.identify);
        }
        this.context.unBindRow(this.identify);
    }

    renderData () {
        const data = this.state.data;
        const table = this.props.table;

        const columns = this.props.columns || [];
        return columns.map((col, index) => {
            if (col.type === 'checkbox') {
                return <td data-row={this.props.row} data-col={index} key={index}>
                    <CheckBox key={UUID.v4()} ref='checkbox' checked={false} onChange={this.checkRow} />
                </td>;
            }
            if (col.type === 'index') {
                return <td data-row={this.props.row} data-col={index} key={index}>{table._index++}</td>;
            }
            let text = data[col.name];
            text = this.formatData(text, col, data);

            let tip = '';
            if (React.isValidElement(text)) {
                if (col.tip) {
                    tip = text.props.children;
                }
            }

            if (col.tip) {
                tip = `${text}`;
                if (tip.charAt(0) === '<') {
                    tip = Dom.dom(tip).text();
                }
            }

            return <td style={{display: col.hide ? 'none' : ''}} data-row={this.props.row} data-col={index}
                key={index} title={tip}>{text}</td>;
        });
    }

    /**
     * 数据格式化
     * @param text
     * @param col
     * @param data
     * @returns {*}
     */
    formatData (text, col, data) {
        if (col.format) {
            let formatFun;
            if (typeof col.format === 'function') {
                formatFun = col.format;
            } else if (typeof col.format === 'string') {
                formatFun = Row.Formats[col.format];
            }
            if (formatFun) {
                text = formatFun(text, col, data);
            }
        }

        return text;
    }

    display (display) {
        this.ele.style.display = display ? '' : 'none';
    }

    render () {
        return (
            <tr data-row={this.props.row} ref={(f) => this.ele = f} style={{display: this.state.data._show ? '' : 'none'}}>
                {this.renderData()}
            </tr>
        );
    }
}

Row.Formats = {
    /**
     * 日期格式化
     * @param value
     * @param column
     * @param row
     * @returns {*}
     * @constructor
     */
    DateFormat (value) {
        if (value) {
            return moment(value).format('YYYY-MM-DD');
        } else {
            return '';
        }
    },

    /**
     * 日期时间格式化
     * @param value
     * @param column
     * @param row
     * @returns {*}
     * @constructor
     */
    DateTimeFormat (value) {
        if (value) {
            return moment(value).format('YYYY-MM-DD HH:mm:ss');
        } else {
            return '';
        }
    }
};

export default Row;
