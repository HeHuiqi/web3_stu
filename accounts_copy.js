
//在这里配置帐户信息
const accounts = [
    {
        //eth 帐户私钥
        privateKey : '',
        // eth 帐户地址
        ethFromAddress:'',
        // starknet 帐户地址
        skAccountAddress:''
    }
]

function getAccount(index) {
    if(index>=accounts.length){
        return null
    }
    return accounts[index]
}

function getMainAccount() {
    return getAccount(0)
}


module.exports = {
    getMainAccount,
    getAccount,
};