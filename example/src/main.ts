import { Logger, ValidationPipe } from "@nestjs/common";
import { NestFactory } from "@nestjs/core";
import { Module } from "@nestjs/common";
import { StructuredLogger } from "./structured-logger";

@Module({})
export class AppModule {}

async function bootstrap() {
  const app = await NestFactory.create(AppModule, { bufferLogs: true });
  app.useLogger(new StructuredLogger({ logLevel: "verbose", format: "text" }));

  const logger = new Logger("bootstrap");
  logger.log("Application is starting...", { foo: "bar" });
  logger.error({ error: "something went wrong" }, "extra params");

  await app.listen(3000);
  logger.log(`Application is running on: ${await app.getUrl()}`);
}
bootstrap();
