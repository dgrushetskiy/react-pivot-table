import React, { Component } from 'react';
import { partial } from '../components/partial';
import {download} from '../components/download';
import {getValue} from '../components/get-value';
import PivotTable from '../components/PivotTable';
import Dimensions from '../components/Dimensions';
import ColumnControl from '../components/ColumnControl';
import DataFrame from "dataframe";
import Emitter from "wildemitter";
import lodashFilter from 'lodash/filter';
import lodashMap from 'lodash/map';
import lodashFind from 'lodash/find';
// var _ = {
//     filter: require('lodash/filter'),
//     map: require('lodash/map'),
//     find: require('lodash/find')
// };

class ReactPivot extends Component{
    constructor(props){
        super(props);
        const allDimensions = this.props.dimensions;
        const activeDimensions =  lodashFilter(this.props.activeDimensions,  (title)=> {
            return lodashFind(allDimensions, (col)=> {
                return col.title === title
            })
        });
        this.state = {
            dimensions: activeDimensions,
            calculations: {},
            sortBy: this.props.sortBy,
            sortDir: this.props.sortDir,
            hiddenColumns: this.props.hiddenColumns,
            solo: this.props.solo,
            rows: []
        };
        this.setDimensions = this.setDimensions.bind(this);
        this.hideColumn = this.hideColumn.bind(this);
        this.getColumns = this.getColumns.bind(this);
        this.updateRows = this.updateRows.bind(this);
        this.setHiddenColumns = this.setHiddenColumns.bind(this);
        this.setSort = this.setSort.bind(this);
        this.setSolo = this.setSolo.bind(this);
        this.clearSolo = this.clearSolo.bind(this);
        this.downloadCSV = this.downloadCSV.bind(this);


    }
    componentWillMount(){
        if (this.props.defaultStyles) this.loadStyles();
        console.log("this.props.dimension",this.props.dimensions);
        this.dataFrame = DataFrame({
            rows: this.props.rows,
            dimensions: this.props.dimensions,
            reduce: this.props.reduce
        });

        this.updateRows()
    }

    componentWillReceiveProps(newProps){
        if(newProps.hiddenColumns !== this.props.hiddenColumns) {
            this.setHiddenColumns(newProps.hiddenColumns);
        }

        if(newProps.rows !== this.props.rows) {
            this.dataFrame = DataFrame({
                rows: newProps.rows,
                dimensions: this.props.dimensions,
                reduce: this.props.reduce
            });

            this.updateRows()
        }
    }
    getColumns(){
        const self = this;
        const columns = [];

        this.state.dimensions.forEach((title)=> {
            let d =  lodashFind(self.props.dimensions, (col)=> {
                return col.title === title
            });

            columns.push({
                type: 'dimension', title: d.title, value: d.value,
                className: d.className, template: d.template
            })
        });

        this.props.calculations.forEach((c)=> {
            if (self.state.hiddenColumns.indexOf(c.title) >= 0) return

            columns.push({
                type:'calculation', title: c.title, template: c.template,
                value: c.value, className: c.className
            })
        });

        return columns
    }
    render(){
        const self = this;
        return (
            <div className='reactPivot'>

                { this.props.hideDimensionFilter ? '' :
                    <Dimensions
                        dimensions={this.props.dimensions}
                        selectedDimensions={this.state.dimensions}
                        onChange={this.setDimensions} />
                }

                <ColumnControl
                    hiddenColumns={this.state.hiddenColumns}
                    onChange={this.setHiddenColumns} />

                <div className="reactPivot-csvExport">
                    <button onClick={partial(this.downloadCSV, this.state.rows)}>
                        Выгрузка CSV
                    </button>
                </div>

                { Object.keys(this.state.solo).map( (title)=> {
                    let value = self.state.solo[title];

                    return (
                        <div
                            style={{clear: 'both'}}
                            className='reactPivot-soloDisplay'
                            key={'solo-' + title} >
                            <span
                                className='reactPivot-clearSolo'
                                onClick={partial(self.clearSolo, title)} >
                                &times;
                            </span>
                            {title}: {value}
                        </div>
                    )
                }) }

                <PivotTable
                    columns={this.getColumns()}
                    rows={this.state.rows}
                    sortBy={this.state.sortBy}
                    sortDir={this.state.sortDir}
                    onSort={this.setSort}
                    onColumnHide={this.hideColumn}
                    nPaginateRows={this.props.nPaginateRows}
                    onSolo={this.setSolo}
                    soloText={this.props.soloText}
                />

            </div>
        )
    }

