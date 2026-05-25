# Interactive Charts

## Overview

Create interactive charts using plotly for web-based visualizations with hover, zoom, and pan capabilities.

## Plotly Express

### Line Chart

```typescript
const code = `
import plotly.express as px
import pandas as pd

df = pd.DataFrame({
  'month': ['Jan', 'Feb', 'Mar', 'Apr', 'May'],
  'sales': [100, 150, 120, 200, 180]
})

fig = px.line(df, x='month', y='sales', title='Monthly Sales')
fig.show()
`;

await sbx.runCode(code);
```

### Bar Chart

```typescript
const code = `
import plotly.express as px

categories = ['A', 'B', 'C', 'D']
values = [10, 24, 36, 18]

fig = px.bar(x=categories, y=values, title='Interactive Bar Chart')
fig.show()
`;

await sbx.runCode(code);
```

### Scatter Plot

```typescript
const code = `
import plotly.express as px
import pandas as pd

df = pd.DataFrame({
  'x': [1, 2, 3, 4, 5],
  'y': [2, 4, 5, 4, 6],
  'size': [10, 20, 30, 40, 50]
})

fig = px.scatter(df, x='x', y='y', size='size', title='Interactive Scatter')
fig.show()
`;

await sbx.runCode(code);
```

## Plotly Graph Objects

### Custom Chart

```typescript
const code = `
import plotly.graph_objects as go

fig = go.Figure()
fig.add_trace(go.Scatter(
  x=[1, 2, 3, 4, 5],
  y=[2, 4, 6, 8, 10],
  mode='lines+markers',
  name='Data'
))

fig.update_layout(
  title='Custom Interactive Chart',
  xaxis_title='X Axis',
  yaxis_title='Y Axis'
)
fig.show()
`;

await sbx.runCode(code);
```

## Features

- Hover tooltips
- Zoom and pan
- Download as PNG
- Legend toggling
- Responsive design

## Best Practices

1. Use meaningful titles
2. Add hover information
3. Use color effectively
4. Keep charts responsive
5. Test interactivity
