import React from 'react';
import Row from './Row';
import Events from '../utils/Events';
import PropTypes from 'prop-types';

class Body extends React.Component {
    displayName = 'Body';

    static propTypes = {
        selectMode: PropTypes.string,
        onSelectRow: PropTypes.func,
        onScrollX: PropTypes.func,
        data: PropTypes.array,
        total: PropTypes.number,
        pageSize: PropTypes.number,
        pageNum: PropTypes.number,
        columns: PropTypes.array,
        onOpenEdit: PropTypes.func,
        onCellChange: PropTypes.func,
        onCheckedRow: PropTypes.func,
        editable: PropTypes.bool,
        headHeight: PropTypes.number
    };

    state = {
        spacerWidth: 0,
        spacerHeight: 0,
        start: 0,
        end: Math.min(this.props.pageSize * 2, this.props.total - 1)
    };

    lastSelectRows = [];
    indexRows = {};

    step = 50;

    saveRow = (index, f) => {
        if (f) {
            this.indexRows[index] = f;
            if (f.isSelect()) {
                this.lastSelectRows.push(f);
            }
        }
    }

    /**
     * 选中某行的时候
     * 按住 ctrl键或者shift键可以多选
     */
    onSelectRow = (row, ctrl, shift) => {
        if (this.props.selectMode === 'row') {
            if (ctrl) {
                this.lastSelectRows.push(row);
            } else if (shift) {
                if (this.lastSelectRows.length === 0) {
                    this.lastSelectRows.push(row);
                } else {
                    for (let i = 0; i < this.lastSelectRows.length; i++) {
                        this.lastSelectRows[i].unSelect();
                    }
                    const start = this.lastSelectRows[this.lastSelectRows.length - 1].getRowIndex();
                    const end = row.getRowIndex();
                    const arr = [start, end].sort();
                    
                    for (let i = arr[0]; i <= arr[1]; i++) {
                        this.lastSelectRows.push(this.indexRows[i]);
                        this.indexRows[i].select();
                    }
                }
            } else {
                if (this.lastSelectRows.length) {
                    for (let i = 0; i < this.lastSelectRows.length; i++) {
                        if (this.lastSelectRows[i] !== row) {
                            this.lastSelectRows[i].unSelect();
                        }
                    }
                }
                this.lastSelectRows = [row];
            }

            if (this.props.onSelectRow) {
                this.props.onSelectRow(row);
            }
        }
    }

    /**
     * 选中的rows
     */
    getSelectedRows () {
        return this.lastSelectRows;
    }

    renderRows () {
        if (!this.props.data) {
            return null;
        }
        let {start, end} = this.state;
        const data = this.props.data;

        if (data && data.length) {
            const showData = [];
            // 清空数据
            this.indexRows = {};
            this.lastSelectRows = [];
            end = Math.min(end, data.length - 1);
            for (let i = start; i <= end; i++) {
                const row = data[i];
                showData.push(
                    <Row key={row.id} 
                        columns={this.props.columns}
                        data={row}
                        rowIndex={i}
                        selectMode={this.props.selectMode}
                        ref={(f) => { this.saveRow(i, f); }}
                        onSelectRow={this.onSelectRow}
                        onCheckedRow={this.props.onCheckedRow}
                        onOpenEdit={this.props.onOpenEdit}
                        editable={this.props.editable}
                        onCellChange={this.props.onCellChange}
                    />
                );
            }
            return showData;
        } else {
            return null;
        }
    }

    renderBody () {
        const rows = this.renderRows();
        return <div className='cm-grid-body-wrap'>
            <div className='cm-grid-body' ref={(f) => this.body = f}>
                {rows}
            </div>
            {rows ? null : <div style={{textAlign: 'center'}}>{window.RCMUI_I18N['Grid.NoData']}</div>}
        </div>;
    }

    /**
     * 是否全选了
     */
    isAllChecked () {
        let checked = true;
        this.props.data.forEach((item) => {
            if (!item._disabled && !item._checked) {
                checked = false;
                return false;
            }
        });

        return checked;
    }

    componentWillUnmount () {
        this._isMounted = false;
        Events.off(this.content, 'mousewheel', this.wheel);
        Events.off(window, 'resize', this.windowResize);
        Events.off(this.box, 'scroll', this.spaceScroll);
    }

