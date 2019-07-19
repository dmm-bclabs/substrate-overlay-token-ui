import React from 'react';
import { ReactiveComponent } from 'oo7-react';
import { u8aToString } from '@polkadot/util';

export class StringPretty extends ReactiveComponent {
	constructor () {
		super(["value", "default", "className"])
	}
	render () {
		if (this.ready() || this.props.default == null) {
			return (<span className={this.state.className} name={this.props.name}>
				{(this.props.prefix || '') + u8aToString(this.state.value) + (this.props.suffix || '')}
			</span>)
		} else {
			return <span>{this.props.default}</span>
		}
	}
}
