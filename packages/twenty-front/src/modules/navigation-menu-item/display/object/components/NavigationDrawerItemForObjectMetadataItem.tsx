import { t } from '@lingui/core/macro';
import { isNonEmptyString } from '@sniptt/guards';
import { Fragment, type ReactNode, useContext, useMemo } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';

import { MAIN_CONTEXT_STORE_INSTANCE_ID } from '@/context-store/constants/MainContextStoreInstanceId';
import { contextStoreCurrentViewIdComponentState } from '@/context-store/states/contextStoreCurrentViewIdComponentState';
import { isLayoutCustomizationModeEnabledState } from '@/layout-customization/states/isLayoutCustomizationModeEnabledState';
import { lastClickedNavigationMenuItemIdState } from '@/navigation-menu-item/common/states/lastClickedNavigationMenuItemIdState';
import { recordIdentifierToObjectRecordIdentifier } from '@/navigation-menu-item/common/utils/recordIdentifierToObjectRecordIdentifier';
import { NavigationMenuItemFolderLayout } from '@/navigation-menu-item/display/folder/components/NavigationMenuItemFolderLayout';
import { useIdentifyActiveNavigationMenuItems } from '@/navigation-menu-item/display/hooks/useIdentifyActiveNavigationMenuItems';
import { useNavigationMenuItemObjectOpenState } from '@/navigation-menu-item/display/object/hooks/useNavigationMenuItemObjectOpenState';
import { getNavigationMenuItemComputedLink } from '@/navigation-menu-item/display/utils/getNavigationMenuItemComputedLink';
import { getNavigationMenuItemLabel } from '@/navigation-menu-item/display/utils/getNavigationMenuItemLabel';
import { ObjectIconWithViewOverlay } from '@/navigation-menu-item/display/view/components/ObjectIconWithViewOverlay';
import { lastVisitedViewPerObjectMetadataItemState } from '@/navigation/states/lastVisitedViewPerObjectMetadataItemState';
import { objectMetadataItemsSelector } from '@/object-metadata/states/objectMetadataItemsSelector';
import { type EnrichedObjectMetadataItem } from '@/object-metadata/types/EnrichedObjectMetadataItem';
import { getObjectColorWithFallback } from '@/object-metadata/utils/getObjectColorWithFallback';
import { getObjectPermissionsForObject } from '@/object-metadata/utils/getObjectPermissionsForObject';
import { useObjectPermissions } from '@/object-record/hooks/useObjectPermissions';
import { NavigationDrawerItem } from '@/ui/navigation/navigation-drawer/components/NavigationDrawerItem';
import { NavigationDrawerSubItem } from '@/ui/navigation/navigation-drawer/components/NavigationDrawerSubItem';
import { getNavigationSubItemLeftAdornment } from '@/ui/navigation/navigation-drawer/utils/getNavigationSubItemLeftAdornment';
import { useAtomComponentStateValue } from '@/ui/utilities/state/jotai/hooks/useAtomComponentStateValue';
import { useAtomStateValue } from '@/ui/utilities/state/jotai/hooks/useAtomStateValue';
import { useSetAtomState } from '@/ui/utilities/state/jotai/hooks/useSetAtomState';
import { viewsSelector } from '@/views/states/selectors/viewsSelector';
import { ViewType } from '@/views/types/ViewType';
import {
  AppPath,
  CoreObjectNameSingular,
  NavigationMenuItemType,
} from 'twenty-shared/types';
import { getAppPath, isDefined } from 'twenty-shared/utils';
import { Avatar, IconChevronDown, IconChevronRight, IconLock, useIcons } from 'twenty-ui-deprecated/display';
import { ThemeContext, themeCssVariables } from 'twenty-ui-deprecated/theme-constants';
import { type NavigationMenuItem } from '~/generated-metadata/graphql';

export type NavigationDrawerItemForObjectMetadataItemProps = {
  objectMetadataItem: EnrichedObjectMetadataItem;
  navigationMenuItem?: NavigationMenuItem;
  isSelectedInEditMode?: boolean;
  onEditModeClick?: () => void;
  onActiveItemClickWhenNotInEditMode?: () => void;
  isDragging?: boolean;
  rightOptions?: ReactNode;
};

