const config = require('./jest.config');

console.log('------------------------------------------------------------------------------------------');
console.log('RUNNING END TO END TESTS');
console.log('------------------------------------------------------------------------------------------');

module.exports = {
    ...config,
    testMatch: [
        '**/*int.e2e.ts',
    ]
}