import React from 'react';
require('semantic-ui-css/semantic.min.css');
import { Icon, Accordion, List, Checkbox, Label, Header, Segment, Divider, Button } from 'semantic-ui-react';
import { Bond, TransformBond, TimeBond } from 'oo7';
import { ReactiveComponent, If, Rspan } from 'oo7-react';
import {
    calls, runtime, chain, runtimeUp, ss58Decode, ss58Encode, pretty,
    addressBook, secretStore, metadata, nodeService, bytesToHex, hexToBytes, AccountId,
    setNodeUri
} from 'oo7-substrate';
import Identicon from 'polkadot-identicon';
import { AccountIdBond, SignerBond } from './AccountIdBond.jsx';
import { BalanceBond } from './BalanceBond.jsx';
import { InputBond } from './InputBond.jsx';
import { TransactButton } from './TransactButton.jsx';
import { FileUploadBond } from './FileUploadBond.jsx';
import { StakingStatusLabel } from './StakingStatusLabel';
import { WalletList, SecretItem } from './WalletList';
import { AddressBookList } from './AddressBookList';
import { TransformBondButton } from './TransformBondButton';
import { Pretty } from './Pretty';
import { StringPretty } from './StringPretty';
import { stringToU8a } from '@polkadot/util';

// Override oo7-substrate system
let system = (() => {
    let time = new TimeBond
    let name = new TransformBond(() => nodeService().request('system_name'), [], [time]).subscriptable()
    let version = new TransformBond(() => nodeService().request('system_version'), [], [time]).subscriptable()
    let chain = new TransformBond(() => nodeService().request('system_chain'), [], [time]).subscriptable()
    let properties = new TransformBond(() => nodeService().request('system_properties'), [], [time]).subscriptable()
    let health = new TransformBond(() => nodeService().request('system_health'), [], [time]).subscriptable()
    let peers = new TransformBond(() => nodeService().request('system_peers'), [], [time]).subscriptable()
    let pendingTransactions = new TransformBond(() => nodeService().request('author_pendingExtrinsics'), [], [time]).subscriptable()
    return { name, version, chain, properties, pendingTransactions, health, peers }
})()

var defaultNode = localStorage.getItem('wsNode') || process.env.NODE || 'ws://127.0.0.1:9944/';
setNodeUri([defaultNode, 'wss://substrate-rpc.parity.io/']);

export class App extends ReactiveComponent {
    constructor() {
        super([], { ensureRuntime: runtimeUp })

        addCodecTransform('Digest', "u128")
        addCodecTransform('TokenBalance', 'u128');
        addCodecTransform('ChildChainId', 'u32');

        // For debug only.
        window.runtime = runtime;
        window.secretStore = secretStore;
        window.addressBook = addressBook;
        window.chain = chain;
        window.calls = calls;
        window.system = system;
        window.that = this;
        window.metadata = metadata;
    }

    readyRender() {
        return (<div>
            <Heading />
            <NodeSegment />
            <Divider hidden />
            <If condition={typeof runtime.token != "undefined"} then={
                <TokenSegment
                    init={runtime.token ? runtime.token.init: {}}
                    root={runtime.token ? runtime.token.root : {}} />
            } />
            <If condition={typeof runtime.token != "undefined"} then={
                <Divider hidden />
            } />
            <WalletSegment />
            <Divider hidden />
            <AddressBookSegment />
            <Divider hidden />
            <FundingSegment />
            <Divider hidden />
            <UpgradeSegment />
            <Divider hidden />
            <PokeSegment />
            <Divider hidden />
            <TransactionsSegment />
        </div>);
    }
}

