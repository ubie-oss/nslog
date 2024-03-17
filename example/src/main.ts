import { Logger } from "@nestjs/common";
import { NestFactory } from "@nestjs/core";
import { Module } from "@nestjs/common";
import { StructuredLogger } from "./structured-logger";

@Module({})
export class AppModule {}

async function bootstrap() {
  const app = await NestFactory.create(AppModule, { bufferLogs: true });
  app.useLogger(new StructuredLogger({ logLevel: "verbose", format: "json" }));

  const logger = new Logger("bootstrap");
  logger.log("Hello structured log!", { foo: "bar" });
  logger.debug("This is a debug log", { x: { y: "z" } });
  logger.warn("This is a warning");
  logger.error("something went wrong", { errorCode: "xxx", result: "error" });

  await app.listen(3000);
  logger.log(`Application is running on: ${await app.getUrl()}`);
}
bootstrap();
