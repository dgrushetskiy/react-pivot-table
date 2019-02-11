import React, { Component } from 'react';
import ReactPivot from '../react-pivot/ReactPivot';
import data from '../data/data';
import './Demo.css';

export default class Demo extends Component{
    render() {
        const bank = data;
        const dimensions =
            [
                {value: 'firstName', title: 'Имя'},
                {value: 'lastName', title: 'Фамилия'},
                {value: 'state', title: 'Регион'},
                {value: (row)=> {
                        return row.transaction.business
                    }, title: 'Бизнес'},
                {value: (row)=> {
                        return row.transaction.type
                    }, title: 'Тип проводки'}
            ];
        const reduce = (row, memo)=>{
            memo.count = (memo.count || 0) + 1;
            memo.amountTotal = (memo.amountTotal || 0) + parseFloat(row.transaction.amount);
            return memo
        };

        const calculations =[
            {
                title: 'Количество',
                value: 'count',
                className: 'alignRight',
                sortBy: (row)=> { return row.count }
            },
            {
                title: 'Сумма',
                value: 'amountTotal',
                template: (val, row)=> {
                    return '$' + val.toFixed(2)
                },
                className: 'alignRight'
            },
            {
                title: 'Средняя сумма',
                value: (row)=> {
                    return row.amountTotal / row.count
                },
                template: (val, row)=> {
                    return '$' + val.toFixed(2)
                },
                className: 'alignRight'
            }
        ];
        return (
            <div className='demo'>
                <ReactPivot
                    rows={bank}
                    dimensions={dimensions}
                    calculations={calculations}
                    reduce={reduce}
                    activeDimensions={['Тип проводки']}
                    nPaginateRows={20} />
            </div>
        );
    }
}