const {Web3} = require('web3')
const { SequencerProvider, constants } = require('starknet');
const ethSkBridgeAddressABI = require('./abi/starknet_bridge_abi.json')
const {getMainAccount} = require('./accounts')


async function transferEthToStarkBridgeContract(ethRpc,privateKey,ethWalletAddress,skL1BridgeAddress,skAccountAddress,ethAmount,sknetGas) {
    
    let web3 =  new Web3(ethRpc)
    let balance = await web3.eth.getBalance(ethWalletAddress)
    console.log('balance:',balance.toString())

    // return
    

    // 总的eth = 转账eth数量  + starknet网络gas
    let totalValue = Web3.utils.toBigInt(ethAmount) + Web3.utils.toBigInt(sknetGas)*Web3.utils.toBigInt(115)/Web3.utils.toBigInt(100);

    console.log('totalValue:',totalValue)

    let txInfo = {
        from: ethWalletAddress,
        gasLimit: '',
        gasPrice: '',
        to:skL1BridgeAddress,
        value: Web3.utils.toHex(totalValue),
    }


    let receipt = Web3.utils.toBigInt(skAccountAddress);
    console.log('receipt:',receipt.toString('10'))

    const contract = new web3.eth.Contract(ethSkBridgeAddressABI,skL1BridgeAddress);

    let gasPrice = await web3.eth.getGasPrice();
    gasPrice = web3.utils.toHex(gasPrice);
    console.log('gasPrice:', gasPrice);
    txInfo.gasPrice = gasPrice;

    let gasLimit = await contract.methods.deposit(ethAmount,receipt.toString('10')).estimateGas(txInfo);
    //乘以1.5倍加快交易
    gasLimit = gasLimit * web3.utils.toBigInt(15)/web3.utils.toBigInt(10);
    console.log('gasLimit:', gasLimit);

    txInfo.gasLimit = web3.utils.toHex(gasLimit);;

    let data =  contract.methods.deposit(ethAmount,receipt.toString()).encodeABI()
    txInfo.data = data;

    console.log('txInfo:',txInfo)


    let signRawTx =  await web3.eth.accounts.signTransaction(txInfo, privateKey)
    console.log('signRawTx:',signRawTx);
    let txLink = 'https://goerli.etherscan.io/tx/' + signRawTx.transactionHash
    console.log('tx-link:',txLink);

    // return;
    let txOut =  await web3.eth.sendSignedTransaction(signRawTx.rawTransaction);
    console.log('txOut:',txOut);

}

async function transferEthFromEthToStarknetForTestnet(privateKey,ethWalletAddress,skAccountAddress,ethAmount) {

    let rpc = 'https://goerli.infura.io/v3/9aa3d95b3bc440fa88ea12eaa4456161'

     // starknet eth 测试网bridge合约地址
    // 1115060956765620476872948418762657804474621689758
    let skL1BridgeAddress = '0xc3511006c04ef1d78af4c8e0e74ec18a6e64ff9e';
    let sknetGas = await transferEthFromEthToStarknetEstimateGas(constants.BaseUrl.SN_GOERLI,skL1BridgeAddress,skAccountAddress,ethAmount)
    await transferEthToStarkBridgeContract(rpc,privateKey,ethWalletAddress,skL1BridgeAddress,skAccountAddress,ethAmount,sknetGas)

    
}
async function transferEthFromEthToStarknetForMainnet(privateKey,ethWalletAddress,skAccountAddress,ethAmount) {
    let rpc = 'https://mainnet.infura.io/v3/9aa3d95b3bc440fa88ea12eaa4456161'
    // starknet eth 主网bridge合约地址
    // 993696174272377493693496825928908586134624850969
    let skL1BridgeAddress = '0xae0ee0a63a2ce6baeeffe56e7714fb4efe48d419'
    let sknetGas = await transferEthFromEthToStarknetEstimateGas(constants.BaseUrl.SN_MAIN,skL1BridgeAddress,skAccountAddress,ethAmount)
    await transferEthToStarkBridgeContract(rpc,privateKey,ethWalletAddress,skL1BridgeAddress,skAccountAddress,ethAmount,sknetGas)

}
async function transferEthFromEthToStarknetEstimateGas(sknetUrl,skBridgeEthAddress,skAccountAddress,ethAmount) {

    const sequencerProvider = new SequencerProvider({ baseUrl: sknetUrl }); // for testnet 1
    const l1l2ContractAddress = '0x073314940630fd6dcda0d772d4c972c4e0a9946bef9dabf4ef84eda8ef542b82'.toLowerCase();
    console.log('l1l2ContractAddress:',l1l2ContractAddress)
    // entry_point_selector encoder = '0x02d757788a8d8d6f21d1cd40bce38a8222d70654214e96ff95d8086e684fbee5';
    const entry_point_selector = 'handle_deposit';
    let call = {
        from_address: skBridgeEthAddress,
        to_address: l1l2ContractAddress,
        entry_point_selector,
        payload: [
          skAccountAddress,
          ethAmount,
          '0x0',
        ],
      }
    const estimateFee = await sequencerProvider.estimateMessageFee(call,'latest')
    // console.log('sk-estimateFee:',estimateFee)
    return estimateFee.overall_fee
}
async function main() {


    let account = getMainAccount()
    if(account.privateKey.length===0 || account.ethFromAddress.length === 0 || account.skAccountAddress.length === 0){
        console.log('请先在accounts.js中配置帐户信息')
        return
    }

    console.log(getMainAccount())


    let privateKey = account.privateKey
    let ethFromAddress = account.ethFromAddress
    let skAccountAddress = account.skAccountAddress
    let ethAmount = '10000000000000000'

    //测试网跨链
    await transferEthFromEthToStarknetForTestnet(privateKey,ethFromAddress,skAccountAddress, ethAmount)
    //主网跨链
    // await transferEthFromEthToStarknetForMainnet(privateKey,ethFromAddress,skAccountAddress, ethAmount)

    console.log('done');
}

main()