class Heading extends React.Component {
    render() {
        return <div>
            <If
                condition={nodeService().status.map(x => !!x.connected)}
                then={<Label>Connected <Label.Detail>
                    <Pretty className="value" value={nodeService().status.sub('connected')} />
                </Label.Detail></Label>}
                else={<Label>Not connected</Label>}
            />
            <Label>Name <Label.Detail>
                <Pretty className="value" value={system.name} /> v<Pretty className="value" value={system.version} />
            </Label.Detail></Label>
            <Label>Chain <Label.Detail>
                <Pretty className="value" value={system.chain} />
            </Label.Detail></Label>
            <Label>Runtime <Label.Detail>
                <Pretty className="value" value={runtime.version.specName} /> v<Pretty className="value" value={runtime.version.specVersion} /> (
                <Pretty className="value" value={runtime.version.implName} /> v<Pretty className="value" value={runtime.version.implVersion} />
                )
            </Label.Detail></Label>
            <Label>Height <Label.Detail>
                <Pretty className="value" value={chain.height} /> (with <Pretty className="value" value={chain.lag} /> lag)
            </Label.Detail></Label>
            <Label>Authorities <Label.Detail>
                <Rspan className="value">{
                    runtime.core.authorities.mapEach((a, i) => <Identicon key={bytesToHex(a) + i} account={a} size={16} />)
                }</Rspan>
            </Label.Detail></Label>
            <Label>Total issuance <Label.Detail>
                <Pretty className="value" value={runtime.balances.totalIssuance} />
            </Label.Detail></Label>
        </div>
    }
}
class NodeSegment extends React.Component {
    constructor() {
        super()
        this.node = new Bond;
    }
    render() {
        return <Segment style={{ margin: '1em' }}>
            <Header as='h2'>
                {/* https://react.semantic-ui.com/elements/icon/ */}
                <Icon name='wifi' />
                <Header.Content>
                    Network
                    <Header.Subheader>Manage network connection</Header.Subheader>
                </Header.Content>
            </Header>
            <div style={{ paddingBottom: '1em' }}>
                <div style={{ fontSize: 'small' }}>node</div>
                <InputBond
                    bond={this.node}
                    defaultValue={nodeService().uri[nodeService().uriIndex]}
                    validator={n => n.length > 0 ? n : null}
                    action={<TransformBondButton
                        content='Set'
                        transform={(node) => {
                            setNodeUri([node]);
                            localStorage.setItem('wsNode', node);
                            return true
                        }}
                        args={[this.node]}
                        immediate
                    />}
                />
            </div>
            <Label>Chain <Label.Detail>
                <Pretty className="value" value={system.chain} />
            </Label.Detail></Label>
            <If
                condition={nodeService().status.map(x => !!x.connected)}
                then={<Label>Connected <Label.Detail>
                    <Pretty className="value" value={nodeService().status.sub('connected')} />
                </Label.Detail></Label>}
                else={<Label>Not connected</Label>}
            />
            <Label>Height <Label.Detail>
                <Pretty className="value" value={chain.height} /> (with <Pretty className="value" value={chain.lag} /> lag)
            </Label.Detail></Label>
        </Segment>
    }
}
class TokenSegment extends ReactiveComponent {
    constructor() {
        super(["init", "root"]);
        this.source = new Bond;
        this.parent = new Bond;
        this.mint = new Bond;
        this.burn = new Bond;
        this.localTarget = new Bond;
        this.localTransfer = new Bond;
        this.childTransfer = new Bond;
        this.childTarget = new Bond;
        this.parentTransfer = new Bond;
        this.parentTarget = new Bond;
        this.ticker = new Bond;
        this.tokenName = new Bond;
    }
    render() {
        return <Segment style={{ margin: '1em' }}>
            <Header as='h2'>
                {/* https://react.semantic-ui.com/elements/icon/ */}
                <Icon name='money bill alternate' />
                <Header.Content>
                    Token
                    <Header.Subheader>Manage custom overlay token</Header.Subheader>
                </Header.Content>
            </Header>
            <div style={{ paddingBottom: '1em' }}>
                <Label>Init <Label.Detail>
                    <Pretty className="value" value={runtime.token.init} />
                </Label.Detail></Label>
                <Label>Ticker <Label.Detail>
                    <StringPretty className="value" value={runtime.token.ticker} />
                </Label.Detail></Label>
                <Label>Token Name <Label.Detail>
                    <StringPretty className="value" value={runtime.token.name} />
                </Label.Detail></Label>
                <Label>Root <Label.Detail>
                    <Pretty className="value" value={runtime.token.root} />
                </Label.Detail></Label>
                <Label>Total Supply <Label.Detail>
                    <Pretty className="value" value={runtime.token.totalSupply} />
                </Label.Detail></Label>
                <div style={{ paddingBottom: '1em' }}>
                </div>
                <Label>Local Supply <Label.Detail>
                    <Pretty className="value" value={runtime.token.localSupply} />
                </Label.Detail></Label>
                <Label>Parent Supply <Label.Detail>
                    <Pretty className="value" value={runtime.token.parentSupply} />
                </Label.Detail></Label>
                <Label>Child Supply <Label.Detail>
                    <Pretty className="value" value={runtime.token.childSupplies(0)} />
                </Label.Detail></Label>
            </div>
            <div style={{ paddingBottom: '1em' }}>
                <div style={{ fontSize: 'small' }}>account</div>
                <SignerBond bond={this.source} />
                <If condition={this.source.ready()} then={<span>
					<Label>Token Balance
						<Label.Detail>
							<Pretty value={runtime.token.balanceOf(this.source)} />
						</Label.Detail>
					</Label>
					<Label>Unit Balance
						<Label.Detail>
							<Pretty value={runtime.balances.balance(this.source)} />
						</Label.Detail>
					</Label>
					<Label>Nonce
						<Label.Detail>
							<Pretty value={runtime.system.accountNonce(this.source)} />
						</Label.Detail>
					</Label>
				</span>} />
            </div>
            <If condition={!this.state.init} then={
                <div style={{ paddingBottom: '1em' }}>
                    <div style={{ fontSize: 'small' }}>init</div>
                    <div>
                        <InputBond
                            bond={this.ticker}
                            placeholder='ticker'
                            type="string"
                            validator={n => n ? { external: stringToU8a(n), internal: n, ok: true } : null}
                        />
                        <InputBond
                            bond={this.tokenName}
                            placeholder='name'
                            type="string"
                            validator={n => n ? { external: stringToU8a(n), internal: n, ok: true } : null}
                        />
                        <TransactButton
                            content="Init"
                            tx={{
                                sender: this.source ? this.source : null,
                                call: calls.token.init(this.ticker, this.tokenName)
                            }}
                        />
                    </div>
                </div>
            } />
            <If condition={this.state.init && this.state.root} then={
                <div style={{ paddingBottom: '1em' }}>
                    <div style={{ fontSize: 'small' }}>Set Parent</div>
                    <InputBond
                        bond={this.parent} placeholder='Set parent supply' type='number'
                        validator={n => n ? n : null}
                        action={<TransactButton
                            content='Set'
                            tx={{
                                sender: this.source ? this.source : null,
                                call: calls.token.setParent(this.parent)
                            }}
                        />}
                    />
                </div>
            } />
            <If condition={this.state.init && this.state.root} then={
                <div style={{ paddingBottom: '1em' }}>
                    <div style={{ fontSize: 'small' }}>mint</div>
                    <InputBond
                        bond={this.mint} placeholder='Token amount to mint' type='number'
                        validator={n => n ? n : null}
                        action={<TransactButton
                            content='Mint'
                            tx={{
                                sender: this.source ? this.source : null,
                                call: calls.token.mint(this.mint)
                            }}
                        />}
                    />
                </div>
            } />
            <If condition={this.state.init && this.state.root} then={
                <div style={{ paddingBottom: '1em' }}>
                    <div style={{ fontSize: 'small' }}>burn</div>
                    <InputBond
                        bond={this.burn} placeholder='Token amount to burn' type='number'
                        validator={n => n ? n : null}
                        action={<TransactButton
                            content='Burn'
                            tx={{
                                sender: this.source ? this.source : null,
                                call: calls.token.burn(this.burn)
                            }}
                        />}
                    />
                </div>
            } />
            <If condition={this.state.init} then={
                <div style={{ paddingBottom: '1em' }}>
                    <div style={{ fontSize: 'small' }}>transfer</div>
                    <div>
                        <AccountIdBond bond={this.localTarget} />
                        <InputBond
                            bond={this.localTransfer}
                            placeholder='Transfer amount'
                            type="number"
                            validator={n => n ? n : null}
                        />
                        <TransactButton
                            content="transfer"
                            tx={{
                                sender: this.source ? this.source : null,
                                call: calls.token.transfer(this.localTarget, this.localTransfer),
                            }}
                        />
                    </div>
                    <div>
                        <If condition={this.localTarget.ready()} then={
                            <Label>Token Balance
                                <Label.Detail>
                                    <Pretty value={runtime.token.balanceOf(this.localTarget)} />
                                </Label.Detail>
                            </Label>
                        } />
                    </div>
                </div>
            } />
            <If condition={this.state.init && this.state.root} then={
                <div style={{ paddingBottom: '1em' }}>
                    <div style={{ fontSize: 'small' }}>sendToChild</div>
                    <div>
                        <AccountIdBond bond={this.childTarget} />
                        <InputBond
                            bond={this.childTransfer}
                            placeholder='Send amount'
                            type="number"
                            validator={n => n ? n : null}
                        />
                        <TransactButton
                            content="send"
                            tx={{
                                sender: this.source ? this.source : null,
                                call: calls.token.sendToChild(0, this.childTarget, this.childTransfer),
                            }}
                        />
                    </div>
                </div>
            } />
            <If condition={this.state.init && !this.state.root} then={
                <div style={{ paddingBottom: '1em' }}>
                    <div style={{ fontSize: 'small' }}>sendToParent</div>
                    <div>
                        <AccountIdBond bond={this.parentTarget} />
                        <InputBond
                            bond={this.parentTransfer}
                            placeholder='Send amount'
                            type="number"
                            validator={n => n ? n : null}
                        />
                        <TransactButton
                            content="send"
                            tx={{
                                sender: this.source ? this.source : null,
                                call: calls.token.sendToParent(this.parentTarget, this.parentTransfer),
                            }}
                        />
                    </div>
                </div>
            } />
        </Segment>
    }
}
class WalletSegment extends React.Component {
    constructor() {
        super()
        this.seed = new Bond;
        this.seedAccount = this.seed.map(s => s ? secretStore().accountFromPhrase(s) : undefined)
        this.seedAccount.use()
        this.name = new Bond;
    }
    render() {
        return <Segment style={{ margin: '1em' }}>
            <Header as='h2'>
                <Icon name='key' />
                <Header.Content>
                    Wallet
                    <Header.Subheader>Manage your secret keys</Header.Subheader>
                </Header.Content>
            </Header>
            <div style={{ paddingBottom: '1em' }}>
                <div style={{ fontSize: 'small' }}>seed</div>
                <InputBond
                    bond={this.seed}
                    reversible
                    placeholder='Some seed for this key'
                    validator={n => n || null}
                    action={<Button content="Another" onClick={() => this.seed.trigger(secretStore().generateMnemonic())} />}
                    iconPosition='left'
                    icon={<i style={{ opacity: 1 }} className='icon'><Identicon account={this.seedAccount} size={28} style={{ marginTop: '5px' }} /></i>}
                />
            </div>
            <div style={{ paddingBottom: '1em' }}>
                <div style={{ fontSize: 'small' }}>name</div>
                <InputBond
                    bond={this.name}
                    placeholder='A name for this key'
                    validator={n => n ? secretStore().map(ss => ss.byName[n] ? null : n) : null}
                    action={<TransformBondButton
                        content='Create'
                        transform={(name, seed) => secretStore().submit(seed, name)}
                        args={[this.name, this.seed]}
                        immediate
                    />}
                />
            </div>
            <div style={{ paddingBottom: '1em' }}>
                <WalletList />
            </div>
        </Segment>
    }
}

