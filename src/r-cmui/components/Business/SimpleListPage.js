import React from 'react';
import Table from '../Table';
import Pagination from '../Pagination';
import Dom from '../utils/Dom';
import Events from '../utils/Events';
import fetch from '../utils/fetch';
import Spin from '../Spin';
import PropTypes from 'prop-types';
const {SVGSpin} = Spin;

class SimpleListPage extends React.Component {
    displayName = 'SimpleListPage';

    static defaultProps = {
        displayInfo: true,
        min: false,
        pageSize: 10,
        bordered: true,
        pagination: false,
        theme: 'default',
        autoSearch: false
    }

    static propTypes = {
        displayInfo: PropTypes.bool,
        min: PropTypes.bool,
        pagination: PropTypes.bool,
        bordered: PropTypes.bool,
        pageSize: PropTypes.number,
        theme: PropTypes.string,
        action: PropTypes.string,
        searchBtn: PropTypes.oneOfType([PropTypes.string,PropTypes.func]),
        searchParams: PropTypes.oneOfType([PropTypes.object,PropTypes.func]),
        afterRequest: PropTypes.func,
        condition: PropTypes.func,
        autoSearch: PropTypes.bool
    }

    state = {
        spinning: false
    };

    constructor (props) {
        super(props);
        this.sort = {};
    }

    /**
     * 获取查询条件
     * @param {any} page 
     * @param {any} pageSize 
     * @returns 
     * @memberof SimpleListPage
     */
    getSearchParams (page, pageSize) {
        let params = {
            pageNum: page,
            pageSize
        };

        const sort = [];
        for (const key in this.sort) {
            if (this.sort[key]) {
                sort.push(`${key} ${this.sort[key]}`);
            }
        }
        if (sort.length) {
            params['sort'] = sort.join(',');
        }
        
        this.getParamsByClass(params);
        this.getParamsByConditionForm(params);

        if (this.props.searchParams) {
            if (typeof this.props.searchParams === 'function') {
                params = Object.assign(params, this.props.searchParams());
            } else {
                params = Object.assign(params, this.props.searchParams);
            }
        }

        // 去掉参数值后面的空格
        for (const key in params) {
            if (typeof params[key] == 'string') {
                params[key] = params[key].trim();
            }
        }

        return params;
    }

    /**
     * 根据className来获取查询参数
     * @param {*} params 
     */
    getParamsByClass (params) {
        const searchClazz = this.props.searchClass || 'searchItem';
        const doms = Dom.queryAll(`.${searchClazz}`);
        if (doms && doms.length) {
            const els = Dom.dom(doms);
            els.each((el) => {
                const name = el.attr('name');
                let value = el.value();

                if (el.attr('type') === 'radio') {
                    value = Dom.queryAll(`input[name='${name}']:checked`).value;
                }
                if (value != '') {
                    params[name] = value;
                }
            });
        }
    }

    /**
     * 根据form表单获取查询参数
     * @param {*} params 
     */
    getParamsByConditionForm (params) {
        if (this.form) {
            const ps = this.form.getFormParams();
            for (const name in this.form.items) {
                const item = this.form.items[name];
                const clazz = item.ref.item.displayName;
                if (item.ref.item && clazz === 'DateRange') {
                    const v = ps[name];
                    delete ps[name];
                    if (v && v.length) {
                        ps[item.ref.item.props.startName] = v[0];
                        ps[item.ref.item.props.endName] = v[1];
                    } else {
                        ps[item.ref.item.props.startName] = '';
                        ps[item.ref.item.props.endName] = '';
                    }
                }
            }
            Object.assign(params, ps);
        }
    }

    /**
     * 查询
     */
    search = async (page, pageSize) => {
        try {
            this.setState({spinning: true});
            const ret = await fetch(this.props.action, this.getSearchParams(page, pageSize), 'GET', {
                fail: (error) => {
                    console.log(window.RCMUI_I18N['SimpleListPage.fetchDataError'], error);
                }
            });
            if (ret) {
                this.refs.table.setData(ret.data);
                if (this.refs.pagination) {
                    this.refs.pagination.update({total: ret.total, current: ret.pageNum, pageSize: ret.pageSize});
                }
                
                this.setState({spinning: false});
                
                if (this.props.afterRequest) {
                    this.props.afterRequest(ret.data);
                }
            }
        } catch (e) {
            console.log(e);
        }
    }

    clickSearch () {
        let pageSize = this.props.pageSize;
        if (this.refs.pagination) {
            pageSize = this.refs.pagination.state.pageSize;
        }
        this.search(1, pageSize);
    }

    componentDidMount () {
        const searchBtn = this.props.searchBtn || '#search-btn';
        let btn;
        if (searchBtn && typeof searchBtn === 'function') {
            btn = this.props.searchBtn();
        } else {
            btn = Dom.query(searchBtn);
        }

        if (btn) {
            if (typeof searchBtn === 'string') {
                Events.on(btn, 'click', () => {
                    this.clickSearch();
                });
            } else {
                btn.on('click', () => {
                    this.clickSearch();
                });
            }
        }


        if (this.props.condition) {
            if (typeof this.props.condition === 'function') {
                this.form = this.props.condition();
            } else {
                this.form = null;
                console.warning('condition 参数使用 function 参数');
            }
        }

        if (this.form) {
            if (this.form.displayName === 'Form') {
                const button = document.createElement('button');
                button.type = 'submit';
                button.style.display = 'none';
                this.form.refs.form.appendChild(button);
                this.form.beforeSubmit = () => {
                    this.clickSearch();
                    return false;
                };
                if (this.props.autoSearch) {
                    this.form.on('change', () => {
                        window.setTimeout(() => {
                            this.clickSearch();
                        }, 0);
                    });
                }
            }
        }

        this.search(1, this.props.pageSize);
    }

    refresh () {
        let pageSize = this.props.pageSize;
        let current = 1;
        if (this.refs.pagination) {
            pageSize = this.refs.pagination.state.pageSize;
            current = this.refs.pagination.state.current;
        }
        this.search(current, pageSize);
    }

    getData () {
        return this.refs.table.getData();
    }

    setData (data) {
        this.refs.table.setData(data);
    }

    getTable () {
        return this.refs.table;
    }
    
    getPagination () {
        return this.refs.pagination;
    }

    checkRows (ids) {
        ids.forEach(function (id) {
            this.checkRow(id);
        }, this);
    }

    checkRow (field, value) {
        this.refs.table.checkRow(field, value);
    }

    sortColumn = (column, type, sorts) => {
        this.sort = sorts;
        this.refresh();
    }

    render () {
        return (
            <SVGSpin spinning={this.state.spinning} className={this.props.className}>
                <Table ref='table' columns={this.props.columns} onSort={this.sortColumn} data={this.props.data || []} bordered={this.props.bordered} hover striped />

                <div className='cm-row'>
                    {
                        this.props.pagination ? <Pagination 
                            theme={this.props.theme}
                            min={this.props.min}
                            displayInfo={this.props.displayInfo}
                            className='pull-right'
                            ref='pagination'
                            current={1}
                            pageSize={this.props.pageSize}
                            total={0}
                            onChange={this.search}
                            onShowSizeChange={this.search} /> : null
                    }
                </div>
            </SVGSpin>
        );
    }
}

export default SimpleListPage;
