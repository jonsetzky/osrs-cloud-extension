import React, { Component } from 'react';

class Field extends Component {
  render() {
    return (
      <div className="grid" key={this.props.value}>
        <div className="col">
          <span data-pr-tooltip={this.props.tooltip}>
            {this.props.label ?? 'N/A'}
          </span>
        </div>
        <div className="col">{this.props.value}</div>
      </div>
    );
  }
}

export default Field;