class AddressBookSegment extends React.Component {
    constructor() {
        super()
        this.nick = new Bond
        this.lookup = new Bond
    }
    render() {
        return <Segment style={{ margin: '1em' }} padded>
            <Header as='h2'>
                <Icon name='search' />
                <Header.Content>
                    Address Book
                    <Header.Subheader>Inspect the status of any account and name it for later use</Header.Subheader>
                </Header.Content>
            </Header>
            <div style={{ paddingBottom: '1em' }}>
                <div style={{ fontSize: 'small' }}>lookup account</div>
                <AccountIdBond bond={this.lookup} />
                <If condition={this.lookup.ready()} then={<div>
                    <Label>Balance
                        <Label.Detail>
                            <Pretty value={runtime.balances.balance(this.lookup)} />
                        </Label.Detail>
                    </Label>
                    <Label>Nonce
                        <Label.Detail>
                            <Pretty value={runtime.system.accountNonce(this.lookup)} />
                        </Label.Detail>
                    </Label>
                    <If condition={runtime.indices.tryIndex(this.lookup, null).map(x => x !== null)} then={
                        <Label>Short-form
                            <Label.Detail>
                                <Rspan>{runtime.indices.tryIndex(this.lookup).map(i => ss58Encode(i) + ` (index ${i})`)}</Rspan>
                            </Label.Detail>
                        </Label>
                    } />
                    <Label>Address
                        <Label.Detail>
                            <Pretty value={this.lookup} />
                        </Label.Detail>
                    </Label>
                </div>} />
            </div>
            <div style={{ paddingBottom: '1em' }}>
                <div style={{ fontSize: 'small' }}>name</div>
                <InputBond
                    bond={this.nick}
                    placeholder='A name for this address'
                    validator={n => n ? addressBook().map(ss => ss.byName[n] ? null : n) : null}
                    action={<TransformBondButton
                        content='Add'
                        transform={(name, account) => { addressBook().submit(account, name); return true }}
                        args={[this.nick, this.lookup]}
                        immediate
                    />}
                />
            </div>
            <div style={{ paddingBottom: '1em' }}>
                <AddressBookList />
            </div>
        </Segment>
    }
}

