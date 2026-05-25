# Static Charts

## Overview

Create static charts using matplotlib and seaborn for publication-quality visualizations.

## Matplotlib Charts

### Basic Line Chart

```typescript
const code = `
import matplotlib.pyplot as plt

x = [1, 2, 3, 4, 5]
y = [2, 4, 6, 8, 10]

plt.figure(figsize=(10, 6))
plt.plot(x, y, marker='o')
plt.xlabel('X Axis')
plt.ylabel('Y Axis')
plt.title('Line Chart')
plt.grid(True)
plt.show()
`;

await sbx.runCode(code);
```

### Bar Chart

```typescript
const code = `
import matplotlib.pyplot as plt

categories = ['A', 'B', 'C', 'D']
values = [10, 24, 36, 18]

plt.figure(figsize=(10, 6))
plt.bar(categories, values, color='steelblue')
plt.xlabel('Categories')
plt.ylabel('Values')
plt.title('Bar Chart')
plt.show()
`;

await sbx.runCode(code);
```

## Seaborn Charts

### Heatmap

```typescript
const code = `
import seaborn as sns
import matplotlib.pyplot as plt
import numpy as np

data = np.random.randn(10, 10)
plt.figure(figsize=(10, 8))
sns.heatmap(data, cmap='coolwarm')
plt.title('Heatmap')
plt.show()
`;

await sbx.runCode(code);
```

### Distribution Plot

```typescript
const code = `
import seaborn as sns
import numpy as np

data = np.random.randn(1000)
sns.histplot(data, kde=True)
plt.title('Distribution')
plt.show()
`;

await sbx.runCode(code);
```

## Customization

### Colors and Styles

```typescript
const code = `
import matplotlib.pyplot as plt

plt.style.use('seaborn-v0_8-darkgrid')
x = [1, 2, 3, 4, 5]
y = [2, 4, 6, 8, 10]

plt.plot(x, y, color='red', linewidth=2, marker='o')
plt.title('Styled Chart')
plt.show()
`;

await sbx.runCode(code);
```

## Best Practices

1. Set figure size appropriately
2. Use clear labels and titles
3. Add gridlines for readability
4. Choose colors carefully
5. Save high-resolution images
