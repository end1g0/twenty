import { RATING_VALUES } from 'twenty-shared/constants';
import { FieldMetadataType } from 'twenty-shared/types';

type FieldOptionLike = {
  value: string;
  [key: string]: unknown;
};

type FieldMetadataLike = {
  type: FieldMetadataType;
  options?: FieldOptionLike[] | null;
};

const MONTH_NAMES = [
  'January',
  'February',
  'March',
  'April',
  'May',
  'June',
  'July',
  'August',
  'September',
  'October',
  'November',
  'December',
];

/**
 * Returns normalized options for any field metadata type.
 * For SELECT/MULTI_SELECT: uses field.options
 * For BOOLEAN: synthesizes true/false
 * For RATING: synthesizes RATING_1 through RATING_5
 * For DATE/DATE_TIME: synthesizes month+year groups for current year
 * For dynamic types: returns empty array
 */
export const getOptionsForFieldMetadata = (
  fieldMetadata: FieldMetadataLike,
): FieldOptionLike[] => {
  switch (fieldMetadata.type) {
    case FieldMetadataType.SELECT:
    case FieldMetadataType.MULTI_SELECT:
      return fieldMetadata.options ?? [];

    case FieldMetadataType.BOOLEAN:
      return [{ value: 'true' }, { value: 'false' }];

    case FieldMetadataType.RATING:
      return RATING_VALUES.map((ratingValue) => ({
        value: ratingValue,
      }));

    case FieldMetadataType.DATE:
    case FieldMetadataType.DATE_TIME: {
      const currentYear = new Date().getFullYear();
      return MONTH_NAMES.map((_monthName, index) => ({
        value: `${currentYear}-${String(index + 1).padStart(2, '0')}`,
      }));
    }

    default:
      return [];
  }
};
