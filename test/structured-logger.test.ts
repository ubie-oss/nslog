import { StructuredLogger } from "../src/structured-logger";
import { vi } from "vitest";

const isoDateRegex = /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}.\d{3}Z$/;

function removeColor(str: string): string {
  return str.replace(/\x1b\[\d+m/g, "");
}

describe("StructuredLogger", () => {
  it("should output as json", () => {
    const logger = new StructuredLogger({
      logLevel: "verbose",
      format: "json",
    });

    const print = vi.spyOn(logger as any, "print").mockImplementation(() => {});
    logger.log("hello", "ctx");

    const json = JSON.parse((print.mock as any).calls[0][0]);
    expect(json).toEqual({
      severity: "INFO",
      message: "hello",
      context: "ctx",
      time: expect.stringMatching(isoDateRegex),
    });
  });

  it("should output as text", () => {
    const logger = new StructuredLogger({
      logLevel: "verbose",
      format: "text",
    });

    const print = vi.spyOn(logger as any, "print").mockImplementation(() => {});
    logger.log("hello", "ctx");

    const text = removeColor((print.mock as any).calls[0][0]);
    expect(text).toEqual("INFO [ctx] hello");
  });
});
