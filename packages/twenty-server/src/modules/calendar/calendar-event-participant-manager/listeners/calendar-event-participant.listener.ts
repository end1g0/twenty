import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';

import { isDefined } from 'twenty-shared/utils';
import { In, Repository } from 'typeorm';

import { OnCustomBatchEvent } from 'src/engine/api/graphql/graphql-query-runner/decorators/on-custom-batch-event.decorator';
import { FeatureFlagService } from 'src/engine/core-modules/feature-flag/services/feature-flag.service';
import { ObjectMetadataEntity } from 'src/engine/metadata-modules/object-metadata/object-metadata.entity';
import { InjectObjectMetadataRepository } from 'src/engine/object-metadata-repository/object-metadata-repository.decorator';
import { CustomWorkspaceEventBatch } from 'src/engine/workspace-event-emitter/types/custom-workspace-batch-event.type';
import { type CalendarEventParticipantWorkspaceEntity } from 'src/modules/calendar/common/standard-objects/calendar-event-participant.workspace-entity';
import { TimelineActivityRepository } from 'src/modules/timeline/repositories/timeline-activity.repository';
import { TimelineActivityWorkspaceEntity } from 'src/modules/timeline/standard-objects/timeline-activity.workspace-entity';
import { GlobalWorkspaceOrmManager } from 'src/engine/twenty-orm/global-workspace-datasource/global-workspace-orm.manager';
import { buildSystemAuthContext } from 'src/engine/twenty-orm/utils/build-system-auth-context.util';

@Injectable()
export class CalendarEventParticipantListener {
  constructor(
    @InjectObjectMetadataRepository(TimelineActivityWorkspaceEntity)
    private readonly timelineActivityRepository: TimelineActivityRepository,
    @InjectRepository(ObjectMetadataEntity)
    private readonly objectMetadataRepository: Repository<ObjectMetadataEntity>,
    private readonly featureFlagService: FeatureFlagService,
    private readonly globalWorkspaceOrmManager: GlobalWorkspaceOrmManager,
  ) {}

  @OnCustomBatchEvent('calendarEventParticipant_matched')
  public async handleCalendarEventParticipantMatchedEvent(
    batchEvent: CustomWorkspaceEventBatch<{
      workspaceMemberId: string;
      participants: CalendarEventParticipantWorkspaceEntity[];
    }>,
  ): Promise<void> {
    if (!isDefined(batchEvent.workspaceId)) {
      return;
    }

    const calendarEventObjectMetadata =
      await this.objectMetadataRepository.findOneOrFail({
        where: {
          nameSingular: 'calendarEvent',
          workspaceId: batchEvent.workspaceId,
        },
      });

    const personIds = batchEvent.events
      .flatMap((event) => event.participants ?? [])
      .map((participant) => participant.personId)
      .filter(isDefined);

    if (personIds.length === 0) {
      return;
    }

    const authContext = buildSystemAuthContext(batchEvent.workspaceId);

    const { persons, opportunities } =
      await this.globalWorkspaceOrmManager.executeInWorkspaceContext(
        async () => {
          const personRepository =
            await this.globalWorkspaceOrmManager.getRepository(
              batchEvent.workspaceId,
              'person',
              { shouldBypassPermissionChecks: true },
            );

          const fetchedPersons = await personRepository.find({
            where: { id: In(personIds) },
            select: ['id', 'companyId'],
          });

          const companyIds = fetchedPersons
            .map((p) => p.companyId)
            .filter(isDefined);

          const opportunityRepository =
            await this.globalWorkspaceOrmManager.getRepository(
              batchEvent.workspaceId,
              'opportunity',
              { shouldBypassPermissionChecks: true },
            );

          const fetchedOpportunities = await opportunityRepository.find({
            where: [
              { pointOfContactId: In(personIds) },
              ...(companyIds.length > 0 ? [{ companyId: In(companyIds) }] : []),
            ],
            select: ['id', 'companyId', 'pointOfContactId'],
          });

          return { persons: fetchedPersons, opportunities: fetchedOpportunities };
        },
        authContext,
      );

    const timelineActivityPayloads = batchEvent.events.flatMap((event) => {
      const calendarEventParticipants = event.participants ?? [];

      const calendarEventParticipantsWithPersonId =
        calendarEventParticipants.filter((participant) =>
          isDefined(participant.personId),
        );

      if (calendarEventParticipantsWithPersonId.length === 0) {
        return [];
      }

      return calendarEventParticipantsWithPersonId.flatMap((participant) => {
        const personId = participant.personId;
        if (!isDefined(personId)) {
          return [];
        }

        const payloads: any[] = [];

        payloads.push({
          name: 'message.linked',
          properties: {},
          objectSingularName: 'person',
          recordId: personId,
          workspaceMemberId: event.workspaceMemberId,
          linkedObjectMetadataId: calendarEventObjectMetadata.id,
          linkedRecordId: participant.calendarEventId,
          linkedRecordCachedName: '',
        });

        const personRecord = persons.find((p) => p.id === personId);
        const companyId = personRecord?.companyId;

        if (isDefined(companyId)) {
          payloads.push({
            name: 'message.linked',
            properties: {},
            objectSingularName: 'company',
            recordId: companyId,
            workspaceMemberId: event.workspaceMemberId,
            linkedObjectMetadataId: calendarEventObjectMetadata.id,
            linkedRecordId: participant.calendarEventId,
            linkedRecordCachedName: '',
          });
        }

        const relatedOpportunities = opportunities.filter(
          (opp) =>
            opp.pointOfContactId === personId ||
            (isDefined(companyId) && opp.companyId === companyId),
        );

        for (const opp of relatedOpportunities) {
          payloads.push({
            name: 'message.linked',
            properties: {},
            objectSingularName: 'opportunity',
            recordId: opp.id,
            workspaceMemberId: event.workspaceMemberId,
            linkedObjectMetadataId: calendarEventObjectMetadata.id,
            linkedRecordId: participant.calendarEventId,
            linkedRecordCachedName: '',
          });
        }

        return payloads;
      });
    });

    const payloadsByObjectSingularName = timelineActivityPayloads.reduce(
      (acc, payload) => {
        const key = payload.objectSingularName;
        acc[key] = [...(acc[key] || []), payload];
        return acc;
      },
      {} as Record<string, any[]>,
    );

    for (const key of Object.keys(payloadsByObjectSingularName)) {
      await this.timelineActivityRepository.upsertTimelineActivities({
        objectSingularName: key,
        workspaceId: batchEvent.workspaceId,
        payloads: payloadsByObjectSingularName[key],
      });
    }
  }
}
