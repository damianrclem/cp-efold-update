# cp-efolder-upload

This microservice is a single lambda handles the uploading of new UDN reports from Credit Plus into an eFolder in Encompass.

## Getting started

Run the following commands in order to get started:

```
yarn install
```

## Deployment

In order to deploy from your machine, you are going to run the following commands:

```
sls deploy --stage={whatever environment you to deploy to}
```

This will typically be helpful in testing new changes made to the lambda.

## Tests

This microservice is unit tested and integration tested using Jest.

### Unit tests
To run the unit tests, just run:
```
yarn test:unit
```

### Intgergation tests
In order to run the integration tests, you must make sure that all of the proper environment variables have been set first. Look at the `serverless.yml` file to find out what variables will need set. Once that has been completed, run:
```
yarn test:int
```