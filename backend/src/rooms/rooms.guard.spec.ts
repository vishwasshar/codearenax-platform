import { RoomsGuard } from './rooms.guard';

describe('RoomsGuard', () => {
  it('should be defined', () => {
    const mockService = {} as any;
    expect(new RoomsGuard(mockService)).toBeDefined();
  });
});