class FundingSegment extends React.Component {
    constructor() {
        super()

        this.source = new Bond;
        this.amount = new Bond;
        this.destination = new Bond;
    }
    render() {
        return <Segment style={{ margin: '1em' }} padded>
            <Header as='h2'>
                <Icon name='send' />
                <Header.Content>
                    Send Funds
                    <Header.Subheader>Send funds from your account to another</Header.Subheader>
                </Header.Content>
            </Header>
            <div style={{ paddingBottom: '1em' }}>
                <div style={{ fontSize: 'small' }}>from</div>
                <SignerBond bond={this.source} />
                <If condition={this.source.ready()} then={<span>
					<Label>Balance
						<Label.Detail>
							<Pretty value={runtime.balances.balance(this.source)} />
						</Label.Detail>
					</Label>
					<Label>Nonce
						<Label.Detail>
							<Pretty value={runtime.system.accountNonce(this.source)} />
						</Label.Detail>
					</Label>
				</span>} />
            </div>
            <div style={{ paddingBottom: '1em' }}>
                <div style={{ fontSize: 'small' }}>to</div>
                <AccountIdBond bond={this.destination} />
                <If condition={this.destination.ready()} then={
                    <Label>Balance
                        <Label.Detail>
                            <Pretty value={runtime.balances.balance(this.destination)} />
                        </Label.Detail>
                    </Label>
                } />
            </div>
            <div style={{ paddingBottom: '1em' }}>
                <div style={{ fontSize: 'small' }}>amount</div>
                <BalanceBond bond={this.amount} />
            </div>
            <TransactButton
                content="Send"
                icon='send'
                tx={{
                    sender: runtime.indices.tryIndex(this.source),
                    call: calls.balances.transfer(runtime.indices.tryIndex(this.destination), this.amount),
                    compact: false,
                    longevity: true
                }}
            />
        </Segment>
    }
}

