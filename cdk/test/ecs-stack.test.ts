import * as cdk from 'aws-cdk-lib';
import { Match, Template } from 'aws-cdk-lib/assertions';
import * as ecr from 'aws-cdk-lib/aws-ecr';
import { EcsStack } from '../lib/ecs-stack';

test('creates an on-demand rate-limit table with TTL and email configuration', () => {
  const app = new cdk.App();
  const repositoryStack = new cdk.Stack(app, 'RepositoryStack', {
    env: { account: '111111111111', region: 'us-east-1' },
  });
  const repository = new ecr.Repository(repositoryStack, 'Repository');
  const stack = new EcsStack(app, 'EcsStack', {
    env: { account: '111111111111', region: 'us-east-1' },
    repository,
  });
  const template = Template.fromStack(stack);

  template.hasResourceProperties('AWS::DynamoDB::Table', {
    BillingMode: 'PAY_PER_REQUEST',
    TimeToLiveSpecification: {
      AttributeName: 'expiresAt',
      Enabled: true,
    },
    KeySchema: [{ AttributeName: 'itemId', KeyType: 'HASH' }],
  });

  template.hasResourceProperties('AWS::IAM::Policy', {
    PolicyDocument: {
      Statement: Match.arrayWith([
        Match.objectLike({ Action: 'dynamodb:UpdateItem' }),
        Match.objectLike({ Action: 'ses:SendEmail' }),
      ]),
    },
  });
});
