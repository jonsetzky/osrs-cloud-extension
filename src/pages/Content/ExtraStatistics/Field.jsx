import React, { Component } from 'react';

class Field extends Component {
  render() {
    return (
      <div className="grid">
        <div className="col" style={{ display: 'table' }}>
          <span
            data-pr-tooltip={this.props.tooltip}
            style={{
              display: 'table-cell',
              verticalAlign: 'middle',
            }}
          >
            {this.props.label ?? 'N/A'}
          </span>
        </div>
        <div
          className="col"
          style={{
            color: (() => {
              switch (this.props.color) {
                case 'green':
                  return 'rgb(134, 201, 137)';
                case 'red':
                  return 'rgb(240, 98, 146)';
                default:
                  return undefined;
              }
            })(),
          }}
        >
          {this.props.value}
        </div>
      </div>
    );
  }
}

export default Field;
