# Analyze Data with AI

## Overview

Use E2B Code Interpreter to analyze data with AI models and machine learning.

## Data Analysis Workflow

1. Load data
2. Process and clean
3. Analyze with AI/ML
4. Visualize results
5. Export findings

## Basic Data Analysis

```typescript
import { Sandbox } from '@e2b/code-interpreter';

const sbx = await Sandbox.create();

const code = `
import pandas as pd
import numpy as np

# Load data
data = {'A': [1, 2, 3, 4, 5], 'B': [10, 20, 30, 40, 50]}
df = pd.DataFrame(data)

# Analyze
print("Mean:", df.mean())
print("Correlation:", df.corr())
`;

await sbx.runCode(code);
```

## Machine Learning

```typescript
const code = `
from sklearn.datasets import load_iris
from sklearn.model_selection import train_test_split
from sklearn.ensemble import RandomForestClassifier

# Load data
iris = load_iris()
X_train, X_test, y_train, y_test = train_test_split(
  iris.data, iris.target, test_size=0.2
)

# Train model
model = RandomForestClassifier()
model.fit(X_train, y_train)

# Evaluate
score = model.score(X_test, y_test)
print(f"Accuracy: {score}")
`;

await sbx.runCode(code);
```

## Statistical Analysis

```typescript
const code = `
import scipy.stats as stats
import numpy as np

data = np.array([1, 2, 3, 4, 5, 6, 7, 8, 9, 10])

# Descriptive statistics
print("Mean:", np.mean(data))
print("Std Dev:", np.std(data))

# T-test
t_stat, p_value = stats.ttest_1samp(data, 5)
print(f"T-statistic: {t_stat}, P-value: {p_value}")
`;

await sbx.runCode(code);
```

## Best Practices

1. Clean data before analysis
2. Handle missing values
3. Validate results
4. Document assumptions
5. Use appropriate models
