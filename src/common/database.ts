import { DynamoDBClient } from "@aws-sdk/client-dynamodb";
import { DynamoDBDocument, GetCommandOutput } from "@aws-sdk/lib-dynamodb";
import get from 'lodash/get';

/**
 * Create a DynamoDB Client
 * @returns {DynamoDBDocument}
 */
const createDynamoDBClient = (): DynamoDBDocument => {
  const dynamoDbClient = new DynamoDBClient({
    region: 'us-east-2',
  });

  return DynamoDBDocument.from(dynamoDbClient, {
    marshallOptions: {
      removeUndefinedValues: true,
    }
  });
}

const getTableName = () => get(process, 'env.TABLE_NAME');

/**
 * Get an item from dynamodb
 * @param {string} PK - The PK of the item
 * @param {string} SK - The SK of the item
 * @returns {Promise<GetCommandOutput>}
 */
export const getItem = async (key: {
  [key: string]: any
}): Promise<GetCommandOutput> => {
  const dynamoDbClient = createDynamoDBClient();
  const tableName = getTableName();

  return await dynamoDbClient.get({
    TableName: tableName,
    Key: key
  })
}

/**
 * Puts an item into dynamodb
 * @param {Object} item - Item to put into dynamodb
 * @returns {Promise<void>}
 */
export const putItem = async (item: {
  [key: string]: any
}): Promise<void> => {
  const dynamoDBClient = createDynamoDBClient();
  const tableName = getTableName();

  await dynamoDBClient.put({
    TableName: tableName,
    Item: item,
  })
}