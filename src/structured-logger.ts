import { LoggerService, Injectable } from "@nestjs/common";

type ColorName =
  | "bold"
  | "green"
  | "yellow"
  | "red"
  | "magentaBright"
  | "cyanBright"
  | "cyan"
  | "gray"
  | "plain";
export type LogLevel =
  | "verbose"
  | "debug"
  | "info"
  | "log"
  | "error"
  | "warn"
  | "fatal";
export type Severity =
  | "verbose"
  | "debug"
  | "info"
  | "error"
  | "warn"
  | "fatal";
export type LogFormat = "text" | "json";

const logLevels: Record<LogLevel, number> = {
  verbose: 0,
  debug: 1,
  log: 2,
  info: 2, // info is an alias of log
  warn: 3,
  error: 4,
  fatal: 5,
};

export type StructuredLoggerOptions = {
  logLevel: LogLevel;
  format: LogFormat;
};

function isPlainObject(obj: unknown): obj is Record<string, unknown> {
  return obj != null && Object.getPrototypeOf(obj) === Object.prototype;
}

@Injectable()
export class StructuredLogger implements LoggerService {
  private logLevel: LogLevel;
  private format: LogFormat;

  constructor(options: StructuredLoggerOptions) {
    this.logLevel = options.logLevel;
    this.format = options.format;
  }

  verbose(messages: unknown, ...optionalParams: unknown[]) {
    if (!this.isLevelEnabled("verbose")) {
      return;
    }
    const { message, params, context } = this.extractMessages([
      messages,
      ...optionalParams,
    ]);
    this.printMessage({ message, params, context, severity: "verbose" });
  }

  debug(messages: unknown, ...optionalParams: unknown[]) {
    if (!this.isLevelEnabled("debug")) {
      return;
    }
    const { message, params, context } = this.extractMessages([
      messages,
      ...optionalParams,
    ]);
    this.printMessage({ message, params, context, severity: "debug" });
  }

  log(messages: unknown, ...optionalParams: unknown[]) {
    if (!this.isLevelEnabled("log")) {
      return;
    }
    const { message, params, context } = this.extractMessages([
      messages,
      ...optionalParams,
    ]);
    this.printMessage({ message, params, context, severity: "info" });
  }

  error(messages: unknown, ...optionalParams: unknown[]) {
    if (!this.isLevelEnabled("error")) {
      return;
    }
    const { message, params, context, stack } = this.extractMessagesWithStack([
      messages,
      ...optionalParams,
    ]);
    this.printMessage({ message, params, stack, context, severity: "error" });
  }

  warn(messages: unknown, ...optionalParams: unknown[]) {
    if (!this.isLevelEnabled("warn")) {
      return;
    }
    const { message, params, context } = this.extractMessages([
      messages,
      ...optionalParams,
    ]);
    this.printMessage({ message, params, context, severity: "warn" });
  }

  fatal(messages: unknown, ...optionalParams: unknown[]) {
    if (!this.isLevelEnabled("fatal")) {
      return;
    }
    const { message, params, context } = this.extractMessages([
      messages,
      ...optionalParams,
    ]);
    this.printMessage({ message, params, context, severity: "fatal" });
  }

  protected isLevelEnabled(level: LogLevel): boolean {
    return logLevels[level] >= logLevels[this.logLevel];
  }

  protected printMessage({
    message,
    params,
    context,
    severity,
    stack,
  }: {
    message: string;
    params: unknown[];
    context: string | null;
    severity: Severity;
    stack?: string | null;
  }): void {
    switch (this.format) {
      case "json":
        this.printJson({ message, params, context, severity, stack });
        break;
      case "text":
        this.printText({ message, params, context, severity, stack });
        break;
    }
  }

  protected printJson({
    message,
    params,
    context,
    severity,
    stack,
  }: {
    message: string;
    params: unknown[];
    context: string | null;
    severity: Severity;
    stack?: string | null;
  }) {
    const output: {
      severity: string;
      time: string;
      message: string;
      requestId?: string;
      stack_trace?: string;
      context?: string;
      params?: unknown[];
    } & Record<string, unknown> = {
      severity: severity.toUpperCase(),
      time: new Date().toISOString(),
      message: message,
    };
    if (stack) {
      output.stack_trace = stack;
    }
    if (context) {
      output.context = context;
    }

    for (const param of params) {
      if (isPlainObject(param)) {
        for (const [k, v] of Object.entries(param)) {
          output[k] = v;
        }
      } else if (param) {
        if (!output.info) output.params = [];
        output.params?.push(param);
      }
    }

    this.print(JSON.stringify(output));
  }

