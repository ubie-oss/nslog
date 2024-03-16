import { StructuredLogger } from "../src/structured-logger";
import { vi } from "vitest";

const isoDateRegex = /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}.\d{3}Z$/;

function removeColor(str: string): string {
  return str.replace(/\x1b\[\d+m/g, "");
}

describe("StructuredLogger", () => {
  test("output as json", () => {
    const logger = new StructuredLogger({
      logLevel: "verbose",
      format: "json",
    });

    const print = vi.spyOn(logger as any, "print").mockImplementation(() => {});
    logger.log("hello", { foo: "bar", x: { y: "z" } }, "extra params", "ctx");

    const json = JSON.parse((print.mock as any).calls[0][0]);
    expect(json).toEqual({
      severity: "INFO",
      message: "hello",
      context: "ctx",
      foo: "bar",
      x: { y: "z" },
      params: ["extra params"],
      time: expect.stringMatching(isoDateRegex),
    });
  });

  test("output as text", () => {
    const logger = new StructuredLogger({
      logLevel: "verbose",
      format: "text",
    });

    const print = vi.spyOn(logger as any, "print").mockImplementation(() => {});
    logger.log("hello", { foo: "bar", x: { y: "z" } }, "extra params", "ctx");

    const text = removeColor((print.mock as any).calls[0][0]);
    expect(text).toEqual("INFO [ctx] hello foo=bar x.y=z extra params");
  });

  test("message is not a string", () => {
    const logger = new StructuredLogger({
      logLevel: "verbose",
      format: "text",
    });
    const print = vi.spyOn(logger as any, "print").mockImplementation(() => {});
    logger.log({ foo: "bar" }, "ctx");

    const text = removeColor((print.mock as any).calls[0][0]);
    expect(text).toEqual("INFO [ctx] foo=bar");
  });
});
