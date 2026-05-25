# Python

## Overview

Run Python code inside the sandbox using the `runCode()` method.

## Basic Usage

```typescript
import { Sandbox } from '@e2b/code-interpreter';

const sbx = await Sandbox.create();
const execution = await sbx.runCode('print("Hello, world!")');
console.log(execution);
```

## Features

- Full Python 3 support
- Data science libraries pre-installed
- Package installation via pip
- Matplotlib for visualizations
- NumPy, Pandas, SciPy support

## Common Use Cases

### Data Processing

```typescript
const code = `
import pandas as pd
data = {'A': [1, 2, 3], 'B': [4, 5, 6]}
df = pd.DataFrame(data)
print(df.describe())
`;

await sbx.runCode(code);
```

### Scientific Computing

```typescript
const code = `
import numpy as np
arr = np.array([1, 2, 3, 4, 5])
print(f"Mean: {arr.mean()}")
print(f"Std: {arr.std()}")
`;

await sbx.runCode(code);
```

### Visualization

```typescript
const code = `
import matplotlib.pyplot as plt
plt.plot([1, 2, 3], [1, 4, 9])
plt.show()
`;

await sbx.runCode(code);
```

## Best Practices

1. Use virtual environments for isolation
2. Install dependencies before use
3. Handle exceptions properly
4. Stream output for long operations
5. Clean up resources after execution
