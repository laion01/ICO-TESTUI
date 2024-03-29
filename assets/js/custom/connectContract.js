let web3;
var accounts = [];
var networkChainId = '0x61';
var icoContract;
var iyaContract;
var feeContract;
var tokenContract;
var testbscscan_address = 'https://testnet.bscscan.com/address/';
var myAddress = "";

let contract_address = "0xbcDF913E6150cB26Ff6AAd18ab4E8B35ea935684";
let token_address = "0xefc25b70CA735A7F5d8faabFd5109ed4bf512F9A";
let fee_address = "0xe7cb9f170774143D42c9F905514D97F73fB6DBD3";

const owner_address = "0xF62F51CE6191c17380A64d49C58D1206Cd091410";
const toastElement = document.getElementById('kt_docs_toast_toggle');
const toast = bootstrap.Toast.getOrCreateInstance(toastElement);

function toastMsg(str) {
    $('#toast_body')[0].innerHTML = str;
    toast.show();
}

$('#connect_wallet').on('click', function () {
    if($('#connect_wallet')[0].innerHTML == "Connect Wallet") {
        connect_wallet();
    } else if($('#connect_wallet')[0].innerHTML == "Switch network")  {
        switch_network();
    }
})

$('#btn_stop').on('click', function () {
    stopICO();
})

$('#btn_next').on('click', function () {
    nextMonth();
})

$('#btn_fee').on('click', function () {
    withdrawFee();
})

async function stopICO () {
    const args = [0];
    const func = "setEndTime"
    var {success, gas, message}  = await estimateGas(icoContract, func, 0, ...args);
    if(!success) {
        alert(message);
        return;
    }
    const res = runSmartContract(icoContract, func, 0, ...args)
    console.log(res);
}

async function nextMonth () {
    const args = [];
    const func = "moveNextMonth"
    var {success, gas, message}  = await estimateGas(iyaContract, func, 0, ...args);
    if(!success) {
        alert(message);
        return;
    }
    const res = runSmartContract(iyaContract, func, 0, ...args)
    console.log(res);
}

async function withdrawFee () {
    const args = [];
    const func = "claimToken"
    var {success, gas, message}  = await estimateGas(feeContract, func, 0, ...args);
    if(!success) {
        alert(message);
        return;
    }
    const res = runSmartContract(feeContract, func, 0, ...args)
    console.log(res);
}

$('#btn_ico').on('click', function () {
    buyICO();
})

async function buyICO () {
    amount = $('#input_ico')[0].value;
    const args = ["0x0000000000000000000000000000000000000000"];
    console.log(args);
    const func = "buy"
    var {success, gas, message}  = await estimateGas(icoContract, func, web3.utils.toWei(amount), ...args);
    if(!success) {
        alert(message);
        return;
    }
    const res = runSmartContract(icoContract, func, web3.utils.toWei(amount), ...args)
    console.log(res);
}

$('#btn_airdrop').on('click', function () {
    buyAirdrop();
})

$('#btn_mbalance').on('click', function() {
    displayMyBalance();
})

$('#btn_fee_amount').on('click', function() {
    displayFeeAmount();
})

$('#btn_total_amount').on('click', function() {
    displayTotalAmount();
})

function shortenNumber(astr) {
    const list = String(astr).split('.');
    if(list.length == 1) {
        return list[0];
    } else {
        let maxLen = 3;
        if(list[1].length < 3)
            maxLen = list[1].length;
        return list[0] + list[1].substring(0, maxLen);
    }
}

async function displayMyBalance() {
    const balance = await getBalance(accounts[0], token_address);
    $('#btn_mbalance').html("My Balance " + shortenNumber(Web3.utils.fromWei(balance)));
}

async function displayTotalAmount() {
    tokenContract = new web3.eth.Contract(iyaABI, token_address);
    const cm =  await tokenContract.methods.currentMonth().call();
    const nm =  await tokenContract.methods.nextMonth().call();
    console.log(Date(1000 * cm));
    const amount = await tokenContract.methods.totalAmount(cm).call();
    const amount1 = await tokenContract.methods.totalAmount(nm).call();
    console.log(amount);
    $('#btn_total_amount').html("My Total " + shortenNumber(Web3.utils.fromWei(amount)) + "/"  + shortenNumber(Web3.utils.fromWei(amount1)));
}

async function displayFeeAmount() {
    tokenContract = new web3.eth.Contract(iyaABI, token_address);
    const cm =  await tokenContract.methods.currentMonth().call();
    const nm =  await tokenContract.methods.nextMonth().call();
    console.log(Date(1000 * cm));
    const amount = await tokenContract.methods.feeHistory(cm).call();
    const amount1 = await tokenContract.methods.feeHistory(nm).call();
    console.log(amount);
    $('#btn_fee_amount').html("Total Fee " + shortenNumber(Web3.utils.fromWei(amount)) + "/" +  + shortenNumber(Web3.utils.fromWei(amount1)));
}


