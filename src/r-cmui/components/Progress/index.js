/**
 * @author cqb 2016-05-05.
 * @module Progress
 */

import React from 'react';
import classNames from 'classnames';
import BaseComponent from '../core/BaseComponent';
import FontIcon from '../FontIcon/index';
import grids from '../utils/grids';
import FormControl from '../FormControl';
const getGrid = grids.getGrid;
import './Progress.less';

/**
 * Progress 类
 * @class Progress
 * @constructor
 * @extend BaseComponent
 */
class Progress extends BaseComponent {
    static displayName = 'Progress';
    static defaultProps = {
        value: 0,
        min: 0,
        max: 100,
        showPercent: true,
        strokeWidth: 10,
        type: 'line',
        radius: 60,
        theme: 'primary'
    };
    constructor (props) {
        super(props);

        this.addState({
            value: this.validValue(props.value),
            min: parseFloat(props.min) || 0,
            max: parseFloat(props.max) || 100
        });
    }

    /**
     * 取得正確的v值
     * 
     * @param {any} v 
     * @returns 
     * @memberof Progress
     */
    validValue (v) {
        v = parseFloat(v);
        if (this.props.min != undefined) {
            v = Math.max(v, this.props.min);
        }
        if (this.props.max != undefined) {
            v = Math.min(v, this.props.max);
        }

        return v;
    }

    /**
     * 更新值
     * @param  {[type]} value [description]
     * @return {[type]}       [description]
     */
    update (value) {
        if (this._isMounted) {
            this.setState({
                value
            });
        }
    }

    /**
     * 获取当前值
     * @return {[type]} [description]
     */
    getValue () {
        return this.state.value;
    }

    /**
     * 设置当前值
     * @param {[type]} value [description]
     */
    setValue (value) {
        this.update(this.validValue(value));
    }

    /**
     * 获取最大值
     * @return {[type]} [description]
     */
    getMax () {
        return this.state.max;
    }

    /**
     * 获取最小值
     * @return {[type]} [description]
     */
    getMin () {
        return this.state.min;
    }

    componentDidMount () {
        this._isMounted = true;
    }

    componentWillUnmount () {
        this._isMounted = false;
    }

    /**
     * 绘制圆形
     * @returns {XML}
     */
    renderCircle () {
        const colorMap = {
            primary: '#20A0FF',
            danger: '#FF4949',
            success: '#13CE66',
            warning: '#F7BA2A'
        };
        const r = this.props.radius;
        // 计算当前角度对应的弧度值
        const rad = 2 * Math.PI;

        // 极坐标转换成直角坐标
        const x = (Math.sin(rad) * r).toFixed(2);
        const y = -(Math.cos(rad) * r).toFixed(2);

        // path 属性 A 61 61 0 1 1 -0 61 A 61 61 0 1 1 -0 -61
        const descriptions = ['M', 0, -r, 'A', r, r, 0, 1, 1, x, -y, 'A', r, r, 0, 1, 1, x, y];

        const strokeWidth = this.props.strokeWidth;
        const tx = r + strokeWidth / 2;

        const percent = (this.state.value - this.state.min) / (this.state.max - this.state.min);
        const dd = rad * r;
        const offset = dd * (1 - percent);
        let status = this.props.status;
        if (this.state.value == this.state.max) {
            status = 'finished';
        }

        let color = status === 'finished' ? 'success' : this.state.theme;
        if (status === 'exception') {
            color = 'danger';
        }
        return (
            <svg width='100%' height='100%' version='1.1'
                xmlns='http://www.w3.org/2000/svg' style={{width: 2 * r + strokeWidth, height: 2 * r + strokeWidth}}>
                <circle cx={tx} cy={tx} r={r} stroke='#f3f3f3'
                    strokeWidth={strokeWidth} fillOpacity='0' />
                <path className='cm-progress-bar-path'
                    d={descriptions.join(' ')}
                    strokeLinecap='round'
                    strokeWidth={strokeWidth}
                    fillOpacity='0'
                    stroke={colorMap[color]}
                    transform={`translate(${tx},${tx})`}
                    style={{strokeDashoffset: offset, strokeDasharray: dd}}
                />
            </svg>
        );
    }

    componentWillReceiveProps (nextProps) {
        const value = nextProps.value;
        if (value !== this.props.value && value !== this.state.value) {
            this.setState({ value });
        }
    }

    render () {
        let {className, style, grid, showPercent, active, status, type} = this.props;
        if (this.state.value == this.state.max) {
            status = 'finished';
        }
        className = classNames('cm-progress', className, getGrid(grid), this.state.theme, {
            'cm-progress-active': active,
            'cm-progress-show-info': showPercent,
            [`cm-progress-${status}`]: status,
            [`cm-progress-${type}`]: type
        });
        const current = parseInt((this.state.value - this.state.min) / (this.state.max - this.state.min) * 100, 10);
        const width = `${current}%`;
        let percent = showPercent ? width : null;

        if (status === 'finished' && showPercent) {
            const icon = type === 'circle' ? 'check' : 'check-circle';
            percent = <FontIcon icon={icon} />;
        }
        if (status === 'exception' && showPercent) {
            const icon = type === 'circle' ? 'close' : 'times-circle';
            percent = <FontIcon icon={icon} />;
        }

        if (this.props.format && typeof this.props.format === 'function') {
            percent = this.props.format(current, this.state.value, this.state.min, this.state.max);
        }

        let bar = null;
        let fontSize = 25;
        if (type === 'circle') {
            bar = this.renderCircle();
            fontSize = fontSize * this.props.radius / 60;
        } else {
            bar = <div className='cm-progress-bar' style={{width, height: this.props.strokeWidth}} />;
        }
        return (
            <div className={className} style={style}>
                <div className='cm-progress-outer'>
                    <div className='cm-progress-inner'>
                        {bar}
                        {type === 'circle' ? <span className='cm-progress-info' style={{fontSize}}>
                            {percent}
                        </span> : null}
                    </div>
                </div>
                {(type === 'circle' || !showPercent) ? null : <span className='cm-progress-info'>{percent}</span>}
            </div>
        );
    }
}

FormControl.register(Progress, 'progress');

export default Progress;
