import React from 'react';
import QRCode from 'qrcode.react'

import { bindActionCreators } from 'redux';
import { connect } from 'react-redux';

import {
  Page,  
  Splitter,
  SplitterSide,
  SplitterContent,
  Dialog,
  Toolbar,
  ToolbarButton,
  Button,
  BackButton,
  Icon,
  List,
  ListItem,
  ListHeader
} from 'react-onsenui';

import axios from 'axios'

import { setAddress, setPrivateKey, setAddressValue } from '../actions/Context'

import SendPage from './SendPage';
import SettingsPage from './SettingsPage'

import { urlAppend } from '../utils/index'

import TRANSLATIONS from '../translations'

const TX_ITEM_COUNT = 10; // How many tx do we wanna get at one time

class MainPage extends React.Component {
  constructor(props) {
    super(props);

    this.state = {
      sliderOpen: false,
      dialogOpen: false,      
      selectedAddressTxFrom: 0,
      selectedAddressTxTo: 50,
      selectedAddressTxs: [],
      selectedAddressNoTxs: false,
      selectedAddressScannedTxs: false, // Have we tried and fined the txs? (used to display loading...)
    };

    this.hide = this.hide.bind(this)
    this.show = this.show.bind(this)
    this.toggleDialog = this.toggleDialog.bind(this)
    this.gotoComponent = this.gotoComponent.bind(this)
    this.setAddressInfo = this.setAddressInfo.bind(this)    
    this.setAddressTxList = this.setAddressTxList.bind(this)        
  }

  hide() {
    this.setState({
      sliderOpen: false
    });
  }

  show() {
    this.setState({
      sliderOpen: true
    });
  }

  toggleDialog() {
    this.setState({
      dialogOpen: !this.state.dialogOpen
    })
  }  

  // Sets information about address
  setAddressInfo(address) {
    // Resets
    this.props.setAddressValue(null)    

    // How many zen
    const addrURL = urlAppend(this.props.settings.insightAPI, 'addr/' + address + '/')
    cordovaHTTP.get(addrURL, {}, {},
      function(resp){
        const addr_info = JSON.parse(resp.data)
        this.props.setAddressValue(addr_info.balance)
      }.bind(this), (err) => alert(JSON.stringify(err)))        

    // Sets information about tx
    // When we set address info
    this.setAddressTxList(address, false)
  }

  // Sets information about tx  
  setAddressTxList(address, append=true) {
    const txInfoURL = urlAppend(this.props.settings.insightAPI, 'addrs/' + address + '/txs?from=' + this.state.selectedAddressTxFrom + '&to=' + this.state.selectedAddressTxTo)    

    this.setState({
      selectedAddressScannedTxs: false
    })

    cordovaHTTP.get(txInfoURL, {}, {},
      function(resp){        
        const txinfo = JSON.parse(resp.data)
        const curTxs = this.state.selectedAddressTxs || []        
        const newTxs = append ? curTxs.concat(txinfo.items) : txinfo.items        
        
        this.setState({
          selectedAddressTxs: newTxs,
          selectedAddressNoTxs: newTxs.length === 0,
          selectedAddressScannedTxs: true
        })
      }.bind(this), (err) => alert(JSON.stringify(err)))
  }

  gotoComponent(c) {    
    this.props.navigator.pushPage({component: c});
    this.setState({
      sliderOpen: false
    })
  }

  componentDidMount() {    
    if (this.props.secrets.items.length > 0){
      const address = this.props.secrets.items[0].address;
      const privateKey = this.props.secrets.items[0].privateKey;

      this.props.setAddress(address) // for the send page
      this.props.setPrivateKey(privateKey)
      this.setAddressInfo(address)      
    }
  }

  componentWillReceiveProps(nextProps) { 
    if (nextProps.context.address !== this.props.context.address){
      this.setAddressInfo(nextProps.context.address)
    }
  }

  renderToolbar() {
    // toolbar title in X language
    const CUR_LANG = this.props.settings.language
    const titleLang = TRANSLATIONS[CUR_LANG].MainPage.title

    return (
      <Toolbar>
        <div className='left'>
          <ToolbarButton onClick={(e) => this.show()}>
            <Icon icon='ion-navicon, material:md-menu' />
          </ToolbarButton>
        </div>
        <div className='center'>
          { titleLang }
        </div>
        <div className='right'>
          <ToolbarButton onClick={() => this.setAddressInfo(this.props.context.address)}>
            <Icon icon='ion-refresh'/>
          </ToolbarButton>
          <ToolbarButton onClick={(e) => this.toggleDialog()}>
            <Icon icon='ion-clipboard'/>
          </ToolbarButton>
        </div>        
      </Toolbar>
    );
  }

