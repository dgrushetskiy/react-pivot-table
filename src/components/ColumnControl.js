import React, { Component } from 'react';
import lodashWithout from "lodash/without";

//const _ = { without: lodash };

class ColumnControl extends Component{
    static defaultProps ={
        hiddenColumns: [],
        onChange:  ()=> {}
    };
    constructor(props){
        super(props);
        this.showColumn = this.showColumn.bind(this);
    }
    render(){
        return (
            <div className='reactPivot-columnControl'>
                { !this.props.hiddenColumns.length ? '' :
                    <select value={''} onChange={this.showColumn}>
                        <option value={''}>Скрытые колонки</option>
                        { this.props.hiddenColumns.map((column)=> {
                            return <option key={column}>{column}</option>
                        })}
                    </select>
                }
            </div>
        )
    }

    showColumn(evt){
        const col = evt.target.value;
        console.log(col);
        const hidden =lodashWithout(this.props.hiddenColumns, col);
        //console.log(this.props.hiddenColumns);
        this.props.onChange(hidden);
    }
}


export default ColumnControl;