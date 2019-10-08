require('dotenv').config();
const { range, pick } = require('lodash');
const axios = require('axios');

const stargazersURL = (owner, repo, page) => `https://api.github.com/repos/${owner}/${repo}/stargazers?page=${page}`;
const ACCEPT_HEADER = {Accept: 'application/vnd.github.v3.star+json'};

const log = (...args) => console.error.apply(console, args);

const CONFIG = {
    token: process.env.GITHUB_TOKEN,
    username: process.env.GITHUB_USERNAME
};

const OWNER = 'request';
const REPO = 'request';
const AUTH_OPTIONS = {auth: {username: CONFIG.username, password: CONFIG.token}};

async function request(url, options){
    return axios.get(url, options);
}

function extractTotalPages(link){
    let nextPart = link.split(',')[1];
    if (nextPart) {
        nextPart = nextPart.split('=')[1];
        if (nextPart) {
            nextPart = nextPart.split('>')[0];
            if (nextPart) {
                return Number(nextPart);
            }
        }
    }
    return null;
}
function joinLine(arr){
    return arr.join("\t");
}
function formatResult(result){
    console.log(joinLine([result.login, result.email, result.location, result.name, result.starred_at]));
}

async function processStargazers(data){
    for (let userData of data) {
        const response  =await request(userData.user.url, AUTH_OPTIONS);
        const result = {...pick(response.data, ['email', 'name', 'location', 'login']), starred_at: userData.starred_at};
        console.log(formatResult(result));
        throw 'Done!';
    }
}



async function main(){
    let parsedPages = false;
    let to_process = [
        stargazersURL(OWNER, REPO, 1)
    ];

    while (to_process.length) {
        let nextUrl = to_process.shift();
        const response = await request(nextUrl, {...AUTH_OPTIONS, headers: ACCEPT_HEADER});
        if (!parsedPages) {
            if (response.headers.link) {
                const totalPages = extractTotalPages(response.headers.link);
                if (totalPages) {
                    const lower = 2, upper = Math.min(totalPages + 1, 3);
                    to_process = [
                        ...to_process,
                        ...range(lower, upper).map(
                            pageNum => stargazersURL(OWNER, REPO, pageNum)
                        )
                    ];
                }
            }
            console.log(joinLine(['username', 'email', 'location', 'name', 'starred_at']));
            parsedPages = true;
        }
        await processStargazers(response.data);
    }
}


main().then(() => process.exit(0));
