const axios = require('axios');
const { range } = require('lodash');

function extractTotalPages(link) {
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

module.exports = function ({username, token, startPage, owner, repo}) {
    const ACCEPT_HEADER = {Accept: 'application/vnd.github.v3.star+json'};
    const AUTH_OPTIONS = {auth: {username, password: token}};

    const request = (url, options) => axios.get(url, options);
    const stargazersURL = page => `https://api.github.com/repos/${owner}/${repo}/stargazers?page=${page}`;

    let done = false;
    const finish  = () => done = true;
    let totalPages = -1;
    let to_process = [stargazersURL(startPage)];

    return {
        done: () => done,
        nextPage: async function () {
            if (done) return [];
            let nextUrl = to_process.shift();
            const response = await request(nextUrl, {...AUTH_OPTIONS, headers: ACCEPT_HEADER});
            if (totalPages && (totalPages < 0)) {
                if (response.headers.link) {
                    totalPages = extractTotalPages(response.headers.link);
                    if (totalPages && (totalPages > startPage)) {
                        const lower = startPage + 1, upper = totalPages + 1;
                        to_process.push.apply(to_process, range(lower, upper).map(stargazersURL));
                    } else {
                        finish();
                    }
                }
            }
            if (!to_process.length) finish();
            return response.data;
        },
        geUserData: userUrl => request(userUrl, AUTH_OPTIONS)
    }
};