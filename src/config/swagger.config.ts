import { INestApplication } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';

export function setupSwagger(app: INestApplication): void {
  const config = app.get(ConfigService);
  const swaggerPath = config.get<string>('SWAGGER_PATH', 'docs');

  const documentConfig = new DocumentBuilder()
    .setTitle('Virashops API')
    .setDescription('Virashops backend')
    .setVersion('0.0.1')
    .addBearerAuth()
    .build();

  const document = SwaggerModule.createDocument(app, documentConfig);
  SwaggerModule.setup(swaggerPath, app, document);
}
