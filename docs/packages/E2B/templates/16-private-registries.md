# Private Registries

## Overview
How to access private registries as the base image for your templates.

## General Registry

Access any private registry with username and password:

```typescript
Template().fromImage('ubuntu:22.04', {
  username: 'user',
  password: 'pass',
});
```

## GCP Artifact Registry

Access Google Cloud Platform Artifact Registry:

### From File Path

```typescript
Template().fromGCPRegistry('ubuntu:22.04', {
  serviceAccountJSON: './service_account.json',
});
```

### From Object

```typescript
Template().fromGCPRegistry('ubuntu:22.04', {
  serviceAccountJSON: { 
    project_id: '123', 
    private_key_id: '456' 
  },
});
```

## AWS ECR

Access Amazon Elastic Container Registry:

```typescript
Template().fromAWSRegistry('ubuntu:22.04', {
  accessKeyId: '123',
  secretAccessKey: '456',
  region: 'us-west-1',
});
```

## Authentication Methods

### Basic Authentication

```typescript
Template().fromImage('registry.example.com/image:tag', {
  username: 'username',
  password: 'password',
});
```

### GCP Service Account

```typescript
Template().fromGCPRegistry('image:tag', {
  serviceAccountJSON: {
    type: 'service_account',
    project_id: 'my-project',
    private_key_id: 'key-id',
    private_key: '-----BEGIN PRIVATE KEY-----\n...\n-----END PRIVATE KEY-----\n',
    client_email: 'service-account@project.iam.gserviceaccount.com',
    client_id: '123456789',
    auth_uri: 'https://accounts.google.com/o/oauth2/auth',
    token_uri: 'https://oauth2.googleapis.com/token',
  },
});
```

### AWS Credentials

```typescript
Template().fromAWSRegistry('123456789.dkr.ecr.us-west-1.amazonaws.com/image:tag', {
  accessKeyId: 'AKIAIOSFODNN7EXAMPLE',
  secretAccessKey: 'wJalrXUtnFEMI/K7MDENG/bPxRfiCYEXAMPLEKEY',
  region: 'us-west-1',
});
```

## Security Best Practices

1. **Never hardcode credentials**: Use environment variables
2. **Use service accounts**: Prefer service accounts over user credentials
3. **Limit permissions**: Grant minimal required permissions
4. **Rotate credentials**: Regularly rotate access keys
5. **Use secrets management**: Store credentials securely

## Example: Secure Credential Handling

```typescript
import { Template } from 'e2b';

const template = Template()
  .fromGCPRegistry('gcr.io/my-project/my-image:latest', {
    serviceAccountJSON: JSON.parse(
      process.env.GCP_SERVICE_ACCOUNT_JSON || '{}'
    ),
  });
```

## Environment Variables

Set credentials via environment variables:

```bash
# GCP
export GCP_SERVICE_ACCOUNT_JSON='{"project_id":"...","private_key":"..."}'

# AWS
export AWS_ACCESS_KEY_ID='AKIAIOSFODNN7EXAMPLE'
export AWS_SECRET_ACCESS_KEY='wJalrXUtnFEMI/K7MDENG/bPxRfiCYEXAMPLEKEY'
export AWS_REGION='us-west-1'
```

## Troubleshooting

### Authentication Failed
- Verify credentials are correct
- Check registry URL format
- Ensure credentials have pull permissions
- Verify network connectivity

### Image Not Found
- Confirm image exists in registry
- Check image name and tag
- Verify registry access permissions
- Check image visibility settings

### Permission Denied
- Verify service account permissions
- Check IAM roles and policies
- Ensure credentials are not expired
- Review registry access controls

## Registry URLs

### Docker Hub
```
docker.io/library/image:tag
```

### GCP Artifact Registry
```
gcr.io/project-id/image:tag
us-docker.pkg.dev/project-id/repository/image:tag
```

### AWS ECR
```
123456789.dkr.ecr.region.amazonaws.com/image:tag
```

### Azure Container Registry
```
myregistry.azurecr.io/image:tag
```

## Best Practices

1. Use specific image tags (avoid `latest`)
2. Regularly update base images
3. Scan images for vulnerabilities
4. Document registry requirements
5. Test registry access before production
6. Monitor registry usage and costs
