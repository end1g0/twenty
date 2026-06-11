import { type FieldMetadataItem } from '@/object-metadata/types/FieldMetadataItem';
import { RATING_VALUES } from 'twenty-shared/constants';
import { type ThemeColor } from 'twenty-ui/theme';
import { FieldMetadataType } from '~/generated-metadata/graphql';

export type GroupOption = {
  value: string;
  label: string;
  color: ThemeColor;
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

const MONTH_COLORS: ThemeColor[] = [
  'sky',
  'turquoise',
  'green',
  'yellow',
  'orange',
  'red',
  'purple',
  'blue',
  'sky',
  'turquoise',
  'green',
  'yellow',
];

/**
 * Returns normalized group options for a given field metadata item.
 * For fields with predefined values (SELECT, MULTI_SELECT, BOOLEAN, RATING),
 * returns static options. For dynamic fields, returns an empty array
 * (groups will be derived from data).
 */
export const getGroupOptionsForField = (
  fieldMetadataItem: FieldMetadataItem,
): GroupOption[] => {
  switch (fieldMetadataItem.type) {
    case FieldMetadataType.SELECT:
    case FieldMetadataType.MULTI_SELECT:
      return (fieldMetadataItem.options ?? []).map((option) => ({
        value: option.value,
        label: option.label,
        color: option.color,
      }));

    case FieldMetadataType.BOOLEAN:
      return [
        { value: 'true', label: 'True', color: 'green' as ThemeColor },
        { value: 'false', label: 'False', color: 'red' as ThemeColor },
      ];

    case FieldMetadataType.RATING:
      return RATING_VALUES.map((ratingValue, index) => ({
        value: ratingValue,
        label: '★'.repeat(index + 1),
        color: 'yellow' as ThemeColor,
      }));



    default:
      // Dynamic fields (TEXT, NUMBER, RELATION, etc.) — no predefined options.
      // Groups will be derived from actual data at runtime.
      return [];
  }
};
