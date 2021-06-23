/**
 * In practice, console.log things out so that you can see what the shape is.  Maye you'll use this in a test,
 * maybe you won't, but it's certainly handy to have during developmment when you want a quick refrence for what
 * some event looks like.
 */


// This is just here to give you an idea of what I'm talking about above. This is the shape of
// the createUdnOrder onSuccess destination as it is received by an event bus
const createUdnOrderOnSuccessEvent = {
    "version": "0",
    "id": "1607d681-254b-c1d5-3311-b4a483c3548e",
    "detail-type": "Lambda Function Invocation Result - Success",
    "source": "lambda",
    "account": "709027452869",
    "time": "2021-06-10T14:07:38Z",
    "region": "us-east-2",
    "resources": [
        "arn:aws:events:us-east-2:709027452869:event-bus/CreditPlusEventBus",
        "arn:aws:lambda:us-east-2:709027452869:function:cp-eventbus-functions-dev-createUdnOrder:$LATEST"
    ],
    "detail": {
        "version": "1.0",
        "timestamp": "2021-06-10T14:07:38.026Z",
        "requestContext": {
            "requestId": "5abe7c89-c034-45f0-82a0-8e69b0bcda5f",
            "functionArn": "arn:aws:lambda:us-east-2:709027452869:function:cp-eventbus-functions-dev-createUdnOrder:$LATEST",
            "condition": "Success",
            "approximateInvokeCount": 1
        },
        "requestPayload": {
            "version": "0",
            "id": "6dea72c2-5ba7-2fe2-1d47-a5d531475dba",
            "detail-type": "Loan",
            "source": "com.revolutionmortgage.encompass",
            "account": "709027452869",
            "time": "2021-06-10T14:07:36Z",
            "region": "us-east-2",
            "resources": [],
            "detail": {
                "event": "Milestone Finished",
                "fields": {
                    "Log.MS.CurrentMilestone": "UW REVIEW - SUSP"
                }
            }
        },
        "responseContext": {
            "statusCode": 200,
            "executedVersion": "$LATEST"
        },
        "responsePayload": {
            "example": "Successful value"
        }
    }
};
