# Create Charts and Visualizations

## Overview

Create static and interactive charts using E2B Code Interpreter with matplotlib, seaborn, and plotly.

## Static Charts

Create static visualizations with matplotlib:

```typescript
const code = `
import matplotlib.pyplot as plt

# Bar chart
categories = ['A', 'B', 'C', 'D']
values = [10, 24, 36, 18]
plt.bar(categories, values)
plt.title('Bar Chart')
plt.show()
`;

await sbx.runCode(code);
```

## Interactive Charts

Create interactive visualizations with plotly:

```typescript
const code = `
import plotly.express as px
import pandas as pd

df = pd.DataFrame({
  'x': [1, 2, 3, 4, 5],
  'y': [10, 15, 13, 17, 20]
})

fig = px.line(df, x='x', y='y', title='Interactive Line Chart')
fig.show()
`;

await sbx.runCode(code);
```

## Common Chart Types

### Line Chart

```typescript
const code = `
import matplotlib.pyplot as plt

x = [1, 2, 3, 4, 5]
y = [2, 4, 6, 8, 10]
plt.plot(x, y)
plt.xlabel('X')
plt.ylabel('Y')
plt.title('Line Chart')
plt.show()
`;

await sbx.runCode(code);
```

### Scatter Plot

```typescript
const code = `
import matplotlib.pyplot as plt

x = [1, 2, 3, 4, 5]
y = [2, 4, 5, 4, 6]
plt.scatter(x, y)
plt.title('Scatter Plot')
plt.show()
`;

await sbx.runCode(code);
```

### Histogram

```typescript
const code = `
import matplotlib.pyplot as plt
import numpy as np

data = np.random.randn(1000)
plt.hist(data, bins=30)
plt.title('Histogram')
plt.show()
`;

await sbx.runCode(code);
```

## Best Practices

1. Use appropriate chart types
2. Label axes clearly
3. Add titles and legends
4. Use color effectively
5. Keep charts simple and readable