  protected printText({
    message,
    params,
    context,
    severity,
    stack,
  }: {
    message: string;
    params: unknown[];
    context: string | null;
    severity: Severity;
    stack?: string | null;
  }) {
    const output: string[] = [
      // level
      this.colorize(
        severity.toUpperCase(),
        this.getColorNameByLogLevel(severity)
      ),
      // context
      context ? this.colorize(`[${context}]`, "yellow") : "",
      // message
      severity === "error"
        ? this.colorize(message, this.getColorNameByLogLevel(severity))
        : message,
    ];

    for (const param of params) {
      if (isPlainObject(param)) {
        output.push(`${this.formatObject(param)}`);
      } else if (param) {
        output.push(`${this.colorize(`${param}`, "bold")}`);
      }
    }

    this.print(output.filter((t) => t).join(" "));

    if (severity === "error" && stack) {
      this.print(stack);
    }
  }

  protected print(str: string) {
    process.stdout.write(str + "\n");
  }

  protected formatObject(obj: Record<string, unknown>, parentKey = ""): string {
    const values: string[] = [];
    for (const [key, value] of Object.entries(obj)) {
      if (isPlainObject(value)) {
        values.push(this.formatObject(value, `${parentKey}${key}.`));
      } else {
        const k = this.colorize(`${parentKey}${key}`, "cyan");
        if (value === null) {
          values.push(`${k}=${this.colorize("null", "gray")}`);
        } else if (value !== undefined) {
          values.push(`${k}=${value}`);
        }
      }
    }

    return values.join(" ");
  }

  protected extractMessages(messages: unknown[]): {
    message: string;
    params: unknown[];
    context: string | null;
  } {
    let message = "";
    let params: unknown[] = [];
    if (typeof messages[0] === "string") {
      message = messages[0];
      params = messages.slice(1);
    } else {
      params = messages;
    }

    if (params.length === 0) {
      return { message, params, context: null };
    }

    const last = params[params.length - 1];
    if (typeof last === "string") {
      return {
        message,
        params: params.slice(0, params.length - 1),
        context: last,
      };
    } else {
      return { message, params, context: null };
    }
  }

  protected extractMessagesWithStack(args: unknown[]): {
    message: string;
    params: unknown[];
    context: string | null;
    stack?: string | null;
  } {
    // error(message: unknown, stackOrContext?: string)
    if (args.length === 2) {
      const last = args[1];
      if (this.isStackFormat(last)) {
        if (typeof args[0] === "string") {
          return {
            message: args[0],
            params: [],
            context: null,
            stack: last,
          };
        } else {
          return {
            message: "",
            params: [args[0]],
            context: null,
            stack: last,
          };
        }
      } else {
        return this.extractMessages(args);
      }
    }

    // error(message: unknown, stack?: string, context?: string)
    if (args.length === 3) {
      const [first, second, last] = args;
      if (!this.isStackFormat(second)) {
        return this.extractMessages(args);
      }

      let message = "";
      let params: unknown[] = [];
      if (typeof first === "string") {
        message = first;
        params = [];
      } else {
        params = [first];
      }

      if (typeof last === "string") {
        return {
          message,
          params,
          context: last,
          stack: second,
        };
      } else if (last === undefined) {
        return {
          message,
          params,
          context: null,
          stack: second,
        };
      } else {
        return this.extractMessages(args);
      }
    }

    // other
    return this.extractMessages(args);
  }

  protected isStackFormat(stack: unknown): stack is string {
    if (typeof stack !== "string") {
      return false;
    }

    return /^(.)+\n\s+at .+:\d+:\d+/.test(stack);
  }

  protected colorize(text: string, colorName: ColorName) {
    if (!text) return "";

    switch (colorName) {
      case "bold":
        return `\x1B[1m${text}\x1B[0m`;
      case "green":
        return `\x1B[32m${text}\x1B[39m`;
      case "yellow":
        return `\x1B[33m${text}\x1B[39m`;
      case "red":
        return `\x1B[31m${text}\x1B[39m`;
      case "magentaBright":
        return `\x1B[95m${text}\x1B[39m`;
      case "cyanBright":
        return `\x1B[96m${text}\x1B[39m`;
      case "cyan":
        return `\x1B[36m${text}\x1B[39m`;
      case "gray":
        return `\x1B[90m${text}\x1B[39m`;
      case "plain":
        return text;
    }
  }

  protected getColorNameByLogLevel(severity: Severity): ColorName {
    switch (severity) {
      case "verbose":
        return "cyanBright";
      case "info":
        return "green";
      case "debug":
        return "magentaBright";
      case "warn":
        return "yellow";
      case "error":
        return "red";
      case "fatal":
        return "bold";
      default:
        return "plain";
    }
  }
}
