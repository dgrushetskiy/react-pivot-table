import React, { Component } from 'react';
import {partial} from './partial';
import lodashCompact from "lodash/compact";

class Dimensions extends Component{
    static defaultProps={
        dimensions: [],
        selectedDimensions: [],
        onChange: function () {}
    };
    constructor(props){
        super(props);
        this.toggleDimension = this.toggleDimension.bind(this);
        this.renderDimension = this.renderDimension.bind(this);
    }
    renderDimension(selectedDimension, i){
        return (
            <select
                value={selectedDimension}
                onChange={partial(this.toggleDimension,i)}
                key={selectedDimension} >
                <option/>
                {this.props.dimensions.map(function(dimension) {
                    return (
                        <option
                            value={dimension.title}
                            key={dimension.title} >
                            {dimension.title}
                        </option>
                    )
                })}
            </select>
        )
    }

    toggleDimension(iDimension, evt){

        const dimension = evt.target.value;
        const dimensions = this.props.selectedDimensions;

        const curIdx = dimensions.indexOf(dimension);
        if (curIdx >= 0) dimensions[curIdx] = null;
        dimensions[iDimension] = dimension;

        const updatedDimensions = lodashCompact(dimensions);

        this.props.onChange(updatedDimensions)
    }

    render(){

        const self = this;
        const selectedDimensions = this.props.selectedDimensions;
        const nSelected = selectedDimensions.length;

        return (
            <div className="reactPivot-dimensions">
                {selectedDimensions.map(this.renderDimension)}

                <select value={''} onChange={partial(self.toggleDimension, nSelected)}>
                    <option value={''}>Раздел...</option>
                    {self.props.dimensions.map(function(dimension) {
                        return <option key={dimension.title}>{dimension.title}</option>
                    })}
                </select>
            </div>
        )
    }
}

export default Dimensions;