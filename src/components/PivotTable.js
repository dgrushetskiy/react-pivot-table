import React, { Component } from 'react';
import {partial} from './partial';
import {getValue} from  './get-value';

import lodashRange from "lodash/range";

//const _ = {range: lodash};

class PivotTable extends Component{
    static defaultProps={
        columns: [],
        rows: [],
        sortBy: null,
        sortDir: 'asc',
        onSort: function () {},
        onSolo: function () {},
        onColumnHide: function () {}
    };
    constructor(props){
        super(props);
        this.state={
            paginatePage: 0
        };
        this.setPaginatePage = this.setPaginatePage.bind(this)
    }
    render(){
        let results = this.props.rows;
        let paginatedResults = this.paginate(results);

        const tHead = this.renderTableHead(this.props.columns);
        const tBody = this.renderTableBody(this.props.columns, paginatedResults.rows);


        return (
            <div className='reactPivot-results'>
                <table className={this.props.tableClassName}>
                    {tHead}
                    {tBody}
                </table>

                {this.renderPagination(paginatedResults)}
            </div>
        )
    }

    renderTableHead(columns){
        const self = this;
        const sortBy = this.props.sortBy;
        const sortDir =  this.props.sortDir;

        return (
            <thead>
            <tr>
                { columns.map(function(col) {
                    let className = col.className;
                    if (col.title === sortBy) className += '' + sortDir;

                    let hide = '';
                    if (col.type !== 'dimension') hide = (
                        <span className='reactPivot-hideColumn'
                              onClick={partial(self.props.onColumnHide, col.title)}>
                    &times;
                  </span>
                    );

                    return (
                        <th className={className}
                            onClick={partial(self.props.onSort, col.title)}
                            style={{cursor: 'pointer'}}
                            key={col.title}>

                            {hide}
                            {col.title}
                        </th>
                    )
                })}
            </tr>
            </thead>
        )
    }

    renderTableBody(columns, rows){
        const self = this;

        return (
            <tbody>
            {rows.map(function(row) {
                return (
                    <tr key={row._key} className={"reactPivot-level-" + row._level}>
                        {columns.map(function(col, i) {
                            if (i < row._level) return <td key={i} className='reactPivot-indent' />;

                            return self.renderCell(col, row)
                        })}
                    </tr>
                )

            })}
            </tbody>
        )
    }

    renderCell(col, row){
        let value;
        let text;
        let dimensionExists = false;
        if (col.type === 'dimension') {
           value = row[col.title];
           text = value;
          dimensionExists = (typeof value) !== 'undefined';
            if (col.template && dimensionExists) text = col.template(value, row)
        } else {
           value = getValue(col, row);
           text = value;
            if (col.template) text = col.template(value, row)
        }
        let solo;
        if (dimensionExists) {
             solo = (
                <span className='reactPivot-solo'>
                <a style={{cursor: 'pointer'}}
                   onClick={partial(this.props.onSolo, {
                       title: col.title,
                       value: value
                   })}>solo</a>
              </span>
            )
        }

        return(
            <td className={col.className}
                key={[col.title, row.key].join('\xff')}
                title={col.title}>
                <span dangerouslySetInnerHTML={{__html: text || ''}}></span> {solo}
            </td>
        )
    }

    renderPagination(pagination){
        const self = this;
        const nPaginatePages = pagination.nPages;
        const paginatePage = pagination.curPage;

        if (nPaginatePages === 1) return '';

        return (
            <div className='reactPivot-paginate'>
                {lodashRange(0, nPaginatePages).map(function(n) {
                    let c = 'reactPivot-pageNumber';
                    if (n === paginatePage) c += ' is-selected';
                    return (
                        <span className={c} key={n}>
                  <a onClick={partial(self.setPaginatePage, n)}>{n+1}</a>
                </span>
                    )
                })}
            </div>
        )
    }

    paginate(results){
        if (results.length <= 0) return {rows: results, nPages: 1, curPage: 0};

        let paginatePage = this.state.paginatePage;
        let nPaginateRows = this.props.nPaginateRows;
        if (!nPaginateRows || !isFinite(nPaginateRows)) nPaginateRows = results.length;

        let nPaginatePages = Math.ceil(results.length / nPaginateRows);
        if (paginatePage >= nPaginatePages) paginatePage = nPaginatePages - 1;

        let iBoundaryRow = paginatePage * nPaginateRows;

        let boundaryLevel = results[iBoundaryRow]._level;
        let parentRows = [];
        if (boundaryLevel > 0) {
            for (let i = iBoundaryRow-1; i >= 0; i--) {
                if (results[i]._level < boundaryLevel) {
                    parentRows.unshift(results[i]);
                    boundaryLevel = results[i]._level
                }
                if (results[i._level === 9]) break
            }
        }

        let iEnd = iBoundaryRow + nPaginateRows;
        let rows = parentRows.concat(results.slice(iBoundaryRow, iEnd));

        return {rows: rows, nPages: nPaginatePages, curPage: paginatePage}
    }

    setPaginatePage(nPage){
        this.setState({paginatePage: nPage})
    }
}
export default PivotTable