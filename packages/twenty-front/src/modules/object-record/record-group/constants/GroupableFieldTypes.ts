import { FieldMetadataType } from '~/generated-metadata/graphql';

/**
 * Field types that have predefined/static values suitable for Kanban grouping.
 * SELECT/MULTI_SELECT use field.options, BOOLEAN and RATING use synthesized values.
 */
export const STATIC_GROUPABLE_FIELD_TYPES: FieldMetadataType[] = [
  FieldMetadataType.SELECT,
  FieldMetadataType.MULTI_SELECT,
  FieldMetadataType.BOOLEAN,
  FieldMetadataType.RATING,
];

/**
 * Field types where groups are derived dynamically from actual data values.
 * These produce columns that may vary as data changes.
 */
export const DYNAMIC_GROUPABLE_FIELD_TYPES: FieldMetadataType[] = [
  FieldMetadataType.TEXT,
  FieldMetadataType.NUMBER,
  FieldMetadataType.RELATION,
  FieldMetadataType.DATE,
  FieldMetadataType.DATE_TIME,
  FieldMetadataType.CURRENCY,
  FieldMetadataType.EMAILS,
  FieldMetadataType.PHONES,
  FieldMetadataType.LINKS,
];

/**
 * All field types that can be used as a Kanban group-by field.
 */
export const ALL_GROUPABLE_FIELD_TYPES: FieldMetadataType[] = [
  ...STATIC_GROUPABLE_FIELD_TYPES,
  ...DYNAMIC_GROUPABLE_FIELD_TYPES,
];
