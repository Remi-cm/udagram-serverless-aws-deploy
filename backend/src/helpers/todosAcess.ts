import * as AWS from 'aws-sdk'
//import * as AWSXRay from 'aws-xray-sdk'
const AWSXRay = require('aws-xray-sdk')
import { DocumentClient } from 'aws-sdk/clients/dynamodb'
import { createLogger } from '../utils/logger'
import { TodoItem } from '../models/TodoItem'
//import { TodoUpdate } from '../models/TodoUpdate';
import { UpdateTodoRequest } from '../requests/UpdateTodoRequest'


const XAWS = AWSXRay.captureAWS(AWS)

const logger = createLogger('TodosAccess')

// TODO: Implement the dataLayer logic

export class TodosAccess {
    constructor(
        private readonly docClient: DocumentClient = new XAWS.DynamoDB.DocumentClient(),
        private readonly todosTable = process.env.TODOS_TABLE,
        private readonly createdAtIndex = process.env.TODOS_CREATED_AT_INDEX
    ) {}

    async createTodo(todoItem: TodoItem){
        logger.info('creating todo item in todosAccess', todoItem)

        await this.docClient.put({
            TableName: this.todosTable,
            Item: todoItem
        }).promise()
    }

    async deleteTodo(todoId: string, userId: string){
        logger.info('Deleting todo item '+todoId)
        await this.docClient.delete({
            TableName: this.todosTable,
            Key: {
                userId: userId,
                todoId: todoId
            }
        }).promise()
    }

    async getTodosForUser(userId: string){
        const result = await this.docClient.query({
            TableName: this.todosTable,
            IndexName: this.createdAtIndex,
            KeyConditionExpression: 'userId = :userId',
            ExpressionAttributeValues: {
                ':userId': userId
            }
        }).promise()

        logger.info(`ToDos for :${userId} retrieved`, result)

        return result
    }

    async updateTodo(userId: string, todoId: string, updatedTodo: UpdateTodoRequest){
        logger.info('ToDo updating...', updatedTodo)

        await this.docClient.update({
            TableName: this.todosTable,
            Key: {
                userId: userId,
                todoId: todoId
            },
            UpdateExpression: "set dueDate = :dueDate, done = :done",
            ExpressionAttributeValues: {
              ":dueDate": updatedTodo.dueDate,
              ":done": updatedTodo.done
            }
        }).promise()

        logger.info('The ToDo item has been updated', updatedTodo)

        return updatedTodo
    }
}