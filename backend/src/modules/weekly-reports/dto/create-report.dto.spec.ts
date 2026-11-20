import { plainToInstance } from 'class-transformer';
import { validate } from 'class-validator';
import { CreateWeeklyReportDto } from './create-report.dto';

/**
 * `skillsLearned` is required by the database column and by the student form.
 * These tests pin the API side of that shared rule: required, min 3 chars, trimmed.
 */
const buildDto = (overrides: Record<string, unknown> = {}): CreateWeeklyReportDto =>
  plainToInstance(CreateWeeklyReportDto, {
    internshipId: 1,
    weekNumber: 1,
    startDate: '2026-07-01T00:00:00.000Z',
    endDate: '2026-07-07T00:00:00.000Z',
    activities: 'آماده‌سازی دیتاست و پیش‌پردازش داده‌ها',
    skillsLearned: 'Docker و NestJS',
    description: 'گزارش هفته اول کارآموزی',
    ...overrides,
  });

const constraintMessages = async (dto: CreateWeeklyReportDto): Promise<string[]> => {
  const errors = await validate(dto);
  return errors
    .filter((error) => error.property === 'skillsLearned')
    .flatMap((error) => Object.values(error.constraints ?? {}));
};

describe('CreateWeeklyReportDto skillsLearned validation', () => {
  it('accepts a filled value', async () => {
    await expect(constraintMessages(buildDto())).resolves.toEqual([]);
  });

  it('rejects a whitespace-only value with the same message the form shows', async () => {
    const messages = await constraintMessages(buildDto({ skillsLearned: '   ' }));
    expect(messages).toEqual(['مهارت‌ها و آموخته‌های جدید باید حداقل ۳ کاراکتر باشد.']);
  });

  it('rejects a value shorter than 3 characters', async () => {
    const messages = await constraintMessages(buildDto({ skillsLearned: ' ab ' }));
    expect(messages).toEqual(['مهارت‌ها و آموخته‌های جدید باید حداقل ۳ کاراکتر باشد.']);
  });

  it('trims the value before it reaches the service', () => {
    expect(buildDto({ skillsLearned: '  Docker  ' }).skillsLearned).toBe('Docker');
  });
});
