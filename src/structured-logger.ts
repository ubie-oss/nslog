import { LogLevel, LoggerService } from "@nestjs/common";

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
type LogFormat = "text" | "json";
type Severity = "verbose" | "debug" | "info" | "error" | "warn" | "fatal";

const logLevels: Record<LogLevel, number> = {
  verbose: 0,
  debug: 1,
  log: 2,
  warn: 3,
  error: 4,
  fatal: 5,
};

interface StructuredLoggerOptions {
  logLevel: LogLevel;
  format: LogFormat;
}

function isPlainObject(obj: unknown): obj is Record<string, unknown> {
  return obj != null && Object.getPrototypeOf(obj) === Object.prototype;
}

export class StructuredLogger implements LoggerService {
  private logLevel: LogLevel;
  private format: LogFormat;

  constructor(options: StructuredLoggerOptions) {
    this.logLevel = options.logLevel;
    this.format = options.format;
  }

  verbose(message: unknown, ...optionalParams: unknown[]) {
    if (!this.isLevelEnabled("verbose")) {
      return;
    }
    const { messages, context } = this.getContextAndMessagesToPrint([
      message,
      ...optionalParams,
    ]);
    this.printMessages(messages, context, "verbose");
  }

  debug(message: unknown, ...optionalParams: unknown[]) {
    if (!this.isLevelEnabled("debug")) {
      return;
    }
    const { messages, context } = this.getContextAndMessagesToPrint([
      message,
      ...optionalParams,
    ]);
    this.printMessages(messages, context, "debug");
  }

  log(message: unknown, ...optionalParams: unknown[]) {
    if (!this.isLevelEnabled("log")) {
      return;
    }
    const { messages, context } = this.getContextAndMessagesToPrint([
      message,
      ...optionalParams,
    ]);
    this.printMessages(messages, context, "info");
  }

  error(message: unknown, ...optionalParams: unknown[]) {
    if (!this.isLevelEnabled("error")) {
      return;
    }
    const { messages, context, stack } =
      this.getContextAndStackAndMessagesToPrint([message, ...optionalParams]);
    this.printMessages(messages, context, "error", stack);
  }

  warn(message: unknown, ...optionalParams: unknown[]) {
    if (!this.isLevelEnabled("warn")) {
      return;
    }
    const { messages, context } = this.getContextAndMessagesToPrint([
      message,
      ...optionalParams,
    ]);
    this.printMessages(messages, context, "warn");
  }

  fatal(message: unknown, ...optionalParams: unknown[]) {
    if (!this.isLevelEnabled("fatal")) {
      return;
    }
    const { messages, context } = this.getContextAndMessagesToPrint([
      message,
      ...optionalParams,
    ]);
    this.printMessages(messages, context, "fatal");
  }

  protected isLevelEnabled(level: LogLevel): boolean {
    return logLevels[level] >= logLevels[this.logLevel];
  }

  protected print(str: string) {
    process.stdout.write(str + "\n");
  }

  protected printMessages(
    messages: unknown[],
    context: string | null,
    severity: Severity,
    stack?: string | null
  ): void {
    switch (this.format) {
      case "json":
        this.printJson({ messages, context, severity, stack });
        break;
      case "text":
        this.printText({ messages, context, severity, stack });
        break;
    }
  }

  protected printJson({
    messages,
    context,
    severity,
    stack,
  }: {
    messages: unknown[];
    context: string | null;
    severity: Severity;
    stack?: string | null;
  }) {
    const [message, ...args] = messages;
    const output: {
      severity: string;
      time: string;
      message: string;
      requestId?: string;
      stack_trace?: string;
      context?: string;
      info?: unknown[];
    } & Record<string, unknown> = {
      severity: severity.toUpperCase(),
      time: new Date().toISOString(),
      message: `${message}`,
    };
    if (stack) {
      output.stack_trace = stack;
    }
    if (context) {
      output.context = context;
    }

    for (const arg of args) {
      if (isPlainObject(arg)) {
        for (const [k, v] of Object.entries(arg)) {
          output[k] = v;
        }
      } else if (arg) {
        if (!output.info) output.info = [];
        output.info.push(arg);
      }
    }

    this.print(JSON.stringify(output));
  }

  protected printText({
    messages,
    context,
    severity,
    stack,
  }: {
    messages: unknown[];
    context: string | null;
    severity: Severity;
    stack?: string | null;
  }) {
    const contextMessage = this.formatContext(context);
    const level = this.colorize(
      severity.toUpperCase(),
      this.getColorNameByLogLevel(severity)
    );
    const [message, ...args] = messages;
    const output: string[] = [
      `${level} `,
      contextMessage,
      severity === "error"
        ? this.colorize(`${message}`, this.getColorNameByLogLevel(severity))
        : `${message}`,
    ];

    for (const arg of args) {
      if (isPlainObject(arg)) {
        output.push(` ${this.formatObject(arg)}`);
      } else if (arg) {
        output.push(` ${this.colorize(`${arg}`, "bold")}`);
      }
    }

    this.print(output.join(""));

    if (severity === "error" && stack) {
      this.print(stack);
    }
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

  protected formatContext(context: string | null): string {
    return context ? this.colorize(`[${context}] `, "yellow") : "";
  }

  protected getContextAndMessagesToPrint(args: unknown[]): {
    messages: unknown[];
    context: string | null;
  } {
    if (args.length <= 1) {
      return { messages: args, context: null };
    }

    const last = args[args.length - 1];
    if (typeof last === "string") {
      return {
        context: last,
        messages: args.slice(0, args.length - 1),
      };
    } else {
      return { messages: args, context: null };
    }
  }

  protected getContextAndStackAndMessagesToPrint(args: unknown[]): {
    messages: unknown[];
    context: string | null;
    stack?: string | null;
  } {
    // error(message: unknown, stackOrContext?: string)
    if (args.length === 2) {
      const last = args[1];
      if (this.isStackFormat(last)) {
        return { messages: [args[0]], context: null, stack: last };
      } else {
        return this.getContextAndMessagesToPrint(args);
      }
    }

    // error(message: unknown, stack?: string, context?: string)
    if (args.length === 3) {
      const last = args[2];
      const second = args[1];
      if (!this.isStackFormat(second)) {
        return this.getContextAndMessagesToPrint(args);
      }

      if (typeof last === "string") {
        return { messages: [args[0]], context: last, stack: second };
      } else if (last === undefined) {
        return { messages: [args[0]], context: null, stack: second };
      } else {
        return this.getContextAndMessagesToPrint(args);
      }
    }

    // other
    return this.getContextAndMessagesToPrint(args);
  }

  protected isStackFormat(stack: unknown): stack is string {
    if (typeof stack !== "string") {
      return false;
    }

    return /^(.)+\n\s+at .+:\d+:\d+/.test(stack);
  }

  protected colorize(text: string, colorName: ColorName) {
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
