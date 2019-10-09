require('dotenv').config();
const { pick, get } = require('lodash');

const argv = require('yargs')
    .usage('Usage: $0 <owner> <repo> [options]')
    .alias('s', 'start')
    .describe('s', 'start page')
    .demandCommand(2)
    .argv;

const [owner, repo] = argv._;
const api = require('./lib/api')({
    username: process.env.GITHUB_USERNAME,
    token: process.env.GITHUB_TOKEN,
    startPage: argv.start || 1,
    owner,
    repo
});

const joinLine = arr => arr.join("\t");
const maybeNotAvailable = str => str || 'N/A';
const formatResult = result => joinLine([result.login, result.email, result.location, result.name, result.starred_at].map(maybeNotAvailable));

async function main() {
    console.log(joinLine(['username', 'email', 'location', 'name', 'starred_at']));
    while (!api.done()) {
        const stargazersData = await api.nextPage();
        for (let userData of stargazersData) {
            const response = await api.geUserData(userData.user.url);
            const result = {
                ...pick(response.data, ['email', 'name', 'location', 'login']),
                starred_at: userData.starred_at
            };
            console.log(formatResult(result));
        }
    }
}

main().then(
    () => process.exit(0),
    error => {
        const githubResponseError = get(error, 'response.data.message');
        const errorText = githubResponseError || (error.toString ? error.toString() : error);
        console.error(errorText);
    }
);