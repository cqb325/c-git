import React from 'react';
import classNames from 'classnames';

class Row extends React.Component {
    displayName = 'Row';
    static displayName = 'Row';

    renderChildren (ele) {
        ele = ele || this;
        return React.Children.map(ele.props.children, (child) => {
            const componentName = (child && child.type && child.type.displayName) ? child.type.displayName : '';
            if (componentName === 'FormControl' || componentName === 'Row') {
                const props = Object.assign({
                    'itemBind': this.props['itemBind'],
                    'itemUnBind': this.props['itemUnBind']
                }, child.props);
                props.layout = props.layout ? props.layout : this.props.layout;
                props.labelWidth = props.labelWidth || this.props.labelWidth;
                if (componentName === 'FormControl') {
                    props.value = this.props.data ? this.props.data[props.name] : props.value;
                    if (props.value !== undefined && props.value !== null) {
                        if (typeof props.value !== 'object' && typeof props.value !== 'boolean') {
                            props.value = `${props.value}`;
                        }
                    } else {
                        props.value = '';
                    }
                }
                const changeHandler = props.onChange || function () {};
                const scope = this;
                props.onChange = function (value, selectItem, option) {
                    changeHandler.apply(this, [value, selectItem, option]);
                    if (scope.props.onChange) {
                        scope.props.onChange.apply(this, [value, selectItem, option]);
                    }
                };
                if (componentName === 'Row') {
                    props.data = this.props.data;
                }
                return React.cloneElement(child, props);
            } else if (componentName === 'Promote') {
                const props = Object.assign({
                    labelWidth: child.props.labelWidth || this.props.labelWidth
                }, child.props);
                return React.cloneElement(child, props);
            } else {
                if (child && child.props && child.props.children) {
                    return React.cloneElement(child, child.props, this.renderChildren(child));
                } else {
                    return child;
                }
            }
        });
    }

    render () {
        const className = classNames('cm-form-row', this.props.className);
        return <div className={className} style={this.props.style}>
            {this.renderChildren()}
        </div>;
    }
}

export default Row;