class UpgradeSegment extends React.Component {
    constructor() {
        super()
        this.conditionBond = runtime.metadata.map(m =>
            m.modules && m.modules.some(o => o.name === 'sudo')
            || m.modules.some(o => o.name === 'upgrade_key')
        )
        this.runtime = new Bond
    }
    render() {
        return <If condition={this.conditionBond} then={
            <Segment style={{ margin: '1em' }} padded>
                <Header as='h2'>
                    <Icon name='search' />
                    <Header.Content>
                        Runtime Upgrade
                        <Header.Subheader>Upgrade the runtime using the UpgradeKey module</Header.Subheader>
                    </Header.Content>
                </Header>
                <div style={{ paddingBottom: '1em' }}></div>
                <FileUploadBond bond={this.runtime} content='Select Runtime' />
                <TransactButton
                    content="Upgrade"
                    icon='warning'
                    tx={{
                        sender: runtime.sudo
                            ? runtime.sudo.key
                            : runtime.upgrade_key.key,
                        call: calls.sudo
                            ? calls.sudo.sudo(calls.consensus.setCode(this.runtime))
                            : calls.upgrade_key.upgrade(this.runtime)
                    }}
                />
            </Segment>
        } />
    }
}

class PokeSegment extends React.Component {
    constructor () {
        super()
        this.storageKey = new Bond;
        this.storageValue = new Bond;
    }
    render () {
        return <If condition={runtime.metadata.map(m => m.modules && m.modules.some(o => o.name === 'sudo'))} then={
            <Segment style={{margin: '1em'}} padded>
                <Header as='h2'>
                    <Icon name='search' />
                    <Header.Content>
                        Poke
                        <Header.Subheader>Set a particular key of storage to a particular value</Header.Subheader>
                    </Header.Content>
                </Header>
                <div style={{paddingBottom: '1em'}}></div>
                <InputBond bond={this.storageKey} placeholder='Storage key e.g. 0xf00baa' />
                <InputBond bond={this.storageValue} placeholder='Storage value e.g. 0xf00baa' />
                <TransactButton
                    content="Poke"
                    icon='warning'
                    tx={{
                        sender: runtime.sudo ? runtime.sudo.key : null,
                        call: calls.sudo ? calls.sudo.sudo(calls.consensus.setStorage([[this.storageKey.map(hexToBytes), this.storageValue.map(hexToBytes)]])) : null
                    }}
                />
            </Segment>
        }/>
    }
}

class TransactionsSegment extends React.Component {
    constructor () {
        super()

        this.txhex = new Bond
    }

    render () {
        return <Segment style={{margin: '1em'}} padded>
            <Header as='h2'>
                <Icon name='certificate' />
                <Header.Content>
                    Transactions
                    <Header.Subheader>Send custom transactions</Header.Subheader>
                </Header.Content>
            </Header>
            <div style={{paddingBottom: '1em'}}>
                <div style={{paddingBottom: '1em'}}>
                    <div style={{fontSize: 'small'}}>Custom Transaction Data</div>
                    <InputBond bond={this.txhex}/>
                </div>
                <TransactButton tx={this.txhex.map(hexToBytes)} content="Publish" icon="sign in" />
            </div>
        </Segment>
    }
}