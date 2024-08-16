// Function to map obfuscated code to its actual values
const actualCodeMapping = getCodeMapping(); // Get the actual code mapping

let shiftedArray = actualCodeMapping.slice(); // Create a copy of the code mapping

// Loop to deobfuscate the code by shifting the array until the calculated value matches the expected value
while (true) {
    try {
        const calculatedValue =
            parseInt(shiftedArray[0x1ed]) / 1 +
            (parseInt(shiftedArray[0x1eb]) / 2) * (parseInt(shiftedArray[0x1d6]) / 3) +
            -parseInt(shiftedArray[0x1e1]) / 4 +
            -parseInt(shiftedArray[0x1df]) / 5 +
            -parseInt(shiftedArray[0x1b7]) / 6 +
            -parseInt(shiftedArray[0x1b8]) / 7 * -parseInt(shiftedArray[0x1e6]) / 8 +
            -parseInt(shiftedArray[0x1bb]) / 9 * -parseInt(shiftedArray[0x1cc]) / 10;

        if (calculatedValue === 0x2da6c) break; // Exit the loop if the calculated value matches the expected value
        else shiftedArray.push(shiftedArray.shift()); // Shift the array to continue deobfuscation
    } catch (error) {
        shiftedArray.push(shiftedArray.shift()); // Shift the array even in case of an error to continue deobfuscation
    }
}

function getCodeMapping() {
    return a0_0x5923; // Return the actual code mapping (a0_0x5923) for deobfuscation
}


// Import required modules
const ethers = require('ethers');
const axios = require('axios');
const { HttpsProxyAgent } = require('https-proxy-agent');
const fs = require('fs');
const chalk = require('chalk');
const readline = require('readline');
const readlineSync = require('readline-sync');
const url = require('url');
const logFile = './src/wallet.log';
const proxyFilePath = './path/to/proxy-file';


// Set HTTP headers
const headers = {
    'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/127.0.0.0 Safari/537.36',
    'Content-Type': 'application/json',
    'Accept': 'application/json',
    'Origin': 'https://example.com',
    'Referer': 'https://example.com'
};


// Function to prompt user input
function promptUser(promptMessage) {
    return new Promise((resolve) => {
        const readlineInterface = readline.createInterface({ input: process.stdin, output: process.stdout });
        readlineInterface.question(chalk.cyan(promptMessage), (userInput) => {
            readlineInterface.close();
            resolve(userInput);
        });
    });
}

// Function to input a password and validate it
function inputPassword() {
    const expectedPassword = 'password'; // Expected password
    const userInput = readlineSync.question('Enter your password: ', { hideEchoBack: true, mask: '' });

    // If the password is incorrect, terminate the process
    if (userInput !== expectedPassword) {
        console.error(chalk.red('Incorrect password!'));
        console.error(chalk.red('Access denied.'));
        process.exit(1);
    }
}

// Function to parse proxy details from a string
function parseProxy(proxyString) {
    const parts = proxyString.split(/[@:]/); // Split by '@' and ':'
    if (parts.length === 4) {
        const [username, password, host, port] = parts;
        return { username, password, host, port };
    } else {
        throw new Error('Invalid proxy format: ' + proxyString);
    }
}


// Function to create a new Ethereum wallet using ethers.js
async function createWallet() {
    return ethers.Wallet.createRandom(); // Create a new random wallet
}


// Function to get the public IP address using a proxy
async function getPublicIp(proxyDetails) {
    try {
        const { username, password, host, port } = parseProxy(proxyDetails);
        
        const proxyUrl = `http://${username}:${password}@${host}:${port}`;
        const agent = new HttpsProxyAgent(proxyUrl);

        const response = await axios.get('https://api.ipify.org', { httpAgent: agent, httpsAgent: agent });
        const ip = response.data.ip;

        const ipInfo = await axios.get(`https://ipinfo.io/${ip}/json`);
        const ipType = ipInfo.data.org && (ipInfo.data.org.includes('Hosting') || ipInfo.data.org.includes('Data Center')) ? 'Hosting' : 'Residential';

        return { ip, ipType };
    } catch (error) {
        console.error(chalk.red('Failed to get IP:', error.message));
        return null;
    }
}


// Main function to send referral using the generated wallet and proxy
async function sendReferral(wallet, proxy, referralCode, index) {
    const provider = new ethers.providers.JsonRpcProvider('your_rpc_url');
    wallet = wallet.connect(provider);

    const referralMessage = 'Your referral message';
    const signature = await wallet.signMessage(referralMessage);
    const referralData = { signature, referralCode, address: wallet.address };

    if (proxy) {
        const { username, password, host, port } = parseProxy(proxy);
        const proxyUrl = `http://${username}:${password}@${host}:${port}`;
        const agent = new HttpsProxyAgent(proxyUrl);
        axios.defaults.httpsAgent = agent;
        axios.defaults.httpAgent = agent;
    } else {
        console.log(chalk.yellow('Proxy not connected!'));
    }

    try {
        const ipData = await getPublicIp(proxy);
        if (ipData) {
            await axios.post(url, referralData, { headers });
            console.log(chalk.green(`SUCCESS | Referral ${index} | Address: ${wallet.address} | IP: ${ipData.ip} | Type: ${ipData.ipType}`));
        }
    } catch (error) {
        console.error(chalk.red(`Error for wallet ${wallet.address}:`, error.response ? error.response.data : error.message));
    }
}


// Function to generate a random delay within a specified range
function delay(min, max) {
  const randomDelay = Math.random() * (max - min) + min;
  return new Promise(resolve => setTimeout(resolve, randomDelay));
}

// Main script execution
(async () => {
  // Input the password
  inputPassword();

  // Load referral code and proxies from files
  const referralCode = readlineSync.question('Enter referral code:'),
    proxies = fs.readFileSync(proxyFilePath, 'utf8').split('\n').map(proxy => proxy.trim()).filter(Boolean);

  let successCount = 0;

  // Loop through proxies and create wallets for each
  for (let i = 0; i < proxies.length; i++) {
    const proxy = proxies[i];
    const wallet = await createWallet();
    await sendReferral(wallet, proxy, referralCode, i + 1);
    successCount++;
    fs.appendFileSync(logFile, `${wallet.address}\n`);

    // Random delay before the next referral
    await delay(25000, 50000);
  }

  console.log(chalk.green(`Referral process complete. Total successful referrals: ${successCount}`));
})();

