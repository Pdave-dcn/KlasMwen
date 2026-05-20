import { circlePermissionService } from "../security/CirclePermissionService.js";

import { CircleCoreService } from "./core/CircleCoreService.js";
import { CircleMemberService } from "./core/CircleMemberService.js";
import { CircleMessageService } from "./core/CircleMessageService.js";
import { CircleSearchService } from "./core/CircleSearchService.js";
import { CircleValidationService } from "./core/CircleValidationService.js";
import CircleRepository from "./Repositories/CircleRepository.js";

const circleValidationService = new CircleValidationService();
const circleMemberService = new CircleMemberService(
  circleValidationService,
  circlePermissionService,
);
const circleCoreService = new CircleCoreService(
  circleMemberService,
  circlePermissionService,
);
const circleMessageService = new CircleMessageService(
  circleValidationService,
  circlePermissionService,
);
const circleSearchService = new CircleSearchService();

class CircleService {
  constructor(
    readonly core: CircleCoreService,
    readonly members: CircleMemberService,
    readonly messages: CircleMessageService,
    readonly search: CircleSearchService,
    readonly validate: CircleValidationService,
  ) {}

  getQuickStats(userId: string) {
    return CircleRepository.getQuickStats(userId);
  }
}

const circleService = new CircleService(
  circleCoreService,
  circleMemberService,
  circleMessageService,
  circleSearchService,
  circleValidationService,
);

export { CircleService, circleService };
export default circleService;
