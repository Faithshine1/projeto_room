
import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { MongooseModule } from '@nestjs/mongoose';

import { AppController } from './app.controller.js';
import { AppService } from './app.service.js';
import { AgendamentosModule } from './agendamentos/agendamentos.module.js';
import { AdminModule } from './admin/admin.module.js';
import { SalasModule } from './salas/salas.module.js';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
    }),

    MongooseModule.forRootAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: (configService: ConfigService) => ({
        uri: configService.getOrThrow<string>('MONGODB_URI'),
      }),
    }),

    AgendamentosModule,
    AdminModule,
    SalasModule,
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
