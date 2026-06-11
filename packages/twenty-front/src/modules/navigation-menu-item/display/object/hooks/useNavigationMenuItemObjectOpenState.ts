import { useState } from 'react';

import { openNavigationMenuItemObjectIdsState } from '@/navigation-menu-item/common/states/openNavigationMenuItemObjectIdsState';
import { useAtomState } from '@/ui/utilities/state/jotai/hooks/useAtomState';
import { type View } from '@/views/types/View';

type UseNavigationMenuItemObjectOpenStateParams = {
  objectMetadataId: string;
  views: View[];
  contextStoreCurrentViewId?: string | null;
};

export const useNavigationMenuItemObjectOpenState = ({
  objectMetadataId,
  views,
  contextStoreCurrentViewId,
}: UseNavigationMenuItemObjectOpenStateParams) => {
  const [openNavigationMenuItemObjectIds, setOpenNavigationMenuItemObjectIds] =
    useAtomState(openNavigationMenuItemObjectIdsState);

  const [isManuallyClosed, setIsManuallyClosed] = useState(false);

  const isExplicitlyOpen =
    openNavigationMenuItemObjectIds.includes(objectMetadataId);
  const hasActiveChild = views.some(
    (view) => view.id === contextStoreCurrentViewId,
  );
  const isOpen = isExplicitlyOpen || (hasActiveChild && !isManuallyClosed);

  const handleToggle = (event?: React.MouseEvent) => {
    event?.stopPropagation();
    event?.preventDefault();

    setOpenNavigationMenuItemObjectIds((current) =>
      isOpen
        ? current.filter((id) => id !== objectMetadataId)
        : current.includes(objectMetadataId)
          ? current
          : [...current, objectMetadataId],
    );
    setIsManuallyClosed(isOpen);
  };

  return {
    isOpen,
    handleToggle,
    hasActiveChild,
  };
};