    componentDidMount () {
        this._isMounted = true;
        const h = this.getRowHeight();
        const totalHeight = h * this.props.total;
        this.setState({
            spacerHeight: totalHeight
        }, () => {
            this.updateScrollSize();
        });

        this.onSpacerScroll();

        Events.on(this.content, 'mousewheel', this.wheel);

        Events.on(window, 'resize', this.windowResize);
    }

    /**
     * 计算row的高度
     */
    getRowHeight () {
        const child = document.createElement('div');
        child.className = 'cm-grid-row';
        const cell = document.createElement('div');
        cell.className = 'cm-grid-cell';
        cell.innerHTML = '&nbsp;';
        child.appendChild(cell);
        if (this.body.firstChild) {
            this.body.insertBefore(child, this.body.firstChild);
        } else {
            this.body.appendChild(child);
        }
        const height = child.getBoundingClientRect().height;
        this.body.removeChild(child);
        return height;
    }

    windowResize = () => {
        this.updateScrollSize();
    }

    wheel = (e) => {
        if (e.preventDefault) {
            e.preventDefault();
        }
        if (e.stopPropagation) {
            e.stopPropagation();
        }
        const delta = e.wheelDelta;
        if (delta > 0) {
            this.scrollUp();
        } else {
            this.scrollDown();
        }
    }

    /**
     * 是否存在滚动条，存在重设content的长宽
     */
    updateScrollSize () {
        const spacerWidth = this.spacer.getBoundingClientRect().width;
        const spacerHeight = this.hspacer.getBoundingClientRect().height;
        const boxWidth = this.box.getBoundingClientRect().width;
        const boxHeight = this.hbox.getBoundingClientRect().height;
        let barwidth = 0;
        if (boxWidth > spacerWidth) {
            barwidth = boxWidth - spacerWidth;
            this.content.style.right = `${barwidth}px`;
        } else {
            this.content.style.right = '0';
        }
        if (boxHeight > spacerHeight) {
            this.content.style.bottom = `${boxHeight - spacerHeight}px`;
        } else {
            this.content.style.bottom = '0';
        }
    }

    updateSpaceSize () {
        const h = this.getRowHeight();
        const totalHeight = h * this.props.total;
        this.setState({
            spacerHeight: totalHeight
        }, () => {
            this.updateScrollSize();
        });
    }

    scrollUp () {
        let top = this.box.scrollTop;
        top = Math.max(top - this.step, 0);
        this.box.scrollTop = top;
        this.body.style.top = `${-top}px`;

        this.updateData();
    }

    scrollDown () {
        let top = this.box.scrollTop;
        top = top + this.step;

        this.box.scrollTop = top;
        top = this.box.scrollTop;
        this.body.style.top = `${-top}px`;

        this.updateData();
    }

    /**
     * 
     */
    updateData () {
        const h = this.getRowHeight();
        const top = this.box.scrollTop;
        let start = parseInt(top / h, 10);
        start = Math.max(0, start - this.props.pageSize);
        let end = start + this.props.pageSize * 2;
        end = Math.min(end, this.props.total - 1);

        this.body.style.paddingTop = `${start * h}px`;

        if (this._isMounted) {
            this.setState({
                start,
                end
            });
        }
    }

    onSpacerScroll () {
        Events.on(this.box, 'scroll', this.spaceScroll);
    }

    spaceScroll = () => {
        this.body.style.top = `${-this.box.scrollTop}px`;
        this.body.style.left = `${-this.box.scrollLeft}px`;
        this.updateData();
        if (this.props.onScrollX) {
            this.props.onScrollX(-this.box.scrollLeft);
        }
    }

    render () {
        let w = 0;
        this.props.columns.forEach((column) => {
            if (!column.hide) {
                w += column.width;
            }
        });
        return (
            <div className='cm-grid-scroll' style={{top: this.props.headHeight}}>
                <div className='cm-grid-scroll-box' ref={(f) => this.hbox = f}>
                    <div className='cm-grid-scroll-spacer-x' ref={(f) => this.hspacer = f} style={{width: w}}></div>
                </div>
                <div className='cm-grid-scroll-box' ref={(f) => this.box = f}>
                    <div className='cm-grid-scroll-spacer' ref={(f) => this.spacer = f} style={{height: this.state.spacerHeight}}></div>
                    <div style={{width: w, height: 1}}></div>
                </div>
                <div className='cm-grid-scroll-content' ref={(f) => this.content = f}>
                    {this.renderBody()}
                </div>
            </div>
        );
    }
}
export default Body;
