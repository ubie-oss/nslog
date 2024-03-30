import { describe, beforeEach, test, expect, vi, MockInstance } from "vitest";
import { StructuredLogger, LogLevel } from "../src/index";

const isoDateRegex = /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}.\d{3}Z$/;

function removeColor(str: string): string {
  return str.replace(/\x1b\[\d+m/g, "");
}

describe("json formatter", () => {
  let logger: StructuredLogger;
  let print: MockInstance;
  const getResult = () => JSON.parse((print.mock as any).calls[0][0]);

  beforeEach(() => {
    logger = new StructuredLogger({
      logLevel: "verbose",
      format: "json",
    });
    print = vi.spyOn(logger as any, "print").mockImplementation(() => {});
  });

  test("output as json", () => {
    logger.log(
      "hello",
      { foo: "bar", x: { y: "z" } },
      "extra params",
      [1, 2, 3],
      "ctx",
    );

    expect(getResult()).toEqual({
      severity: "INFO",
      message: "hello",
      context: "ctx",
      foo: "bar",
      x: { y: "z" },
      params: ["extra params", [1, 2, 3]],
      time: expect.stringMatching(isoDateRegex),
    });
  });

  test("without context", () => {
    logger.log("hello", { foo: "bar" });

    expect(getResult()).toEqual({
      severity: "INFO",
      message: "hello",
      foo: "bar",
      time: expect.stringMatching(isoDateRegex),
    });
  });

  test("error with stack", () => {
    const err = new Error("something went wrong");
    logger.error(err.message, err.stack);

    expect(getResult()).toEqual({
      severity: "ERROR",
      message: err.message,
      time: expect.stringMatching(isoDateRegex),
      stack_trace: err.stack,
    });
  });

  test("error with stack and context", () => {
    const err = new Error("something went wrong");
    logger.error(err.message, err.stack, "ctx");

    expect(getResult()).toEqual({
      severity: "ERROR",
      message: err.message,
      context: "ctx",
      time: expect.stringMatching(isoDateRegex),
      stack_trace: err.stack,
    });
  });

  test("error with Error class", () => {
    const err = new Error("something went wrong");
    logger.error(err, { foo: "bar" });
    expect(getResult()).toEqual({
      severity: "ERROR",
      message: err.message,
      foo: "bar",
      time: expect.stringMatching(isoDateRegex),
      stack_trace: err.stack,
    });
  });

  test("error with Error class and context", () => {
    const err = new Error("something went wrong");
    logger.error(err, "ctx");
    expect(getResult()).toEqual({
      severity: "ERROR",
      message: err.message,
      context: "ctx",
      time: expect.stringMatching(isoDateRegex),
      stack_trace: err.stack,
    });
  });
});

describe("text formatter", () => {
  let logger: StructuredLogger;
  let print: MockInstance;
  const getResult = () => removeColor((print.mock as any).calls[0][0]);
  const getStackResult = () => (print.mock as any).calls[1][0];

  beforeEach(() => {
    logger = new StructuredLogger({
      logLevel: "verbose",
      format: "text",
    });
    print = vi.spyOn(logger as any, "print").mockImplementation(() => {});
  });

  test("output as text", () => {
    logger.log(
      "hello",
      { foo: "bar", x: { y: "z" } },
      "extra params",
      [1, 2, 3],
      "ctx",
    );
    expect(getResult()).toEqual(
      "INFO [ctx] hello foo=bar x.y=z extra params 1,2,3",
    );
  });

  test("message is not a string", () => {
    logger.log({ foo: "bar" }, "ctx");
    expect(getResult()).toEqual("INFO [ctx] foo=bar");
  });

  test("without context text", () => {
    logger.log("hello", { foo: "bar" });
    expect(getResult()).toEqual("INFO hello foo=bar");
  });

  test("error with stack", () => {
    const err = new Error("something went wrong");
    logger.error(err.message, err.stack);

    expect(getResult()).toEqual("ERROR something went wrong");
    expect(getStackResult()).toEqual(err.stack);
  });

  test("error with stack and context", () => {
    const err = new Error("something went wrong");
    logger.error(err.message, err.stack, "ctx");

    expect(getResult()).toEqual("ERROR [ctx] something went wrong");
    expect(getStackResult()).toEqual(err.stack);
  });
});

describe("logLevel", () => {
  const callLogsAndReturnSeverities = (logLevel: LogLevel): string[] => {
    const logger = new StructuredLogger({
      logLevel,
      format: "json",
    });
    const print = vi.spyOn(logger as any, "print").mockImplementation(() => {});

    logger.verbose("hello");
    logger.debug("hello");
    logger.log("hello");
    logger.warn("hello");
    logger.error("hello");
    logger.fatal("hello");

    return (print.mock as any).calls.map((call: any) => {
      return JSON.parse(call[0]).severity;
    });
  };

  test("logLevel is verbose", () => {
    expect(callLogsAndReturnSeverities("verbose")).toEqual([
      "VERBOSE",
      "DEBUG",
      "INFO",
      "WARN",
      "ERROR",
      "FATAL",
    ]);
  });

  test("logLevel is debug", () => {
    expect(callLogsAndReturnSeverities("debug")).toEqual([
      "DEBUG",
      "INFO",
      "WARN",
      "ERROR",
      "FATAL",
    ]);
  });

  test("logLevel is info", () => {
    expect(callLogsAndReturnSeverities("info")).toEqual([
      "INFO",
      "WARN",
      "ERROR",
      "FATAL",
    ]);
  });

  test("logLevel is log", () => {
    expect(callLogsAndReturnSeverities("log")).toEqual([
      "INFO",
      "WARN",
      "ERROR",
      "FATAL",
    ]);
  });

  test("logLevel is warn", () => {
    expect(callLogsAndReturnSeverities("warn")).toEqual([
      "WARN",
      "ERROR",
      "FATAL",
    ]);
  });

  test("logLevel is error", () => {
    expect(callLogsAndReturnSeverities("error")).toEqual(["ERROR", "FATAL"]);
  });

  test("logLevel is fatal", () => {
    expect(callLogsAndReturnSeverities("fatal")).toEqual(["FATAL"]);
  });
});
