module.exports = (wallaby) => {
    return {
        files: [
            'src/**/*.ts',
            '!__tests__/**'
        ],
        tests: [
            '__tests__/unit/**',
            '__tests__/integration/**',
        ],
        runMode: 'onsave'
    }
}