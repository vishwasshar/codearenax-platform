import { Injectable } from '@nestjs/common';
import axios from 'axios';
import { LangTypes } from 'src/common/enums';
import { MemoryStoreService } from 'src/memory-store/memory-store.service';

@Injectable()
export class RunCodeService {
  constructor(private readonly memoryStore: MemoryStoreService) {}

  async runCode(code: string, language: LangTypes) {
    try {
      const res = await axios.post(
        process.env.CODE_EXECUTION_ENGINE_API + '/api/execute' ||
          'http://127.0.0.1:3000/api/execute',
        {
          code,
          language,
        },
        { headers: { 'Content-Type': 'application/json' } },
      );

      return res.data;
    } catch (err) {
      console.log(err);
    }
  }
}
