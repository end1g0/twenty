import { type FieldMetadataItem } from '@/object-metadata/types/FieldMetadataItem';
import { getGroupOptionsForField } from '@/object-record/record-group/utils/getGroupOptionsForField';
import { FieldMetadataType } from '~/generated-metadata/graphql';

const createMockField = (
  overrides: Partial<FieldMetadataItem>,
): FieldMetadataItem =>
  ({
    id: 'test-field-id',
    name: 'testField',
    label: 'Test Field',
    type: FieldMetadataType.TEXT,
    isActive: true,
    ...overrides,
  }) as FieldMetadataItem;

describe('getGroupOptionsForField', () => {
  describe('SELECT', () => {
    it('should return field options for SELECT fields', () => {
      const field = createMockField({
        type: FieldMetadataType.SELECT,
        options: [
          { value: 'OPTION_A', label: 'Option A', color: 'green' as any },
          { value: 'OPTION_B', label: 'Option B', color: 'red' as any },
        ] as any,
      });

      const result = getGroupOptionsForField(field);

      expect(result).toHaveLength(2);
      expect(result[0]).toEqual({
        value: 'OPTION_A',
        label: 'Option A',
        color: 'green',
      });
      expect(result[1]).toEqual({
        value: 'OPTION_B',
        label: 'Option B',
        color: 'red',
      });
    });

    it('should return empty array when SELECT field has no options', () => {
      const field = createMockField({
        type: FieldMetadataType.SELECT,
        options: null,
      });

      const result = getGroupOptionsForField(field);
      expect(result).toHaveLength(0);
    });
  });

  describe('MULTI_SELECT', () => {
    it('should return field options for MULTI_SELECT fields', () => {
      const field = createMockField({
        type: FieldMetadataType.MULTI_SELECT,
        options: [
          { value: 'TAG_1', label: 'Tag 1', color: 'blue' as any },
        ] as any,
      });

      const result = getGroupOptionsForField(field);

      expect(result).toHaveLength(1);
      expect(result[0].value).toBe('TAG_1');
    });
  });

  describe('BOOLEAN', () => {
    it('should return True and False options', () => {
      const field = createMockField({
        type: FieldMetadataType.BOOLEAN,
      });

      const result = getGroupOptionsForField(field);

      expect(result).toHaveLength(2);
      expect(result[0]).toEqual({
        value: 'true',
        label: 'True',
        color: 'green',
      });
      expect(result[1]).toEqual({
        value: 'false',
        label: 'False',
        color: 'red',
      });
    });
  });

  describe('RATING', () => {
    it('should return 5 star options', () => {
      const field = createMockField({
        type: FieldMetadataType.RATING,
      });

      const result = getGroupOptionsForField(field);

      expect(result).toHaveLength(5);
      expect(result[0].value).toBe('RATING_1');
      expect(result[0].label).toBe('★');
      expect(result[4].value).toBe('RATING_5');
      expect(result[4].label).toBe('★★★★★');
    });
  });

  describe('DATE / DATE_TIME', () => {
    it('should return 12 month+year options for DATE fields', () => {
      const field = createMockField({
        type: FieldMetadataType.DATE,
      });

      const result = getGroupOptionsForField(field);

      expect(result).toHaveLength(12);
      const currentYear = new Date().getFullYear();
      expect(result[0].value).toBe(`${currentYear}-01`);
      expect(result[0].label).toBe(`January ${currentYear}`);
      expect(result[11].value).toBe(`${currentYear}-12`);
      expect(result[11].label).toBe(`December ${currentYear}`);
    });

    it('should return 12 month+year options for DATE_TIME fields', () => {
      const field = createMockField({
        type: FieldMetadataType.DATE_TIME,
      });

      const result = getGroupOptionsForField(field);

      expect(result).toHaveLength(12);
    });
  });

  describe('dynamic fields', () => {
    it('should return empty array for TEXT fields', () => {
      const field = createMockField({
        type: FieldMetadataType.TEXT,
      });

      const result = getGroupOptionsForField(field);
      expect(result).toHaveLength(0);
    });

    it('should return empty array for NUMBER fields', () => {
      const field = createMockField({
        type: FieldMetadataType.NUMBER,
      });

      const result = getGroupOptionsForField(field);
      expect(result).toHaveLength(0);
    });

    it('should return empty array for RELATION fields', () => {
      const field = createMockField({
        type: FieldMetadataType.RELATION,
      });

      const result = getGroupOptionsForField(field);
      expect(result).toHaveLength(0);
    });
  });
});
