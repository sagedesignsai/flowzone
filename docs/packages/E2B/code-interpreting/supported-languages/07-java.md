# Java

## Overview

Run Java code inside the sandbox for enterprise applications and system programming.

## Basic Usage

```typescript
import { Sandbox } from '@e2b/code-interpreter';

const sbx = await Sandbox.create();
const code = `
public class HelloWorld {
  public static void main(String[] args) {
    System.out.println("Hello, world!");
  }
}
`;

const execution = await sbx.runCode(code, { language: 'java' });
console.log(execution);
```

## Features

- Full Java support
- Compilation and execution
- Maven for package management
- Standard library access
- Multi-threaded support

## Class Definition

```typescript
const code = `
public class Calculator {
  public static int add(int a, int b) {
    return a + b;
  }
  
  public static void main(String[] args) {
    System.out.println(add(5, 3));
  }
}
`;

await sbx.runCode(code, { language: 'java' });
```

## Using Libraries

```typescript
await sbx.commands.run('mvn dependency:resolve');

const code = `
import org.json.JSONObject;

public class JsonExample {
  public static void main(String[] args) {
    JSONObject obj = new JSONObject();
    obj.put("name", "John");
    System.out.println(obj);
  }
}
`;

await sbx.runCode(code, { language: 'java' });
```

## Best Practices

1. Use proper class structure
2. Handle exceptions
3. Use Maven for dependencies
4. Follow naming conventions
5. Compile before execution