  render() {
    // Language translations
    const CUR_LANG = this.props.settings.language
    const valueLang = TRANSLATIONS[CUR_LANG].MainPage.value
    const addressLang = TRANSLATIONS[CUR_LANG].General.address
    const copyToClipboardLang = TRANSLATIONS[CUR_LANG].MainPage.copyToClipboard
    const sendLang = TRANSLATIONS[CUR_LANG].MainPage.send
    const sentLang = TRANSLATIONS[CUR_LANG].MainPage.sent
    const receivedLang = TRANSLATIONS[CUR_LANG].MainPage.received
    const settingsLang = TRANSLATIONS[CUR_LANG].MainPage.settings
    const noTxFoundLang = TRANSLATIONS[CUR_LANG].MainPage.noTxFound
    const loadingLang = TRANSLATIONS[CUR_LANG].General.loading    

    return (
      <Page>        
        <Splitter>
          <SplitterSide
            side='left'
            isOpen={this.state.sliderOpen}
            onClose={(e) => this.hide()}
            onOpen={(e) => this.show()}
            collapse={true}
            width={240}
            isSwipeable={true}>
            <Page>
              <List
                dataSource=
                {[{
                    name: sendLang,
                    component: SendPage
                  },
                  {
                    name: settingsLang,
                    component: SettingsPage
                  }
                ]}                
                renderHeader={() => <ListHeader>ZEN</ListHeader>}
                renderRow={(i) => 
                  <ListItem
                    onClick={() => this.gotoComponent(i.component)}
                    modifier='longdivider'
                    tappable>
                    {i.name}
                  </ListItem>
                }
              />
            </Page>
          </SplitterSide>

          <SplitterContent>
            <Page renderToolbar={(e) => this.renderToolbar()}>                  
              <div style={{textAlign: 'center'}}>
                <p>
                  <QRCode value={ this.props.context.address || loadingLang }/>                
                </p>
                <p style={{fontSize: '13px'}}>
                  { valueLang }: {
                    this.props.context.value === null ?
                    loadingLang :
                    this.props.context.value + ' ZEN'
                  }
                </p>
                <p style={{fontSize: '12px'}}>                  
                  { addressLang }: { this.props.context.address }
                </p>
                
                <Button
                  onClick={() => {
                    cordova.plugins.clipboard.copy(this.props.context.address)                    
                  }}
                  style={{fontSize: '12px', marginBottom: '10px', width: '90%'}}>                  
                  { copyToClipboardLang }
                </Button>                
              </div>

              <hr/>             

              <List>
                {
                  this.state.selectedAddressScannedTxs === false ?
                  (
                    <ListHeader>
                      <div style={{textAlign: 'center'}}>
                        <Icon icon='spinner' spin/>
                      </div>
                    </ListHeader>
                  ) : 
                  this.state.selectedAddressNoTxs ?
                  (
                    <ListHeader>
                      { noTxFoundLang }
                    </ListHeader>
                  )
                  :
                  this.state.selectedAddressTxs.map(function(tx){
                    const selectedAddress = this.props.context.address
                    const vins = tx.vin || []
                    const vouts = tx.vout || []
                    var ret

                    // Are we receiving zen?
                    // and whats the amount of zen we receive / sent?
                    function getTxListItem (received, value) {
                      return (
                        <ListItem tappable>
                          <ons-row>
                            <ons-col>{ received ? receivedLang : sentLang }</ons-col>
                            <ons-col style={{textAlign: 'right', paddingRight: '12px'}}>
                              { received ? '+' : '-' } { parseFloat(value) } zen
                            </ons-col>
                          </ons-row>
                        </ListItem>
                      )
                    }                    

                    vins.forEach(function(vin){
                      if (vin.addr === selectedAddress){                     
                        ret = getTxListItem(false, vin.value)                        
                      }
                    })
                    
                    if (ret === undefined){
                      vouts.forEach(function(vout){                      
                        vout.scriptPubKey.addresses.forEach(function(addr){
                          if (addr === selectedAddress){
                            ret = getTxListItem(true, vout.value)                            
                          }
                        })
                      })
                    }

                    return ret                               
                  }.bind(this))
                }                
              </List>        
            </Page>
          </SplitterContent>
        </Splitter>        

        <Dialog
          isOpen={this.state.dialogOpen}
          onCancel={this.toggleDialog}
          cancelable>
          <List>
            <ListHeader>{ addressLang }</ListHeader>
            {
              this.props.secrets.items.map(function(e){
                return (
                  <ListItem
                    style={{fontSize: '14px'}}
                    onClick={function(){
                      this.props.setAddress(e.address)
                      this.props.setPrivateKey(e.privateKey)                      
                      this.setState({                        
                        dialogOpen: false
                      })
                    }.bind(this)}
                    tappable
                  >
                  { e.address }
                  </ListItem>
                )
              }.bind(this))
            }            
          </List>
        </Dialog>
      </Page>
    );
  }
}


function mapStateToProps(state){  
  return {
    secrets: state.secrets,
    settings: state.settings,
    context: state.context
  }
}

function matchDispatchToProps (dispatch) {
  // Set context for the send page
  return bindActionCreators(
    {
      setAddress,
      setAddressValue,
      setPrivateKey
    },
    dispatch
  )
}

export default connect(mapStateToProps, matchDispatchToProps)(MainPage)