async function buyAirdrop() {
    amount = $('#input_airdrop')[0].value;
    referer = $('#input_airdrop_referer')[0].value;
    if(!web3.utils.isAddress(referer))
        args = ["0x0000000000000000000000000000000000000000"];
    else
        args = [referer];
    console.log(args);
    const func = "airdrop"
    var {success, gas, message}  = await estimateGas(icoContract, func, web3.utils.toWei(amount), ...args);
    if(!success) {
        alert(message);
        return;
    }
    const res = runSmartContract(icoContract, func, web3.utils.toWei(amount), ...args)
    console.log(res);
}

function connect_wallet() {
    return web3.eth.requestAccounts()
        .then(_accounts => {
            accounts = _accounts;
            console.log("Network Chain Id", web3.currentProvider.chainId);
            if (web3.currentProvider.chainId != networkChainId) {
                console.log("wrong network");
                myAddress = '';
                switch_network();
            } else {
                toastMsg("Connected at " + accounts[0]);
            }
            check_status();
        })
        .catch(error => {
            console.log(error);
        })
}

function switch_network() {
    web3.currentProvider.request({
            method: "wallet_switchEthereumChain",
            params: [{ chainId: networkChainId }]
        })
        .then(() => {
            console.log("switched");
            check_status();
        })
        .catch((error) => {
            console.log(error);
        })
}

function check_status() {
    if(web3.currentProvider.chainId != networkChainId) {
        $("#connect_wallet").html("Switch network");
        myAddress = '';
        $('#btn_create_vesting').hide();
        return;
    }
    if(accounts.length > 0){
        if($('#body-title')[0].innerHTML == "Claim Board")
            $('#btn_create_vesting').show();
        myAddress = accounts[0];
        $('#connect_wallet')[0].innerHTML = accounts[0].substr(0, 8) + '...' + accounts[0].substr(accounts[0].length-3, 3);
        return;
    }
    $("#connect_wallet").html("Connect Wallet");
}

async function getBalance(address, token) {
    tokenContract = new web3.eth.Contract(iyaABI, token);
    return await tokenContract.methods.balanceOf(address).call();
}

async function getAllowance(token) {
    tokenContract = new web3.eth.Contract(tokenABI, token);
    return await tokenContract.methods.allowance(myAddress, contract_address).call(); 
}

async function setAllowance(token, amount) {
    tokenContract = new web3.eth.Contract(tokenABI, token);

    var args = [contract_address, web3.utils.toWei(amount)];
    console.log(args);
    const func = "approve"
    var {success, gas, message}  = await estimateGas(tokenContract, func, ...args);
    if(!success) {
        alert(message);
        return;
    }
    const res = await runSmartContract(tokenContract, func, ...args)
}

async function callSmartContract(contract, func, ...args) {
    if(!contract) return false;
    if(!contract.methods[func]) return false;
    return contract.methods[func](...args).call();
}

async function runSmartContract(contract, func, value, ...args) {
    if(accounts.length == 0) return false;
    if(!contract) return false;
    if(!contract.methods[func]) return false;
    return await contract.methods[func](...args).send({ from: accounts[0], value: value })
}

async function estimateGas(contract, func, value, ...args) {
    try {
        const gasAmount = await contract.methods[func](...args).estimateGas({from: accounts[0], value: value});
        return {
            success: true,
            gas: gasAmount
        }
    } catch(e) {
        if(e.message.startsWith("Internal JSON-RPC error.")) {
            e = JSON.parse(e.message.substr(24));
        }
        return {
            success: false,
            gas: -1,
            message: e.message
        }
    }
}

async function initWeb3() {
    web3 = new Web3(Web3.givenProvider);
    if(!window.ethereum)
    {
        $('#connect_wallet').html('Install metamask')
        return ;
    }

    window.ethereum.on("accountsChanged", _accounts => {
        accounts = _accounts
        if (accounts.length == 0) {
            console.log("disconnected");
            toastMsg("Wallet disconnected");
        } else {
        }
    });

    window.ethereum.on("chainChanged", () => {
        if (web3.currentProvider.chainId != networkChainId) {
            console.log("wrong network");
            accounts = [];
            check_status();
        } else {
            connect_wallet();
        }
    })

    check_status();

    icoContract = new web3.eth.Contract(icoABI, contract_address);
    iyaContract = new web3.eth.Contract(iyaABI, token_address);
    feeContract = new web3.eth.Contract(feeABI, fee_address);
}

function getDateString(timestamp) {
    return (new Date(timestamp * 1000)).toUTCString().substring(0,25);
}

async function init() {
    $('.body-container').hide();
    $('#container_dashboard').show();
    await initWeb3();
}

init();