var web3;
var accounts = [];
var networkChainId = '0x13881';
var vestingContract;
var tokenContract;
var polygonscan_address = 'https://mumbai.polygonscan.com/address/';
var myAddress = "";

let contract_address = "0x483da03A27c05b641609AE6c7d040558B582db03";


const owner_address = "0xF62F51CE6191c17380A64d49C58D1206Cd091410";
const toastElement = document.getElementById('kt_docs_toast_toggle');
const toast = bootstrap.Toast.getOrCreateInstance(toastElement);

function toastMsg(str) {
    $('#toast_body')[0].innerHTML = str;
    toast.show();
}

$(document).on('click', '#connect_wallet', function() {
    if($('#connect_wallet')[0].innerHTML == "Connect Wallet") {
        connect_wallet();
    } else if($('#connect_wallet')[0].innerHTML == "Switch network")  {
        switch_network();
    }
})

function connect_wallet() {
    return web3.eth.requestAccounts()
        .then(_accounts => {
            accounts = _accounts;
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
            console.error(error);
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
            console.error(error);
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

async function createPool(address, name) {
    var args = [[address], [name]];
    console.log(args);
    const func = "createPool"
    var {success, gas, message}  = await estimateGas(vestingContract, func, ...args);
    if(!success) {
        alert(message);
        return;
    }
    const res = runSmartContract(vestingContract, func, ...args)
    console.log(res);
}

async function getBalance(address, token) {
    tokenContract = new web3.eth.Contract(tokenABI, token);
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

async function runSmartContract(contract, func, ...args) {
    if(accounts.length == 0) return false;
    if(!contract) return false;
    if(!contract.methods[func]) return false;
    return await contract.methods[func](...args).send({ from: accounts[0] })
}

async function estimateGas(contract, func, ...args) {
    try {
        const gasAmount = await contract.methods[func](...args).estimateGas({from: accounts[0]});
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