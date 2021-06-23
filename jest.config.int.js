const config = require('./jest.config');

console.log('------------------------------------------------------------------------------------------');
console.log('RUNNING INTEGRATION TESTS');
console.log('------------------------------------------------------------------------------------------');

module.exports = {
    ...config,
    testMatch: [
        '**/*int.test.ts',
    ]
}