    updateRows(){
        const columns = this.getColumns();

        const sortByTitle = this.state.sortBy;
        const sortCol = lodashFind(columns, (col)=> {
            return col.title === sortByTitle
        }) || {};
        let sortBy = sortCol.type === 'dimension' ? sortCol.title : sortCol.value;
        let sortDir = this.state.sortDir;

        const calcOpts = {
            dimensions: this.state.dimensions,
            sortBy: sortBy,
            sortDir: sortDir,
            compact: this.props.compact
        };

        const filter = this.state.solo;
        if (filter) {
            calcOpts.filter = (dVals)=> {
                let pass = true;
                Object.keys(filter).forEach( (title)=> {
                    if (dVals[title] !== filter[title]) pass = false
                });
                return pass
            }
        }
        console.log("calcOpts",calcOpts);
        const rows = this.dataFrame.calculate(calcOpts);
        this.setState({rows: rows});
        this.props.onData(rows)
    }
    setDimensions(updatedDimensions){
        this.props.eventBus.emit('activeDimensions', updatedDimensions);
        this.setState({dimensions: updatedDimensions});
        setTimeout(this.updateRows, 0)
    }

    setHiddenColumns(hidden){
        this.props.eventBus.emit('hiddenColumns', hidden);
        this.setState({hiddenColumns: hidden});
        setTimeout(this.updateRows, 0)
    }

    setSort(cTitle){
        let sortBy = this.state.sortBy;
        let sortDir = this.state.sortDir;
        if (sortBy === cTitle) {
            sortDir = (sortDir === 'asc') ? 'desc' : 'asc'
        } else {
            sortBy = cTitle;
            sortDir = 'asc'
        }

        this.props.eventBus.emit('sortBy', sortBy);
        this.props.eventBus.emit('sortDir', sortDir);
        this.setState({sortBy: sortBy, sortDir: sortDir});
        setTimeout(this.updateRows, 0)
    }

    setSolo(solo){
        const newSolo = this.state.solo;
        newSolo[solo.title] = solo.value;
        this.props.eventBus.emit('solo', newSolo);
        this.setState({solo: newSolo });
        setTimeout(this.updateRows, 0)
    }

    clearSolo(title){
        const oldSolo = this.state.solo;
        const newSolo = {};
        Object.keys(oldSolo).forEach( (k)=> {
            if (k !== title) newSolo[k] = oldSolo[k]
        });
        this.props.eventBus.emit('solo', newSolo);
        this.setState({solo: newSolo});
        setTimeout(this.updateRows, 0)
    }

    hideColumn(cTitle){
        const hidden = this.state.hiddenColumns.concat([cTitle]);
        this.setHiddenColumns(hidden);
        setTimeout(this.updateRows, 0)
    }

    downloadCSV(rows){
        const self = this;

        const columns = this.getColumns();

        let csv =lodashMap(columns, 'title')
            .map(JSON.stringify.bind(JSON))
            .join(',') + '\n';

        const maxLevel = this.state.dimensions.length - 1;
        const excludeSummary = this.props.excludeSummaryFromExport;

        rows.forEach((row)=> {
            let val='';
            if (excludeSummary && (row._level < maxLevel)) return;

            const values = columns.map((col)=> {

                if (col.type === 'dimension') {
                    val = row[col.title]
                } else {
                     val = getValue(col, row)
                }

                if (col.template && self.props.csvTemplateFormat) {
                    val = col.template(val)
                }
                console.log(val);
                return JSON.stringify(val)
            });
            csv += values.join(',') + '\n'
        });

        download(csv, this.props.csvDownloadFileName, 'text/csv')
    }

    loadStyles(){
        require('./style.css');
    }
}
ReactPivot.defaultProps = {
    rows: [],
    dimensions: [],
    activeDimensions: [],
    reduce: ()=> {},
    tableClassName: '',
    csvDownloadFileName: 'table.csv',
    csvTemplateFormat: false,
    defaultStyles: true,
    nPaginateRows: 25,
    solo: {},
    hiddenColumns: [],
    sortBy: null,
    sortDir: 'asc',
    eventBus: new Emitter(),
    compact: false,
    excludeSummaryFromExport: false,
    onData: ()=> {},
    soloText: "solo"
};

export default ReactPivot;