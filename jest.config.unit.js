const config = require('./jest.config');

console.log('------------------------------------------------------------------------------------------');
console.log('RUNNING UNIT TESTS');
console.log('------------------------------------------------------------------------------------------');

module.exports = {
    ...config,
    testMatch: [
        '**/*unit.test.ts',
    ]
}