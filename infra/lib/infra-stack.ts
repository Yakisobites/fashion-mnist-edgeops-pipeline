import * as cdk from 'aws-cdk-lib';
import * as s3 from 'aws-cdk-lib/aws-s3';
import * as dynamodb from 'aws-cdk-lib/aws-dynamodb';
import * as iam from 'aws-cdk-lib/aws-iam';
import * as iot from 'aws-cdk-lib/aws-iot';
import { Construct } from 'constructs';

export class InfraStack extends cdk.Stack {
  constructor(scope: Construct, id: string, props?: cdk.StackProps) {
    super(scope, id, props);

    // 低確信度画像保存用 S3 バケット
    const imageBucket = new s3.Bucket(this, 'FashionMnistImageBucket', {
      removalPolicy: cdk.RemovalPolicy.DESTROY,
      autoDeleteObjects: true,
      blockPublicAccess: s3.BlockPublicAccess.BLOCK_ALL,
      encryption: s3.BucketEncryption.S3_MANAGED,
    });

    // 推論データ保存用 DynamoDB テーブル
    const inferenceTable = new dynamodb.Table(this, 'FashionMnistInferenceTable', {
      partitionKey: { name: 'id', type: dynamodb.AttributeType.STRING },
      sortKey: { name: 'timestamp', type: dynamodb.AttributeType.NUMBER },
      billingMode: dynamodb.BillingMode.PAY_PER_REQUEST,
      removalPolicy: cdk.RemovalPolicy.DESTROY,
    });

    // 1. IoT Rule が DynamoDB に書き込むための IAM ロール
    const iotRole = new iam.Role(this, 'IotToDynamoDBRole', {
      assumedBy: new iam.ServicePrincipal('iot.amazonaws.com'),
    });

    inferenceTable.grantWriteData(iotRole);

    // 2. IoT Topic Rule (device/inference/data へのメッセージを DynamoDB へ自動書き込み)
    new iot.CfnTopicRule(this, 'InferenceDataTopicRule', {
      topicRulePayload: {
        sql: "SELECT * FROM 'device/inference/data'",
        actions: [
          {
            dynamoDBv2: {
              putItem: {
                tableName: inferenceTable.tableName,
              },
              roleArn: iotRole.roleArn,
            },
          },
        ],
        ruleDisabled: false,
      },
    });

    // リソース名の出力
    new cdk.CfnOutput(this, 'ImageBucketName', {
      value: imageBucket.bucketName,
    });
    new cdk.CfnOutput(this, 'InferenceTableName', {
      value: inferenceTable.tableName,
    });
  }
}
