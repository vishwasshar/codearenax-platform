import { Module } from '@nestjs/common';
import { CodeSyncGateway } from './codeSync.gateway';

@Module({providers:[CodeSyncGateway]})
export class CodeSyncModule {
    
}
