# Pre-installed Libraries

## Overview

E2B Code Interpreter comes with pre-installed libraries for common data science and analysis tasks.

## Python Libraries

### Data Processing
- **pandas**: Data manipulation and analysis
- **numpy**: Numerical computing
- **scipy**: Scientific computing

### Visualization
- **matplotlib**: Static plotting
- **seaborn**: Statistical visualization
- **plotly**: Interactive charts

### Machine Learning
- **scikit-learn**: ML algorithms
- **tensorflow**: Deep learning
- **pytorch**: Neural networks

### Data Analysis
- **statsmodels**: Statistical modeling
- **sympy**: Symbolic mathematics

## Using Pre-installed Libraries

```typescript
const code = `
import pandas as pd
import numpy as np
import matplotlib.pyplot as plt

# All libraries available without installation
data = np.random.randn(100)
df = pd.DataFrame({'values': data})
plt.hist(df['values'])
plt.show()
`;

await sbx.runCode(code);
```

## Check Available Packages

```typescript
const code = `
import pip
installed_packages = pip.get_installed_distributions()
for package in installed_packages:
  print(f"{package.key}=={package.version}")
`;

await sbx.runCode(code);
```

## Install Additional Packages

```typescript
// Install via pip
await sbx.commands.run('pip install requests');

const code = `
import requests
response = requests.get('https://api.example.com')
print(response.status_code)
`;

await sbx.runCode(code);
```

## Common Pre-installed Packages

- requests
- beautifulsoup4
- lxml
- pillow
- openpyxl
- sqlalchemy
- redis
- pymongo
- psycopg2

## Best Practices

1. Check package availability first
2. Use version pinning for reproducibility
3. Install only needed packages
4. Keep dependencies minimal
5. Document package requirements
