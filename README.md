# nslog

nslog is a structured logger for NestJS. In production, you can output logs in JSON format, making it compatible with services like [Cloud Logging](https://cloud.google.com/logging/docs/structured-logging). In local development, you can output logs in a color-coded format in the terminal for easy viewing.

## Example

### JSON format

![json](https://github.com/ubie-oss/nslog/raw/main/assets/json.png)

### Text format

![text](https://github.com/ubie-oss/nslog/raw/main/assets/text.png)

## Installation

```
npm install --save @ubie/nslog
```

## Usage

```typescript
import { NestFactory } from "@nestjs/core";
import { StructuredLogger } from "@ubie/nslog";

async function bootstrap() {
  const app = await NestFactory.create(AppModule, { bufferLogs: true });
  app.useLogger(new StructuredLogger({ logLevel: "debug", format: "json" }));

  await app.listen(3000);
}
```

```typescript
import { Logger, Injectable } from "@nestjs/common";

@Injectable()
class MyService {
  private readonly logger = new Logger(MyService.name);

  doSomething() {
    this.logger.log("Doing something...");
  }
}
```

see also: https://docs.nestjs.com/techniques/logger

### Additional common parameter

If you have common parameters that you want to output in all logs, you can override the `printMessage`.

```typescript
import { Injectable } from "@nestjs/common";
import {
  PrintMessageArgs,
  StructuredLogger,
  StructuredLoggerOptions,
} from "./structured-logger";

@Injectable()
class MyLogger extends StructuredLogger {
  protected printMessage(args: PrintMessageArgs): void {
    args.params.push({ requestId: getRequestId() });
    super.printMessage(args);
  }
}
```

### Error logging

Passing an Error object to `logger.error` is handled specially.

```typescript
const new Error("something went wrong");
logger.error(err);
```

This will be output as follows.

```json
{
  "severity": "ERROR",
  "message": "something went wrong",
  "stack_trace": "Error: something went wrong\n    at Object.<anonymous> (/path/to/app.js:1:13)\n    at Module._compile (node:internal/modules/cjs/loader:1376:14)\n    at Module._extensions..js (node:internal/modules/cjs/loader:1435:10)\n    at Module.load (node:internal/modules/cjs/loader:1207:32)\n    at Module._load (node:internal/modules/cjs/loader:1023:12)\n    at Function.executeUserEntryPoint [as runMain] (node:internal/modules/run_main:135:12)\n    at node:internal/main/run_main_module:28:49"
}
```

## License

[MIT License](https://github.com/ubie-oss/nslog/blob/main/LICENSE).
