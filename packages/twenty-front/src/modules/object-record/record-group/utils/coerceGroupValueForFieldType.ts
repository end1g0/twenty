import { FieldMetadataType } from '~/generated-metadata/graphql';

/**
 * Coerces a string group value to the correct JavaScript type
 * for a given field type. Needed because RecordGroupDefinition stores
 * values as strings, but the API expects typed values.
 */
export const coerceGroupValueForFieldType = (
  fieldType: FieldMetadataType,
  value: string | null,
): unknown => {
  if (value === null) return null;

  switch (fieldType) {
    case FieldMetadataType.BOOLEAN:
      return value === 'true';
    case FieldMetadataType.NUMBER:
      return Number(value);
    case FieldMetadataType.DATE:
      return value.length === 7 ? `${value}-01` : value;
    case FieldMetadataType.DATE_TIME:
      return value.length === 7 ? `${value}-01T00:00:00.000Z` : value;
    case FieldMetadataType.CURRENCY:
      return {
        amountMicros: Number(value),
        currencyCode: 'USD',
      };
    default:
      return value;
  }
};