export const NavigationDrawerItemForObjectMetadataItem = ({
  objectMetadataItem,
  navigationMenuItem,
  isSelectedInEditMode = false,
  onEditModeClick,
  onActiveItemClickWhenNotInEditMode: _onActiveItemClickWhenNotInEditMode,
  isDragging = false,
  rightOptions,
}: NavigationDrawerItemForObjectMetadataItemProps) => {
  const isLayoutCustomizationModeEnabled = useAtomStateValue(
    isLayoutCustomizationModeEnabledState,
  );
  const { objectPermissionsByObjectMetadataId } = useObjectPermissions();
  const { theme } = useContext(ThemeContext);
  const lastVisitedViewPerObjectMetadataItem = useAtomStateValue(
    lastVisitedViewPerObjectMetadataItemState,
  );
  const objectMetadataItems = useAtomStateValue(objectMetadataItemsSelector);
  const views = useAtomStateValue(viewsSelector);

  const objectMetadataViews = useMemo(() => {
    return views
      .filter(
        (view) =>
          view.objectMetadataId === objectMetadataItem.id &&
          view.type !== ViewType.FIELDS_WIDGET &&
          view.type !== ViewType.TABLE_WIDGET,
      )
      .sort((a, b) => a.position - b.position);
  }, [views, objectMetadataItem.id]);

  const contextStoreCurrentViewId = useAtomComponentStateValue(
    contextStoreCurrentViewIdComponentState,
    MAIN_CONTEXT_STORE_INSTANCE_ID,
  );

  const { isOpen, handleToggle, hasActiveChild } =
    useNavigationMenuItemObjectOpenState({
      objectMetadataId: objectMetadataItem.id,
      views: objectMetadataViews,
      contextStoreCurrentViewId: contextStoreCurrentViewId ?? undefined,
    });

  const canReadObjectRecords = getObjectPermissionsForObject(
    objectPermissionsByObjectMetadataId,
    objectMetadataItem.id,
  ).canReadObjectRecords;

  const lastVisitedViewId =
    lastVisitedViewPerObjectMetadataItem?.[objectMetadataItem.id];

  const { getIcon } = useIcons();
  const objectNavItemColor = getObjectColorWithFallback(objectMetadataItem);
  const navigate = useNavigate();

  const { activeNavigationMenuItemIds, objectMetadataIdForOpenedSection } =
    useIdentifyActiveNavigationMenuItems();
  const setLastClickedNavigationMenuItemId = useSetAtomState(
    lastClickedNavigationMenuItemIdState,
  );

  const isRecord = navigationMenuItem?.type === NavigationMenuItemType.RECORD;
  const isView = navigationMenuItem?.type === NavigationMenuItemType.VIEW;
  const isObject = navigationMenuItem?.type === NavigationMenuItemType.OBJECT;
  const hasNavigationMenuItem = isRecord || isView || isObject;

  const navigationPath = hasNavigationMenuItem
    ? getNavigationMenuItemComputedLink(
        navigationMenuItem!,
        objectMetadataItems,
        views,
      )
    : getAppPath(
        AppPath.RecordIndexPage,
        { objectNamePlural: objectMetadataItem.namePlural },
        lastVisitedViewId ? { viewId: lastVisitedViewId } : undefined,
      );

  const isActive = hasNavigationMenuItem
    ? activeNavigationMenuItemIds.includes(navigationMenuItem!.id)
    : objectMetadataIdForOpenedSection === objectMetadataItem.id;

  const handleClick = isLayoutCustomizationModeEnabled
    ? onEditModeClick
    : hasNavigationMenuItem && !isDragging
      ? () => {
          setLastClickedNavigationMenuItemId(navigationMenuItem!.id);
          navigate(navigationPath);
        }
      : undefined;

  const shouldNavigate = !isLayoutCustomizationModeEnabled;

  const view = isDefined(navigationMenuItem?.viewId)
    ? views.find((view) => view.id === navigationMenuItem!.viewId)
    : undefined;
  const isViewWithResolvedView = isView && isDefined(view);

  const itemLabel = isDefined(navigationMenuItem)
    ? getNavigationMenuItemLabel(navigationMenuItem, objectMetadataItems, views)
    : objectMetadataItem.labelPlural;

  const primaryLabel =
    isRecord || isViewWithResolvedView
      ? itemLabel
      : objectMetadataItem.labelPlural;

  const needsInaccessibleRecordPlaceholder =
    isLayoutCustomizationModeEnabled &&
    isRecord &&
    !canReadObjectRecords &&
    !isNonEmptyString(primaryLabel.trim());

  const label = needsInaccessibleRecordPlaceholder ? t`Record` : primaryLabel;

  const recordIdentifier =
    isRecord && isDefined(navigationMenuItem?.targetRecordIdentifier)
      ? recordIdentifierToObjectRecordIdentifier({
          recordIdentifier: navigationMenuItem!.targetRecordIdentifier!,
          objectMetadataItem,
        })
      : null;

  const Icon = isRecord
    ? () => (
        <Avatar
          type={
            objectMetadataItem.nameSingular === CoreObjectNameSingular.Company
              ? 'squared'
              : 'rounded'
          }
          avatarUrl={recordIdentifier?.avatarUrl}
          placeholderColorSeed={navigationMenuItem!.targetRecordId ?? undefined}
          placeholder={itemLabel}
        />
      )
    : isViewWithResolvedView && isDefined(view?.icon)
      ? () => (
          <ObjectIconWithViewOverlay
            ObjectIcon={getIcon(objectMetadataItem.icon)}
            ViewIcon={getIcon(view!.icon)}
            objectColor={objectNavItemColor}
          />
        )
      : getIcon(objectMetadataItem.icon);

  const iconThemeColor = !isRecord ? objectNavItemColor : undefined;

  const secondaryLabel =
    isRecord || isViewWithResolvedView
      ? objectMetadataItem.labelSingular
      : undefined;

  const showInaccessibleLock =
    isLayoutCustomizationModeEnabled && !canReadObjectRecords;

  const showChevron =
    !isLayoutCustomizationModeEnabled && objectMetadataViews.length > 0;

  const chevronIcon = showChevron ? (
    <div onClick={handleToggle}>
      {isOpen ? (
        <IconChevronDown
          size={theme.icon.size.sm}
          stroke={theme.icon.stroke.sm}
          color={themeCssVariables.font.color.tertiary}
        />
      ) : (
        <IconChevronRight
          size={theme.icon.size.sm}
          stroke={theme.icon.stroke.sm}
          color={themeCssVariables.font.color.tertiary}
        />
      )}
    </div>
  ) : undefined;

  const hasSubItems = showChevron && isOpen;

  return (
    <Fragment>
      <NavigationDrawerItem
        label={label}
        secondaryLabel={secondaryLabel}
        to={
          isLayoutCustomizationModeEnabled || isDragging
            ? undefined
            : shouldNavigate
              ? navigationPath
              : undefined
        }
        onClick={handleClick}
        Icon={Icon}
        iconColor={iconThemeColor}
        active={isActive}
        isSelectedInEditMode={isSelectedInEditMode}
        isDragging={isDragging}
        triggerEvent={isLayoutCustomizationModeEnabled ? 'CLICK' : undefined}
        alwaysShowRightOptions={showInaccessibleLock || showChevron}
        rightOptions={
          showInaccessibleLock ? (
            <Fragment>
              <IconLock
                size={theme.icon.size.sm}
                stroke={theme.icon.stroke.sm}
                color={themeCssVariables.font.color.tertiary}
              />
            </Fragment>
          ) : chevronIcon ? (
            chevronIcon
          ) : (
            rightOptions
          )
        }
      />
      {hasSubItems && (
        <NavigationMenuItemFolderLayout
          header={null}
          isOpen={isOpen}
          isGroup={false}
        >
          {objectMetadataViews.map((view, index) => {
            const viewPath = getAppPath(
              AppPath.RecordIndexPage,
              { objectNamePlural: objectMetadataItem.namePlural },
              { viewId: view.id },
            );
            const isViewActive = view.id === contextStoreCurrentViewId;

            return (
              <NavigationDrawerSubItem
                key={view.id}
                label={view.name}
                to={isDragging ? undefined : viewPath}
                onClick={
                  isDragging
                    ? undefined
                    : () => {
                        navigate(viewPath);
                      }
                }
                Icon={getIcon(view.icon)}
                iconColor={objectNavItemColor}
                active={isViewActive}
                subItemState={getNavigationSubItemLeftAdornment({
                  index,
                  arrayLength: objectMetadataViews.length,
                  selectedIndex: isViewActive ? index : -1,
                })}
              />
            );
          })}
        </NavigationMenuItemFolderLayout>
      )}
    </Fragment>
  );
};
